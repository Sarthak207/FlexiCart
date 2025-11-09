#!/usr/bin/env python3
"""
Object Detection Integration for Smart Cart
Supports IP Webcam (mobile camera) or local USB/PiCam
Displays live video stream with all detected object labels overlayed
"""

import cv2
import numpy as np
import tensorflow as tf
import requests
import time
import logging
from typing import Optional, Dict, Any, List
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ObjectDetector:
    def __init__(self, api_endpoint: str = "http://localhost:8000/api/cart/add-item"):
        """Initialize object detector"""
        self.api_endpoint = api_endpoint
        self.camera = None
        self.model = None
        self.class_names = []
        self.running = False
        self.snapshot_url = None

        # Product mapping for Smart Cart
        self.product_mapping = {
            "apple": {"id": "1", "name": "Red Apples", "price": 2.99, "weight": 150, "confidence_threshold": 0.7},
            "banana": {"id": "4", "name": "Bananas", "price": 1.29, "weight": 120, "confidence_threshold": 0.7},
            "bread": {"id": "2", "name": "Whole Wheat Bread", "price": 1.99, "weight": 400, "confidence_threshold": 0.6},
            "milk": {"id": "3", "name": "Fresh Milk", "price": 3.49, "weight": 1000, "confidence_threshold": 0.6},
            "cheese": {"id": "5", "name": "Cheddar Cheese", "price": 4.99, "weight": 250, "confidence_threshold": 0.6},
            "croissant": {"id": "6", "name": "Croissants", "price": 3.99, "weight": 180, "confidence_threshold": 0.6},
            "orange": {"id": "7", "name": "Orange Juice", "price": 2.79, "weight": 950, "confidence_threshold": 0.5},
            "chicken": {"id": "8", "name": "Chicken Breast", "price": 7.99, "weight": 450, "confidence_threshold": 0.6},
        }

        # Detection settings
        self.detection_interval = 2.0
        self.last_detection_time = 0
        self.min_confidence = 0.5

    # -------------------- CAMERA INITIALIZATION -------------------- #
    def initialize_camera(self, camera_source: str = 0) -> bool:
        """Initialize camera (supports USB/PiCam or IP Webcam)"""
        try:
            logger.info(f"Initializing camera source: {camera_source}")

            if isinstance(camera_source, str) and camera_source.startswith("http"):
                self.camera = cv2.VideoCapture(camera_source)
                base_url = camera_source.split("/video")[0]
                self.snapshot_url = f"{base_url}/shot.jpg"
            else:
                self.camera = cv2.VideoCapture(int(camera_source))

            if not self.camera.isOpened():
                logger.warning("Failed to open video stream. Trying snapshot fallback...")
                if self.snapshot_url:
                    test_frame = self.get_ip_snapshot()
                    if test_frame is not None:
                        logger.info("Using snapshot mode from IP Webcam.")
                        return True
                    else:
                        logger.error("Snapshot test failed. Camera not accessible.")
                        return False
                return False

            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 15)

            logger.info("Camera initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return False

    def get_ip_snapshot(self) -> Optional[np.ndarray]:
        """Capture single frame from IP Webcam snapshot endpoint"""
        if not self.snapshot_url:
            return None
        try:
            resp = requests.get(self.snapshot_url, timeout=3)
            if resp.status_code == 200:
                img_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                return frame
        except Exception as e:
            logger.error(f"Error fetching snapshot: {e}")
        return None

    # -------------------- MODEL & DETECTION -------------------- #
    def load_model(self, model_path: str = None) -> bool:
        """Load MobileNetV2 model"""
        try:
            if model_path:
                self.model = tf.keras.models.load_model(model_path)
            else:
                self.model = tf.keras.applications.MobileNetV2(
                    input_shape=(224, 224, 3),
                    include_top=True,
                    weights='imagenet'
                )

            with open('imagenet_classes.json', 'r') as f:
                self.class_names = json.load(f)

            logger.info("Model loaded successfully")
            return True

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for inference"""
        resized = cv2.resize(image, (224, 224))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = rgb.astype(np.float32) / 255.0
        return np.expand_dims(normalized, axis=0)

    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Run inference and return top labels"""
        try:
            processed = self.preprocess_image(image)
            predictions = self.model.predict(processed, verbose=0)
            top_indices = np.argsort(predictions[0])[-5:][::-1]
            detections = []

            for idx in top_indices:
                confidence = float(predictions[0][idx])
                class_name = self.class_names[idx] if idx < len(self.class_names) else f"class_{idx}"
                if confidence > self.min_confidence:
                    detections.append({
                        "class_name": class_name,
                        "confidence": confidence,
                        "class_id": idx
                    })
            return detections
        except Exception as e:
            logger.error(f"Detection error: {e}")
            return []

    def map_detection_to_product(self, detection: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map detection to known Smart Cart products"""
        class_name = detection["class_name"].lower()
        confidence = detection["confidence"]
        for product_key, product_data in self.product_mapping.items():
            if product_key in class_name and confidence >= product_data["confidence_threshold"]:
                return product_data
        for product_key, product_data in self.product_mapping.items():
            if any(word in class_name for word in product_key.split()) and confidence >= product_data["confidence_threshold"]:
                return product_data
        return None

    # -------------------- API COMMUNICATION -------------------- #
    def send_to_cart(self, product_data: Dict[str, Any], confidence: float, user_id: str = "demo_user") -> bool:
        """Send detected item to backend API"""
        try:
            payload = {
                "user_id": user_id,
                "product_id": product_data["id"],
                "quantity": 1,
                "scan_type": "camera",
                "scan_value": f"detected_{product_data['id']}",
                "confidence": confidence,
                "timestamp": time.time()
            }
            response = requests.post(self.api_endpoint, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if response.status_code == 200:
                logger.info(f"Added {product_data['name']} (conf: {confidence:.2f})")
                return True
            logger.error(f"Cart API failed: {response.status_code}")
            return False
        except Exception as e:
            logger.error(f"API error: {e}")
            return False

    # -------------------- FRAME PROCESSING -------------------- #
    def process_frame(self, frame: np.ndarray) -> List[str]:
        """
        Process frame and return list of detected labels for overlay.
        Also sends known products to backend if matched.
        """
        current_time = time.time()
        labels_to_display = []

        # Run detection every interval
        if current_time - self.last_detection_time >= self.detection_interval:
            detections = self.detect_objects(frame)
            if detections:
                for detection in detections:
                    class_name = detection['class_name']
                    confidence = detection['confidence']
                    labels_to_display.append(f"{class_name} ({confidence*100:.1f}%)")

                    # Map to Smart Cart product
                    product_data = self.map_detection_to_product(detection)
                    if product_data:
                        if self.send_to_cart(product_data, confidence):
                            self.last_detection_time = current_time
                            self.indicate_success()

        return labels_to_display

    # -------------------- MAIN LOOP -------------------- #
    def start_detection(self):
        """Start detection and display live stream"""
        if not self.model:
            logger.error("Model not loaded")
            return

        logger.info("Starting live detection... Press 'q' to quit.")
        self.running = True

        try:
            while self.running:
                frame = None
                if self.camera and self.camera.isOpened():
                    ret, frame = self.camera.read()
                    if not ret:
                        frame = self.get_ip_snapshot()
                else:
                    frame = self.get_ip_snapshot()

                if frame is not None:
                    labels = self.process_frame(frame)

                    # Overlay all detected object names
                    if labels:
                        y_offset = 40
                        for label in labels:
                            cv2.putText(frame, label, (20, y_offset),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                            y_offset += 30

                    cv2.imshow("Smart Cart - Live Camera", frame)
                else:
                    logger.warning("No frame available.")

                # Exit on 'q' key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    logger.info("Exiting...")
                    break

                time.sleep(0.05)

        except KeyboardInterrupt:
            logger.info("Detection stopped by user.")
        finally:
            self.cleanup()

    def indicate_success(self):
        logger.info("✓ Success indicator")

    def cleanup(self):
        self.running = False
        if self.camera:
            self.camera.release()
        cv2.destroyAllWindows()


def main():
    """Entry point"""
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    CAMERA_SOURCE = "http://192.168.1.8:8080/video"  # Mobile IP Webcam URL

    detector = ObjectDetector(API_ENDPOINT)
    if not detector.initialize_camera(CAMERA_SOURCE):
        logger.error("Failed to initialize camera")
        return
    if not detector.load_model():
        logger.error("Failed to load model")
        return
    detector.start_detection()


if __name__ == "__main__":
    main()
