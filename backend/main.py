import json
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from PIL import Image
import io
import cv2
import mediapipe as mp
import asyncio
from concurrent.futures import ThreadPoolExecutor

app = FastAPI(title="Sign Language API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

print("Loading model...")
model = tf.keras.models.load_model('model/asl_model.h5')
with open('model/class_indices.json') as f:
    class_indices = json.load(f)
idx_to_class = {v: k for k, v in class_indices.items()}
print("Model loaded!")

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.5
)

executor = ThreadPoolExecutor(max_workers=2)

print("Warming up...")
dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
model.predict(dummy, verbose=0)
print("Ready!")

def predict_sign(image_bytes):
    img_array = np.frombuffer(image_bytes, np.uint8)
    img_cv = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img_cv is None:
        return [{'sign': 'nothing', 'conf': 0.0}]

    # Skin color detect karo HSV se
    img_hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
    
    # Skin color range
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(img_hsv, lower_skin, upper_skin)
    
    # Noise remove karo
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=4)
    mask = cv2.erode(mask, kernel, iterations=2)
    
    # Contours dhundho
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return [{'sign': 'nothing', 'conf': 0.0}]
    
    # Sabse bada contour lo (haath hoga)
    max_contour = max(contours, key=cv2.contourArea)
    
    if cv2.contourArea(max_contour) < 3000:
        return [{'sign': 'nothing', 'conf': 0.0}]
    
    # Bounding box nikalo
    x, y, w, h = cv2.boundingRect(max_contour)
    pad = 20
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(img_cv.shape[1], x + w + pad)
    y2 = min(img_cv.shape[0], y + h + pad)
    
    hand_crop = img_cv[y1:y2, x1:x2]
    
    if hand_crop.size == 0:
        return [{'sign': 'nothing', 'conf': 0.0}]
    
    # White background pe paste karo
    white_bg = np.ones((224, 224, 3), dtype=np.uint8) * 255
    crop_h, crop_w = hand_crop.shape[:2]
    scale = min(200 / max(crop_w, 1), 200 / max(crop_h, 1))
    new_w = int(crop_w * scale)
    new_h = int(crop_h * scale)
    hand_scaled = cv2.resize(hand_crop, (new_w, new_h))
    x_off = (224 - new_w) // 2
    y_off = (224 - new_h) // 2
    white_bg[y_off:y_off+new_h, x_off:x_off+new_w] = hand_scaled
    img_final = cv2.cvtColor(white_bg, cv2.COLOR_BGR2RGB)

    arr = np.array(img_final, dtype=np.float32) / 255.0
    arr = arr.reshape(1, 224, 224, 3)
    pred = model.predict(arr, verbose=0)

    top3_idx = np.argsort(pred[0])[-3:][::-1]
    top3 = [{'sign': idx_to_class[i], 'conf': round(float(pred[0][i])*100, 1)} for i in top3_idx]
    return top3

@app.get("/")
def root():
    return {"status": "Sign Language API Running"}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    loop = asyncio.get_event_loop()
    try:
        while True:
            data = await ws.receive_bytes()
            top3 = await loop.run_in_executor(executor, predict_sign, data)
            await ws.send_json({
                'sign': top3[0]['sign'],
                'confidence': top3[0]['conf'],
                'top3': top3
            })
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")