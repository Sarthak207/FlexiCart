#!/usr/bin/env python3
"""
Smart Cart Backend Integration API
Handles hardware integrations, load cell updates, and AI camera stream.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json, time, logging, os, cv2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smart Cart Hardware Integration API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CartItemRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: int = 1
    scan_type: str
    scan_value: str
    confidence: Optional[float] = None
    timestamp: float


@app.get("/")
async def root():
    return {"message": "Smart Cart API running", "status": "ok"}

# ---------------- CAMERA STREAM ---------------- #
CAMERA_URL = "http://192.168.1.8:8080/video"  # Your mobile IP webcam URL

@app.get("/video_feed")
def video_feed():
    """Returns an MJPEG video stream for frontend display."""
    def generate_frames():
        cap = cv2.VideoCapture(CAMERA_URL)
        if not cap.isOpened():
            logger.error("❌ Cannot open camera stream.")
            return

        while True:
            success, frame = cap.read()
            if not success:
                break

            # OPTIONAL: add overlay text for placeholder detection
            cv2.putText(frame, "SmartCart AI Feed", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        cap.release()

    return Response(generate_frames(), media_type='multipart/x-mixed-replace; boundary=frame')
