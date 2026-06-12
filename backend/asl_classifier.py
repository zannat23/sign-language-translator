"""
ASL letter classifier using pure OpenCV.
Approach:
  1. Skin-color segmentation (HSV)
  2. Largest contour = hand
  3. Convexity defects → finger count
  4. Shape descriptors → letter classification
"""
import cv2
import numpy as np
import math


def angle_between(v1, v2):
    cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
    return math.degrees(math.acos(np.clip(cos, -1, 1)))


def get_skin_mask(img_bgr):
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    m1 = cv2.inRange(hsv, np.array([0, 15, 60]), np.array([25, 255, 255]))
    m2 = cv2.inRange(hsv, np.array([165, 15, 60]), np.array([180, 255, 255]))
    mask = cv2.bitwise_or(m1, m2)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  k, iterations=2)
    mask = cv2.dilate(mask, k, iterations=2)
    return mask


def largest_contour(mask):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    cnt = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(cnt) < 4000:
        return None
    return cnt


def count_fingers_defects(cnt):
    hull_idx = cv2.convexHull(cnt, returnPoints=False)
    if hull_idx is None or len(hull_idx) < 4:
        return 0, 0
    try:
        defects = cv2.convexityDefects(cnt, hull_idx)
    except cv2.error:
        return 0, 0
    if defects is None:
        return 0, 0

    gaps, deep = 0, 0
    for i in range(defects.shape[0]):
        s, e, f, d = defects[i, 0]
        depth = d / 256.0
        start = cnt[s][0].astype(float)
        end   = cnt[e][0].astype(float)
        far   = cnt[f][0].astype(float)
        v1 = start - far
        v2 = end   - far
        ang = angle_between(v1, v2)
        if depth > 12 and ang < 90:
            gaps += 1
        if depth > 25 and ang < 80:
            deep += 1
    return gaps, deep


def fingertip_count(cnt, cy):
    pts = cnt[:, 0, :]
    above = pts[pts[:, 1] < cy - 10]
    if len(above) < 3:
        return 0
    above = above[np.argsort(above[:, 0])]
    ys = above[:, 1]
    if len(ys) > 10:
        ys = np.convolve(ys, np.ones(5)/5, mode='valid')
    peaks = 0
    in_valley = True
    prev = ys[0] if len(ys) else cy
    for y in ys:
        if y < prev - 5:
            in_valley = False
        elif y > prev + 5 and not in_valley:
            peaks += 1
            in_valley = True
        prev = y
    if not in_valley:
        peaks += 1
    return min(peaks, 5)


def shape_features(cnt, mask):
    area = cv2.contourArea(cnt)
    hull = cv2.convexHull(cnt)
    hull_area = cv2.contourArea(hull)
    solidity = area / max(hull_area, 1)
    x, y, bw, bh = cv2.boundingRect(cnt)
    aspect = bw / max(bh, 1)
    perimeter = cv2.arcLength(cnt, True)
    circularity = (4 * math.pi * area) / max(perimeter ** 2, 1)
    M = cv2.moments(cnt)
    cx = int(M['m10'] / max(M['m00'], 1))
    cy = int(M['m01'] / max(M['m00'], 1))
    top_pixels  = np.sum(mask[:cy, :] > 0)
    bot_pixels  = np.sum(mask[cy:, :] > 0)
    total_pixels = max(top_pixels + bot_pixels, 1)
    top_ratio   = top_pixels / total_pixels
    return dict(area=area, solidity=solidity, aspect=aspect,
                circularity=circularity, cx=cx, cy=cy,
                top_ratio=top_ratio, bw=bw, bh=bh, x=x, y=y)


def classify_asl(img_bgr):
    """Returns (letter_str, confidence_0_to_100)."""
    mask = get_skin_mask(img_bgr)
    cnt  = largest_contour(mask)
    if cnt is None:
        return 'nothing', 0.0

    gaps, deep = count_fingers_defects(cnt)
    sf = shape_features(cnt, mask)

    sol  = sf['solidity']
    asp  = sf['aspect']
    circ = sf['circularity']
    top  = sf['top_ratio']
    cy   = sf['cy']

    tips = fingertip_count(cnt, cy)

    if gaps >= 4 or tips >= 5:
        return ('b', 90) if sol > 0.75 else ('space', 88)
    if gaps == 3 or tips == 4:
        return 'w', 85
    if gaps == 2 or tips == 3:
        return ('w', 80) if asp < 0.6 else ('v', 78)
    if gaps == 1 or tips == 2:
        if sol > 0.80:
            return ('h', 82) if asp > 1.0 else ('u', 85)
        return 'v', 85
    if tips == 1 and asp > 0.80 and top > 0.45:
        return 'l', 82
    if tips == 1 and asp < 0.55 and top > 0.50 and sol < 0.80:
        return 'd', 80
    if tips == 1 and asp < 0.55 and top < 0.40:
        return 'i', 80
    if tips == 1 and asp > 1.1:
        return 'g', 75
    if tips == 1:
        return 'z', 68

    if gaps == 0 and tips == 0:
        if circ > 0.60 and sol > 0.85:
            return 'o', 82
        if circ > 0.45 and sol < 0.85 and asp > 0.7:
            return 'c', 78
        if sol < 0.82 and top < 0.35:
            return 'a', 80
        if top > 0.45 and sol > 0.82:
            return 'e', 76
        if top > 0.38 and sol > 0.80 and asp < 0.85:
            return 't', 72
        if sol > 0.82:
            return 's', 78
        return 'a', 68

    if sol > 0.80:
        return 's', 65
    return 'nothing', 0.0