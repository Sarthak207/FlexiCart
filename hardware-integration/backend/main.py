#!/usr/bin/env python3
"""
Smart Cart Backend (YOLOv8 + WebSocket)
Streams live camera feed with YOLO detections,
and sends detected object names to the frontend in real-time.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import cv2, threading, time, logging, json

# ---------------- CONFIG ---------------- #
CAMERA_URL = "http://192.168.1.8:8080/video"  # mobile IP webcam
CONFIDENCE_THRESHOLD = 0.6
RESIZE_WIDTH = 480
RESIZE_HEIGHT = 360
FRAME_SKIP = 2

# ---------------- LOGGING ---------------- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SmartCart")

# ---------------- FASTAPI APP ---------------- #
app = FastAPI(title="SmartCart YOLO Backend", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- YOLO MODEL ---------------- #
logger.info("🔄 Loading YOLOv8 model...")
model = YOLO("yolov8n.pt")
logger.info("✅ Model loaded successfully.")

# ---------------- CAMERA THREAD ---------------- #
latest_frame = None
lock = threading.Lock()

def frame_grabber():
    global latest_frame
    cap = cv2.VideoCapture(CAMERA_URL)
    if not cap.isOpened():
        logger.error("❌ Could not open camera stream.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue
        frame = cv2.resize(frame, (RESIZE_WIDTH, RESIZE_HEIGHT))
        with lock:
            latest_frame = frame
        time.sleep(0.01)

threading.Thread(target=frame_grabber, daemon=True).start()

# ---------------- WEBSOCKET CONNECTIONS ---------------- #
active_connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"📡 Client connected ({len(active_connections)} total).")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("❌ Client disconnected.")

async def broadcast_detections(detections):
    """Send detected object names to all connected WebSocket clients."""
    if not active_connections:
        return
    message = json.dumps({"type": "detections", "data": detections})
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        active_connections.remove(ws)

# ---------------- VIDEO STREAM WITH DETECTIONS ---------------- #
@app.get("/video_feed")
def video_feed():
    """MJPEG stream + YOLO detection + broadcast."""
    def generate_frames():
        frame_count = 0
        while True:
            global latest_frame
            if latest_frame is None:
                time.sleep(0.05)
                continue

            with lock:
                frame_copy = latest_frame.copy()

            frame_count += 1
            detections = []

            if frame_count % FRAME_SKIP == 0:
                results = model(frame_copy, verbose=False)
                boxes = results[0].boxes

                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = model.names[cls_id]
                    if conf >= CONFIDENCE_THRESHOLD:
                        detections.append({"label": label, "confidence": conf})

                        # Draw bounding boxes
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(frame_copy, f"{label} {conf:.2f}", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                # Broadcast to WebSocket clients
                if detections:
                    import asyncio
                    asyncio.run(broadcast_detections(detections))

            _, buffer = cv2.imencode(".jpg", frame_copy)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/")
async def root():
    return {"status": "running", "message": "SmartCart YOLO backend active."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
