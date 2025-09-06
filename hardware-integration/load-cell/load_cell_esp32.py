#!/usr/bin/env python3
"""
Load Cell Integration for Smart Cart (Python/ESP32)
Alternative implementation using MicroPython on ESP32
"""

import network
import urequests
import json
import time
from machine import Pin, ADC
import ujson

class LoadCellESP32:
    def __init__(self, wifi_ssid, wifi_password, api_endpoint, device_id="load_cell_001"):
        """
        Initialize load cell on ESP32
        
        Args:
            wifi_ssid: WiFi network name
            wifi_password: WiFi password
            api_endpoint: Backend API endpoint
            device_id: Unique device identifier
        """
        self.wifi_ssid = wifi_ssid
        self.wifi_password = wifi_password
        self.api_endpoint = api_endpoint
        self.device_id = device_id
        
        # Load cell configuration
        self.calibration_factor = 1000.0
        self.weight_threshold = 50.0  # grams
        self.stable_reading_count = 5
        self.reading_interval = 1000  # milliseconds
        
        # Weight tracking variables
        self.current_weight = 0.0
        self.previous_weight = 0.0
        self.stable_weight = 0.0
        self.stable_count = 0
        self.last_reading = 0
        self.weight_stable = False
        
        # WiFi status
        self.wifi_connected = False
        
        # Initialize ADC for load cell
        self.adc = ADC(Pin(34))  # GPIO34 for ADC
        self.adc.atten(ADC.ATTN_11DB)  # 0-3.3V range
        
    def connect_wifi(self):
        """Connect to WiFi network"""
        print(f"Connecting to WiFi: {self.wifi_ssid}")
        
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        wlan.connect(self.wifi_ssid, self.wifi_password)
        
        attempts = 0
        while not wlan.isconnected() and attempts < 20:
            time.sleep(0.5)
            print(".", end="")
            attempts += 1
        
        if wlan.isconnected():
            print(f"\nWiFi connected!")
            print(f"IP address: {wlan.ifconfig()[0]}")
            self.wifi_connected = True
        else:
            print(f"\nWiFi connection failed!")
            self.wifi_connected = False
    
    def read_raw_weight(self):
        """Read raw weight value from ADC"""
        # Read multiple samples for stability
        samples = []
        for _ in range(10):
            samples.append(self.adc.read())
            time.sleep(0.01)
        
        # Calculate average
        raw_value = sum(samples) / len(samples)
        
        # Convert to weight (this is a simplified conversion)
        # In a real implementation, you'd use proper calibration
        weight = (raw_value - 2048) * self.calibration_factor / 1000.0
        
        return weight
    
    def read_weight(self):
        """Read and process weight measurement"""
        current_time = time.ticks_ms()
        
        # Check if enough time has passed
        if time.ticks_diff(current_time, self.last_reading) < self.reading_interval:
            return
        
        # Read raw weight
        raw_weight = self.read_raw_weight()
        
        # Apply smoothing filter
        self.current_weight = (self.current_weight * 0.7) + (raw_weight * 0.3)
        
        # Check if weight is stable
        if abs(self.current_weight - self.previous_weight) < 5.0:  # 5g tolerance
            self.stable_count += 1
        else:
            self.stable_count = 0
        
        # Determine if weight is stable
        was_stable = self.weight_stable
        self.weight_stable = (self.stable_count >= self.stable_reading_count)
        
        # Update stable weight if reading is stable
        if self.weight_stable and not was_stable:
            self.stable_weight = self.current_weight
            print(f"Weight stabilized: {self.stable_weight:.1f}g")
        
        # Send weight update if significant change or stability change
        if (abs(self.current_weight - self.previous_weight) > self.weight_threshold or 
            self.weight_stable != was_stable):
            self.send_weight_update(self.current_weight, self.weight_stable, "measurement")
        
        self.previous_weight = self.current_weight
        self.last_reading = current_time
        
        # Debug output
        print(f"Weight: {self.current_weight:.1f}g (Stable: {'Yes' if self.weight_stable else 'No'}, Count: {self.stable_count})")
    
    def send_weight_update(self, weight, stable, reason):
        """Send weight update to backend API"""
        if not self.wifi_connected:
            print("WiFi not connected, skipping API call")
            return
        
        try:
            payload = {
                "device_id": self.device_id,
                "weight": weight,
                "stable": stable,
                "timestamp": time.time(),
                "reason": reason
            }
            
            print(f"Sending weight update: {ujson.dumps(payload)}")
            
            response = urequests.post(
                self.api_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            print(f"HTTP Response Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            response.close()
            
        except Exception as e:
            print(f"HTTP Error: {e}")
    
    def calibrate(self, known_weight):
        """Calibrate the load cell with a known weight"""
        print(f"Calibrating with known weight: {known_weight}g")
        
        # Read raw value
        raw_value = self.read_raw_weight()
        
        # Calculate calibration factor
        self.calibration_factor = raw_value / known_weight
        
        print(f"Raw value: {raw_value}")
        print(f"Calibration factor: {self.calibration_factor}")
        print("Calibration complete!")
    
    def tare(self):
        """Tare the scale (set zero point)"""
        print("Taring scale...")
        # In a real implementation, you'd store the zero offset
        self.current_weight = 0.0
        self.stable_weight = 0.0
        print("Scale tared!")
    
    def run(self):
        """Main execution loop"""
        print("Smart Cart Load Cell - ESP32 (MicroPython)")
        print("==========================================")
        
        # Connect to WiFi
        self.connect_wifi()
        
        # Send initial status
        self.send_weight_update(0.0, False, "initialization")
        
        print("Load cell started. Place items on scale to measure weight.")
        print("Commands: 'calibrate <weight>', 'tare', 'status'")
        
        try:
            while True:
                # Check WiFi connection
                if not self.wifi_connected:
                    self.connect_wifi()
                
                # Read weight
                self.read_weight()
                
                # Handle serial commands (if available)
                # This would be implemented based on your specific setup
                
                # Small delay
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\nShutting down load cell...")
        except Exception as e:
            print(f"Fatal error: {e}")

# Configuration
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"
API_ENDPOINT = "http://YOUR_BACKEND_IP:8000/api/weight/update"

# Main execution
if __name__ == "__main__":
    load_cell = LoadCellESP32(WIFI_SSID, WIFI_PASSWORD, API_ENDPOINT)
    load_cell.run()
