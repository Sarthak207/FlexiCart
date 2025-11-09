#!/usr/bin/env python3
"""
YOLOv8 Object Detection for Smart Cart
Supports IP Webcam (mobile camera) or local USB/PiCam
Displays live video stream with bounding boxes and detected product labels
"""

import cv2
import time
import requests
import logging
import numpy as np
from ultralytics import YOLO
from typing import Optional, Dict, Any, List

# -------------------- CONFIG -------------------- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SmartCart-YOLO")

class SmartCartYOLO:
    def __init__(self, api_endpoint: str = "http://localhost:8000/api/cart/add-item"):
        """Initialize YOLO-based detector"""
        self.api_endpoint = api_endpoint
        self.camera = None
        self.model = None
        self.running = False
        self.snapshot_url = None
        self.last_detection_time = 0
        self.detection_interval = 2.0  # seconds between API calls

        # Known SmartCart product mappings (example set)
        self.product_mapping = {
            "apple": {"id": "1", "name": "Red Apples", "price": 2.99},
            "banana": {"id": "2", "name": "Bananas", "price": 1.49},
            "bottle": {"id": "3", "name": "Water Bottle", "price": 0.99},
            "cup": {"id": "4", "name": "Tea Cup", "price": 2.49},
            "orange": {"id": "5", "name": "Oranges", "price": 3.29},
            "bread": {"id": "6", "name": "Whole Wheat Bread", "price": 1.99},
            "milk": {"id": "7", "name": "Amul Milk", "price": 2.99},
            "packet": {"id": "8", "name": "Snack Packet", "price": 1.50}
        }

    # -------------------- CAMERA INIT -------------------- #
    def initialize_camera(self, camera_source: str = 0) -> bool:
        """Initialize camera (IP Webcam or USB/PiCam)"""
        try:
            logger.info(f"🎥 Initializing camera source: {camera_source}")

            if isinstance(camera_source, str) and camera_source.startswith("http"):
                self.camera = cv2.VideoCapture(camera_source)
                base_url = camera_source.split("/video")[0]
                self.snapshot_url = f"{base_url}/shot.jpg"
            else:
                self.camera = cv2.VideoCapture(int(camera_source))

            if not self.camera.isOpened():
                logger.error("❌ Failed to open video stream.")
                return False

            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            logger.info("✅ Camera initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return False

    # -------------------- YOLO MODEL -------------------- #
    def load_model(self, model_name: str = "yolov8n.pt") -> bool:
        """Load YOLOv8 model"""
        try:
            self.model = YOLO(model_name)
            logger.info(f"✅ YOLOv8 model loaded successfully: {model_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to load YOLO model: {e}")
            return False

    # -------------------- DETECTION LOGIC -------------------- #
    def detect_objects(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run YOLO inference on frame"""
        try:
            results = self.model(frame, stream=False, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = self.model.names[cls_id]
                    detections.append({
                        "class_name": class_name,
                        "confidence": conf,
                        "bbox": box.xyxy[0].tolist()
                    })
            return detections
        except Exception as e:
            logger.error(f"Detection error: {e}")
            return []

    def map_to_product(self, class_name: str) -> Optional[Dict[str, Any]]:
        """Map YOLO class to SmartCart product"""
        class_name = class_name.lower()
        for key, value in self.product_mapping.items():
            if key in class_name:
                return value
        return None

    def send_to_cart(self, product: Dict[str, Any], confidence: float, user_id: str = "demo_user"):
        """Send detection to backend"""
        try:
            payload = {
                "user_id": user_id,
                "product_id": product["id"],
                "quantity": 1,
                "scan_type": "camera",
                "scan_value": f"detected_{product['id']}",
                "confidence": confidence,
                "timestamp": time.time()
            }
            response = requests.post(
                self.api_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            if response.status_code == 200:
                logger.info(f"🛒 Added {product['name']} to cart (conf={confidence:.2f})")
            else:
                logger.warning(f"⚠️ API returned {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error sending to cart API: {e}")

    # -------------------- MAIN DETECTION LOOP -------------------- #
    def start_detection(self):
        """Start YOLO live detection"""
        if not self.model or not self.camera:
            logger.error("YOLO model or camera not initialized.")
            return

        logger.info("🚀 Starting YOLO detection... Press 'q' to quit.")
        self.running = True

        try:
            while self.running:
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("⚠️ Frame capture failed, skipping...")
                    time.sleep(0.1)
                    continue

                detections = self.detect_objects(frame)

                for det in detections:
                    x1, y1, x2, y2 = map(int, det["bbox"])
                    cls = det["class_name"]
                    conf = det["confidence"]

                    # Draw bounding box and label
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    label = f"{cls} ({conf*100:.1f}%)"
                    cv2.putText(frame, label, (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                    # Send to backend if mapped product found and interval passed
                    if time.time() - self.last_detection_time > self.detection_interval:
                        product = self.map_to_product(cls)
                        if product:
                            self.send_to_cart(product, conf)
                            self.last_detection_time = time.time()

                cv2.imshow("Smart Cart - YOLOv8 Live Feed", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    logger.info("🛑 Exiting YOLO detection loop.")
                    break

        except KeyboardInterrupt:
            logger.info("Interrupted by user.")
        finally:
            self.cleanup()

    def cleanup(self):
        """Cleanup resources"""
        if self.camera:
            self.camera.release()
        cv2.destroyAllWindows()
        self.running = False
        logger.info("🧹 Cleaned up resources.")


# -------------------- MAIN -------------------- #
def main():
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    CAMERA_SOURCE = "http://192.168.1.8:8080/video"  # IP Webcam stream
    MODEL_NAME = "yolov8n.pt"  # lightweight, fast model

    detector = SmartCartYOLO(API_ENDPOINT)
    if not detector.initialize_camera(CAMERA_SOURCE):
        logger.error("Camera initialization failed.")
        return
    if not detector.load_model(MODEL_NAME):
        logger.error("YOLO model failed to load.")
        return
    detector.start_detection()


if __name__ == "__main__":
    main()
