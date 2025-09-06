#!/usr/bin/env python3
"""
Object Detection Integration for Smart Cart
Uses Pi Camera with MobileNet for product recognition
"""

import cv2
import numpy as np
import tensorflow as tf
import requests
import time
import logging
from typing import Optional, Dict, Any, List
import json

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
        
    def initialize_camera(self, camera_index: int = 0) -> bool:
        """
        Initialize camera
        
        Args:
            camera_index: Camera index (0 for default camera)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.camera = cv2.VideoCapture(camera_index)
            if not self.camera.isOpened():
                logger.error("Failed to open camera")
                return False
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            logger.info("Camera initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return False
    
    def load_model(self, model_path: str = None) -> bool:
        """
        Load MobileNet model
        
        Args:
            model_path: Path to model file (if None, uses default MobileNet)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if model_path:
                # Load custom model
                self.model = tf.keras.models.load_model(model_path)
            else:
                # Use pre-trained MobileNet
                self.model = tf.keras.applications.MobileNetV2(
                    input_shape=(224, 224, 3),
                    include_top=True,
                    weights='imagenet'
                )
            
            # Load class names for ImageNet
            with open('imagenet_classes.json', 'r') as f:
                self.class_names = json.load(f)
            
            logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for model input
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        # Resize to model input size
        resized = cv2.resize(image, (224, 224))
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        # Normalize pixel values
        normalized = rgb.astype(np.float32) / 255.0
        
        # Add batch dimension
        batched = np.expand_dims(normalized, axis=0)
        
        return batched
    
    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect objects in image
        
        Args:
            image: Input image
            
        Returns:
            List of detected objects with confidence scores
        """
        try:
            # Preprocess image
            processed = self.preprocess_image(image)
            
            # Run inference
            predictions = self.model.predict(processed, verbose=0)
            
            # Get top predictions
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
        """
        Map detected object to product
        
        Args:
            detection: Detection result
            
        Returns:
            Product data or None if not found
        """
        class_name = detection["class_name"].lower()
        confidence = detection["confidence"]
        
        # Check for exact matches first
        for product_key, product_data in self.product_mapping.items():
            if product_key in class_name and confidence >= product_data["confidence_threshold"]:
                return product_data
        
        # Check for partial matches
        for product_key, product_data in self.product_mapping.items():
            if any(word in class_name for word in product_key.split()) and confidence >= product_data["confidence_threshold"]:
                return product_data
        
        return None
    
    def send_to_cart(self, product_data: Dict[str, Any], confidence: float, user_id: str = "demo_user") -> bool:
        """
        Send product data to cart via API
        
        Args:
            product_data: Product information
            confidence: Detection confidence
            user_id: User ID for the cart
            
        Returns:
            True if successful, False otherwise
        """
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
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully added {product_data['name']} to cart (confidence: {confidence:.2f})")
                return True
            else:
                logger.error(f"Failed to add item to cart: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return False
    
    def process_frame(self, image: np.ndarray) -> bool:
        """
        Process a single frame for object detection
        
        Args:
            image: Input frame
            
        Returns:
            True if item was added to cart
        """
        current_time = time.time()
        
        # Check if enough time has passed since last detection
        if current_time - self.last_detection_time < self.detection_interval:
            return False
        
        # Detect objects
        detections = self.detect_objects(image)
        
        if not detections:
            return False
        
        # Process each detection
        item_added = False
        for detection in detections:
            product_data = self.map_detection_to_product(detection)
            
            if product_data:
                logger.info(f"Detected: {product_data['name']} (confidence: {detection['confidence']:.2f})")
                
                # Add to cart
                success = self.send_to_cart(product_data, detection['confidence'])
                
                if success:
                    self.last_detection_time = current_time
                    item_added = True
                    self.indicate_success()
                    break  # Only add one item per detection cycle
        
        return item_added
    
    def indicate_success(self):
        """Indicate successful detection"""
        logger.info("✓ Success indicator")
        # In a real implementation, this would control LEDs, buzzers, etc.
    
    def indicate_error(self):
        """Indicate error"""
        logger.warning("✗ Error indicator")
        # In a real implementation, this would control LEDs, buzzers, etc.
    
    def start_detection(self):
        """Start the object detection loop"""
        if not self.camera or not self.model:
            logger.error("Camera or model not initialized")
            return
        
        logger.info("Starting object detection...")
        self.running = True
        
        try:
            while self.running:
                # Capture frame
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("Failed to capture frame")
                    continue
                
                # Process frame
                self.process_frame(frame)
                
                # Display frame (optional, for debugging)
                # cv2.imshow('Object Detection', frame)
                # if cv2.waitKey(1) & 0xFF == ord('q'):
                #     break
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Detection stopped by user")
        except Exception as e:
            logger.error(f"Error in detection loop: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.camera:
            self.camera.release()
        cv2.destroyAllWindows()

def main():
    """Main function"""
    # Configuration
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    CAMERA_INDEX = 0  # Use default camera
    
    # Create detector instance
    detector = ObjectDetector(API_ENDPOINT)
    
    try:
        # Initialize camera
        if not detector.initialize_camera(CAMERA_INDEX):
            logger.error("Failed to initialize camera")
            return
        
        # Load model
        if not detector.load_model():
            logger.error("Failed to load model")
            return
        
        # Start detection
        detector.start_detection()
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        detector.cleanup()

if __name__ == "__main__":
    main()
