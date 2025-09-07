#!/usr/bin/env python3
"""
Barcode Scanner Integration for Smart Cart (Caper AI Style)
Supports multiple barcode formats and integrates with camera-based scanning
"""

import cv2
import numpy as np
import requests
import time
import logging
import json
import threading
from typing import Optional, Dict, Any, List
from pyzbar import pyzbar
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BarcodeScanner:
    def __init__(self, api_endpoint: str = "http://localhost:8000/api/cart/add-item"):
        """
        Initialize barcode scanner
        
        Args:
            api_endpoint: Backend API endpoint for adding items to cart
        """
        self.api_endpoint = api_endpoint
        self.camera = None
        self.running = False
        self.last_scan_time = 0
        self.scan_cooldown = 2.0  # seconds between scans of same barcode
        self.recent_scans = {}  # Track recent scans to prevent duplicates
        
        # Enhanced product database with barcodes (simulating real product database)
        self.product_database = {
            "000000000000": {"id": "1", "name": "Red Apples", "price": 2.99, "weight": 150, "category": "fruits", "brand": "Fresh Farm"},
            "000000000001": {"id": "2", "name": "Whole Wheat Bread", "price": 1.99, "weight": 400, "category": "bakery", "brand": "Artisan Bakery"},
            "000000000002": {"id": "3", "name": "Fresh Milk", "price": 3.49, "weight": 1000, "category": "dairy", "brand": "Farm Fresh"},
            "000000000003": {"id": "4", "name": "Bananas", "price": 1.29, "weight": 120, "category": "fruits", "brand": "Tropical Farms"},
            "000000000004": {"id": "5", "name": "Cheddar Cheese", "price": 4.99, "weight": 250, "category": "dairy", "brand": "Artisan Cheese"},
            "000000000005": {"id": "6", "name": "Croissants", "price": 3.99, "weight": 180, "category": "bakery", "brand": "French Bakery"},
            "000000000006": {"id": "7", "name": "Orange Juice", "price": 2.79, "weight": 950, "category": "beverages", "brand": "Pure Orange"},
            "000000000007": {"id": "8", "name": "Chicken Breast", "price": 7.99, "weight": 450, "category": "meat", "brand": "Premium Poultry"},
            # Common barcode formats for testing
            "123456789012": {"id": "9", "name": "Test Product", "price": 1.00, "weight": 100, "category": "test", "brand": "Test Brand"},
            "1234567890123": {"id": "10", "name": "Demo Item", "price": 5.00, "weight": 200, "category": "demo", "brand": "Demo Co"},
        }
        
    def initialize_camera(self, camera_index: int = 0) -> bool:
        """
        Initialize camera for barcode scanning
        
        Args:
            camera_index: Camera index (0 for default)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.camera = cv2.VideoCapture(camera_index)
            if not self.camera.isOpened():
                logger.error("Failed to open camera")
                return False
            
            # Set camera properties for optimal barcode scanning
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            self.camera.set(cv2.CAP_PROP_AUTOFOCUS, 1)
            
            logger.info("Camera initialized successfully for barcode scanning")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return False
    
    def scan_barcodes(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Scan barcodes in the given frame
        
        Args:
            frame: Input image frame
            
        Returns:
            List of detected barcodes with data and positions
        """
        try:
            # Decode barcodes in the frame
            barcodes = pyzbar.decode(frame)
            
            detected_barcodes = []
            for barcode in barcodes:
                # Extract barcode data
                barcode_data = barcode.data.decode('utf-8')
                barcode_type = barcode.type
                
                # Get bounding box
                (x, y, w, h) = barcode.rect
                
                detected_barcodes.append({
                    'data': barcode_data,
                    'type': barcode_type,
                    'position': (x, y, w, h),
                    'timestamp': time.time()
                })
                
                logger.info(f"Barcode detected: {barcode_data} (Type: {barcode_type})")
            
            return detected_barcodes
            
        except Exception as e:
            logger.error(f"Error scanning barcodes: {e}")
            return []
    
    def lookup_product(self, barcode: str) -> Optional[Dict[str, Any]]:
        """
        Look up product by barcode
        
        Args:
            barcode: Barcode string to look up
            
        Returns:
            Product data or None if not found
        """
        # First check local database
        product = self.product_database.get(barcode)
        if product:
            return product
        
        # In production, this would query external APIs or databases
        # For now, return a generic product for unknown barcodes
        logger.warning(f"Unknown barcode: {barcode}")
        return {
            "id": f"unknown_{barcode}",
            "name": f"Unknown Product ({barcode})",
            "price": 0.99,
            "weight": 100,
            "category": "unknown",
            "brand": "Unknown Brand",
            "barcode": barcode
        }
    
    def is_recent_scan(self, barcode: str) -> bool:
        """
        Check if barcode was recently scanned to prevent duplicates
        
        Args:
            barcode: Barcode to check
            
        Returns:
            True if recently scanned, False otherwise
        """
        current_time = time.time()
        
        # Clean old scans
        self.recent_scans = {
            code: scan_time 
            for code, scan_time in self.recent_scans.items() 
            if current_time - scan_time < self.scan_cooldown
        }
        
        # Check if this barcode was recently scanned
        if barcode in self.recent_scans:
            return True
        
        return False
    
    def add_to_cart(self, product_data: Dict[str, Any], barcode: str, user_id: str = "demo_user") -> bool:
        """
        Add product to cart via API
        
        Args:
            product_data: Product information
            barcode: Original barcode
            user_id: User ID for the cart
            
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = {
                "user_id": user_id,
                "product_id": product_data["id"],
                "quantity": 1,
                "scan_type": "barcode",
                "scan_value": barcode,
                "timestamp": time.time(),
                "product_name": product_data["name"],
                "product_price": product_data["price"],
                "product_weight": product_data["weight"]
            }
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully added {product_data['name']} to cart")
                self.indicate_success()
                return True
            else:
                logger.error(f"Failed to add item to cart: {response.status_code} - {response.text}")
                self.indicate_error()
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            self.indicate_error()
            return False
    
    def process_frame(self, frame: np.ndarray) -> bool:
        """
        Process a single frame for barcode detection
        
        Args:
            frame: Input frame
            
        Returns:
            True if item was added to cart
        """
        # Scan for barcodes
        barcodes = self.scan_barcodes(frame)
        
        if not barcodes:
            return False
        
        # Process each barcode
        item_added = False
        for barcode_info in barcodes:
            barcode = barcode_info['data']
            
            # Check if recently scanned
            if self.is_recent_scan(barcode):
                continue
            
            # Look up product
            product_data = self.lookup_product(barcode)
            
            if product_data:
                # Add to cart
                success = self.add_to_cart(product_data, barcode)
                
                if success:
                    # Mark as recently scanned
                    self.recent_scans[barcode] = time.time()
                    item_added = True
                    
                    # Draw bounding box on frame (for debugging)
                    self.draw_barcode_box(frame, barcode_info)
        
        return item_added
    
    def draw_barcode_box(self, frame: np.ndarray, barcode_info: Dict[str, Any]):
        """
        Draw bounding box around detected barcode
        
        Args:
            frame: Image frame
            barcode_info: Barcode detection info
        """
        try:
            (x, y, w, h) = barcode_info['position']
            
            # Draw rectangle
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Draw text
            text = f"{barcode_info['type']}: {barcode_info['data']}"
            cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        except Exception as e:
            logger.error(f"Error drawing barcode box: {e}")
    
    def indicate_success(self):
        """Indicate successful scan"""
        logger.info("✓ Barcode scan successful")
        # In production, this would control LEDs, buzzers, or screen feedback
    
    def indicate_error(self):
        """Indicate scan error"""
        logger.warning("✗ Barcode scan error")
        # In production, this would control LEDs, buzzers, or screen feedback
    
    def start_scanning(self, show_preview: bool = False):
        """
        Start the barcode scanning loop
        
        Args:
            show_preview: Whether to show camera preview window
        """
        if not self.camera:
            logger.error("Camera not initialized")
            return
        
        logger.info("Starting barcode scanner...")
        self.running = True
        
        try:
            while self.running:
                # Capture frame
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("Failed to capture frame")
                    continue
                
                # Process frame for barcodes
                self.process_frame(frame)
                
                # Show preview if requested
                if show_preview:
                    cv2.imshow('Barcode Scanner', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Barcode scanner stopped by user")
        except Exception as e:
            logger.error(f"Error in scanning loop: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.camera:
            self.camera.release()
        cv2.destroyAllWindows()
        logger.info("Barcode scanner cleaned up")

def main():
    """Main function"""
    # Configuration
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    CAMERA_INDEX = 0
    SHOW_PREVIEW = True  # Set to False for headless operation
    
    # Create scanner instance
    scanner = BarcodeScanner(API_ENDPOINT)
    
    try:
        # Initialize camera
        if not scanner.initialize_camera(CAMERA_INDEX):
            logger.error("Failed to initialize camera")
            return
        
        # Start scanning
        scanner.start_scanning(show_preview=SHOW_PREVIEW)
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        scanner.cleanup()

if __name__ == "__main__":
    main()