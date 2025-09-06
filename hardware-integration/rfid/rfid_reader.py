#!/usr/bin/env python3
"""
RFID Reader Integration for Smart Cart
Supports MFRC522 RFID reader on Raspberry Pi
"""

import RPi.GPIO as GPIO
import MFRC522
import signal
import time
import requests
import json
import logging
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RFIDReader:
    def __init__(self, api_endpoint: str = "http://localhost:8000/api/cart/add-item"):
        """
        Initialize RFID reader
        
        Args:
            api_endpoint: Backend API endpoint for adding items to cart
        """
        self.api_endpoint = api_endpoint
        self.MIFAREReader = MFRC522.MFRC522()
        self.running = False
        
        # RFID code to product mapping (in production, this would come from database)
        self.product_mapping = {
            "RF001": {"id": "1", "name": "Red Apples", "price": 2.99, "weight": 150},
            "RF002": {"id": "2", "name": "Whole Wheat Bread", "price": 1.99, "weight": 400},
            "RF003": {"id": "3", "name": "Fresh Milk", "price": 3.49, "weight": 1000},
            "RF004": {"id": "4", "name": "Bananas", "price": 1.29, "weight": 120},
            "RF005": {"id": "5", "name": "Cheddar Cheese", "price": 4.99, "weight": 250},
            "RF006": {"id": "6", "name": "Croissants", "price": 3.99, "weight": 180},
            "RF007": {"id": "7", "name": "Orange Juice", "price": 2.79, "weight": 950},
            "RF008": {"id": "8", "name": "Chicken Breast", "price": 7.99, "weight": 450},
        }
        
        # Setup signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Shutting down RFID reader...")
        self.running = False
        GPIO.cleanup()
        exit(0)
    
    def _read_rfid(self) -> Optional[str]:
        """
        Read RFID tag and return the code
        
        Returns:
            RFID code string or None if no tag detected
        """
        try:
            # Scan for cards
            (status, TagType) = self.MIFAREReader.MFRC522_Request(self.MIFAREReader.PICC_REQIDL)
            
            if status == self.MIFAREReader.MI_OK:
                # Get the UID of the card
                (status, uid) = self.MIFAREReader.MFRC522_Anticoll()
                
                if status == self.MIFAREReader.MI_OK:
                    # Convert UID to string
                    uid_str = ''.join([f"{byte:02x}" for byte in uid])
                    logger.info(f"RFID tag detected: {uid_str}")
                    return uid_str
            
            return None
            
        except Exception as e:
            logger.error(f"Error reading RFID: {e}")
            return None
    
    def _send_to_cart(self, product_data: Dict[str, Any], user_id: str = "demo_user") -> bool:
        """
        Send product data to cart via API
        
        Args:
            product_data: Product information
            user_id: User ID for the cart
            
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = {
                "user_id": user_id,
                "product_id": product_data["id"],
                "quantity": 1,
                "scan_type": "rfid",
                "scan_value": product_data.get("rfid_code", ""),
                "timestamp": time.time()
            }
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully added {product_data['name']} to cart")
                return True
            else:
                logger.error(f"Failed to add item to cart: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return False
    
    def _lookup_product(self, rfid_code: str) -> Optional[Dict[str, Any]]:
        """
        Look up product by RFID code
        
        Args:
            rfid_code: RFID code to look up
            
        Returns:
            Product data or None if not found
        """
        # In production, this would query a database
        # For demo, we'll use a simple mapping
        return self.product_mapping.get(rfid_code)
    
    def start_reading(self):
        """Start the RFID reading loop"""
        logger.info("Starting RFID reader...")
        self.running = True
        
        while self.running:
            try:
                # Read RFID tag
                rfid_code = self._read_rfid()
                
                if rfid_code:
                    # Look up product
                    product_data = self._lookup_product(rfid_code)
                    
                    if product_data:
                        logger.info(f"Found product: {product_data['name']}")
                        
                        # Add to cart
                        success = self._send_to_cart(product_data)
                        
                        if success:
                            # Flash LED or beep to indicate success
                            self._indicate_success()
                        else:
                            # Flash error LED or beep
                            self._indicate_error()
                    else:
                        logger.warning(f"Unknown RFID code: {rfid_code}")
                        self._indicate_error()
                
                # Small delay to prevent excessive CPU usage
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Unexpected error in reading loop: {e}")
                time.sleep(1)
    
    def _indicate_success(self):
        """Indicate successful scan (LED flash, beep, etc.)"""
        # This would control hardware indicators
        logger.info("✓ Success indicator")
        # Example: GPIO.output(SUCCESS_LED_PIN, GPIO.HIGH)
        # time.sleep(0.1)
        # GPIO.output(SUCCESS_LED_PIN, GPIO.LOW)
    
    def _indicate_error(self):
        """Indicate error (different LED pattern, beep, etc.)"""
        # This would control hardware indicators
        logger.warning("✗ Error indicator")
        # Example: GPIO.output(ERROR_LED_PIN, GPIO.HIGH)
        # time.sleep(0.2)
        # GPIO.output(ERROR_LED_PIN, GPIO.LOW)

def main():
    """Main function"""
    # Configuration
    API_ENDPOINT = "http://localhost:8000/api/cart/add-item"
    
    # Create RFID reader instance
    rfid_reader = RFIDReader(API_ENDPOINT)
    
    try:
        # Start reading
        rfid_reader.start_reading()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    main()
