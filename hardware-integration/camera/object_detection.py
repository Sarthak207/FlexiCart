#!/usr/bin/env python3
"""
Object Detection Integration for Smart Cart
Now supports IP Webcam (mobile camera) or local USB/PiCam
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
        """
        Initialize object detector
        
        Args:
            api_endpoint: Backend API endpoint for adding items to cart
        """
        self.api_endpoint = api_endpoint
        self.camera = None
        self.model = None
        self.class_names = []
        self.running = False
        
        # Product mapping based on detected objects
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
        self.detection_interval = 2.0  # seconds between detections
        self.last_detection_time = 0
        self.min_confidence = 0.5

        # Snapshot fallback (for IP Webcam)
        self.snapshot_url = None

    def initialize_camera(self, camera_source: str = 0) -> bool:
        """
        Initialize camera (supports USB/PiCam or IP Webcam)
        """
        try:
            logger.info(f"Initializing camera source: {camera_source}")

            # Check if using IP Webcam stream (http://)
            if isinstance(camera_source, str) and camera_source.startswith("http"):
                self.camera = cv2.VideoCapture(camera_source)
                # Also store snapshot URL as fallback
                base_url = camera_source.split("/video")[0]
                self.snapshot_url = f"{base_url}/shot.jpg"
            else:
                self.camera = cv2.VideoCapture(int(camera_source))

            if not self.camera.isOpened():
                logger.warning("Failed to open camera stream. Trying snapshot fallback (IP Webcam)...")
                if self.snapshot_url:
                    test_frame = self.get_ip_snapshot()
                    if test_frame is not None:
                        logger.info("Using snapshot mode from IP Webcam.")
                        return True
                    else:
                        logger.error("Snapshot test failed. Camera not accessible.")
                        return False
                else:
                    logger.error("No valid camera stream found.")
                    return False

            # Configure camera (if it's a local webcam)
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 15)

            logger.info("Camera initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return False

    def get_ip_snapshot(self) -> Optional[np.ndarray]:
        """
        Capture single frame from IP Webcam snapshot endpoint
        """
        if not self.snapshot_url:
            return None
        try:
            resp = requests.get(self.snapshot_url, timeout=3)
            if resp.status_code == 200:
                img_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                return frame
        except Exception as e:
            logger.error(f"Error fetching snapshot from IP cam: {e}")
        return None

    def load_model(self, model_path: str = None) -> bool:
        """Load MobileNet model"""
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
        """Preprocess image for model input"""
        resized = cv2.resize(image, (224, 224))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = rgb.astype(np.float32) / 255.0
        return np.expand_dims(normalized, axis=0)

    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects in image"""
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
            logger.error(f"Error in object detection: {e}")
            return []

    def map_detection_to_product(self, detection: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map detected object to known product"""
        class_name = detection["class_name"].lower()
        confidence = detection["confidence"]
        for product_key, product_data in self.product_mapping.items():
            if product_key in class_name and confidence >= product_data["confidence_threshold"]:
                return product_data
        for product_key, product_data in self.product_mapping.items():
            if any(word in class_name for word in product_key.split()) and confidence >= product_data["confidence_threshold"]:
                return product_data
        return None

    def send_to_cart(self, product_data: Dict[str, Any], confidence: float, user_id: str = "demo_user") -> bool:
        """Send product data to backend"""
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
                logger.info(f"Added {product_data['name']} to cart (confidence: {confidence:.2f})")
                return True
            else:
                logger.error(f"Failed to add item to cart: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return False

    def process_frame(self, image: np.ndarray) -> bool:
        """Process a single frame for detection"""
        current_time = time.time()
        if current_time - self.last_detection_time < self.detection_interval:
            return False

        detections = self.detect_objects(image)
        if not detections:
            return False

        for detection in detections:
            product_data = self.map_detection_to_product(detection)
            if product_data:
                logger.info(f"Detected: {product_data['name']} (conf: {detection['confidence']:.2f})")
                if self.send_to_cart(product_data, detection['confidence']):
                    self.last_detection_time = current_time
                    self.indicate_success()
                    return True
        return False

    def indicate_success(self):
        logger.info("✓ Success indicator")

    def indicate_error(self):
        logger.warning("✗ Error indicator")

    def start_detection(self):
        """Main detection loop"""
        if not self.model:
            logger.error("Model not loaded.")
            return

        logger.info("Starting object detection...")
        self.running = True

        try:
            while self.running:
                frame = None
                if self.camera and self.camera.isOpened():
                    ret, frame = self.camera.read()
                    if not ret:
                        logger.warning("Frame capture failed, trying snapshot...")
                        frame = self.get_ip_snapshot()
                else:
                    frame = self.get_ip_snapshot()

                if frame is not None:
                    self.process_frame(frame)
                else:
                    logger.warning("No frame available.")

                time.sleep(0.1)
        except KeyboardInterrupt:
            logger.info("Detection stopped by user")
        except Exception as e:
            logger.error(f"Error in detection loop: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        self.running = False
        if self.camera:
            self.camera.release()
        cv2.destroyAllWindows()


def main():
    """Main function"""
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    CAMERA_SOURCE = "http://192.168.1.8:8080/video"  # Replace with your mobile IP Webcam URL

    detector = ObjectDetector(API_ENDPOINT)
    try:
        if not detector.initialize_camera(CAMERA_SOURCE):
            logger.error("Failed to initialize IP camera stream")
            return

        if not detector.load_model():
            logger.error("Failed to load model")
            return

        detector.start_detection()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        detector.cleanup()


if __name__ == "__main__":
    main()
