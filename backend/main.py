import json
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import asyncio
from concurrent.futures import ThreadPoolExecutor
from asl_classifier import classify_asl

app = FastAPI(title="Sign Language API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

CLASS_INDICES_PATH = 'model/class_indices.json'
if os.path.exists(CLASS_INDICES_PATH):
    with open(CLASS_INDICES_PATH) as f:
        class_indices = json.load(f)
else:
    class_indices = {}

executor = ThreadPoolExecutor(max_workers=2)
print("Sign Language API ready!")

def predict_sign(image_bytes):
    img_array = np.frombuffer(image_bytes, np.uint8)
    img_cv = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img_cv is None:
        return [{'sign': 'nothing', 'conf': 0.0}]
    sign, conf = classify_asl(img_cv)
    if sign == 'nothing' or conf < 60:
        return [{'sign': 'nothing', 'conf': 0.0}]
    return [{'sign': sign, 'conf': float(conf)}]

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
            await ws.send_json({'sign': top3[0]['sign'], 'confidence': top3[0]['conf'], 'top3': top3})
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")