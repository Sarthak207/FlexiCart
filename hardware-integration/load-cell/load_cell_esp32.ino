/*
 * Load Cell Integration for Smart Cart (ESP32)
 * Measures weight and sends data to backend API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API configuration
const char* apiEndpoint = "http://YOUR_BACKEND_IP:8000/api/weight/update";
const char* deviceId = "load_cell_001";

// Load cell pins
#define LOADCELL_DOUT_PIN 19
#define LOADCELL_SCK_PIN 18

// Calibration factor (adjust based on your load cell)
#define CALIBRATION_FACTOR 1000.0

// Weight thresholds
#define WEIGHT_THRESHOLD 50.0  // grams
#define STABLE_READING_COUNT 5
#define READING_INTERVAL 1000  // milliseconds

// HX711 instance
HX711 scale;

// Weight tracking variables
float currentWeight = 0.0;
float previousWeight = 0.0;
float stableWeight = 0.0;
int stableCount = 0;
unsigned long lastReading = 0;
bool weightStable = false;

// WiFi connection status
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Smart Cart Load Cell - ESP32");
  Serial.println("=============================");
  
  // Initialize load cell
  initializeLoadCell();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Send initial status
  sendWeightUpdate(0.0, false, "initialization");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
  } else {
    wifiConnected = true;
  }
  
  // Read weight if enough time has passed
  if (millis() - lastReading >= READING_INTERVAL) {
    readWeight();
    lastReading = millis();
  }
  
  // Small delay to prevent excessive CPU usage
  delay(100);
}

void initializeLoadCell() {
  Serial.println("Initializing load cell...");
  
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  
  // Set scale factor (calibration)
  scale.set_scale(CALIBRATION_FACTOR);
  
  // Tare the scale
  scale.tare();
  
  Serial.println("Load cell initialized. Place items on scale to measure weight.");
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
    wifiConnected = false;
  }
}

void readWeight() {
  if (scale.is_ready()) {
    // Read raw value
    float rawWeight = scale.get_units(1);
    
    // Apply smoothing filter
    currentWeight = (currentWeight * 0.7) + (rawWeight * 0.3);
    
    // Check if weight is stable
    if (abs(currentWeight - previousWeight) < 5.0) {  // 5g tolerance
      stableCount++;
    } else {
      stableCount = 0;
    }
    
    // Determine if weight is stable
    bool wasStable = weightStable;
    weightStable = (stableCount >= STABLE_READING_COUNT);
    
    // Update stable weight if reading is stable
    if (weightStable && !wasStable) {
      stableWeight = currentWeight;
      Serial.print("Weight stabilized: ");
      Serial.print(stableWeight);
      Serial.println("g");
    }
    
    // Send weight update if significant change or stability change
    if (abs(currentWeight - previousWeight) > WEIGHT_THRESHOLD || 
        weightStable != wasStable) {
      sendWeightUpdate(currentWeight, weightStable, "measurement");
    }
    
    previousWeight = currentWeight;
    
    // Debug output
    Serial.print("Weight: ");
    Serial.print(currentWeight);
    Serial.print("g (Stable: ");
    Serial.print(weightStable ? "Yes" : "No");
    Serial.print(", Count: ");
    Serial.print(stableCount);
    Serial.println(")");
    
  } else {
    Serial.println("Load cell not ready");
  }
}

void sendWeightUpdate(float weight, bool stable, const char* reason) {
  if (!wifiConnected) {
    Serial.println("WiFi not connected, skipping API call");
    return;
  }
  
  HTTPClient http;
  http.begin(apiEndpoint);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["weight"] = weight;
  doc["stable"] = stable;
  doc["timestamp"] = millis() / 1000.0;
  doc["reason"] = reason;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending weight update: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// Function to calibrate the load cell
void calibrateLoadCell() {
  Serial.println("Calibration mode - Place known weight on scale");
  Serial.println("Enter weight in grams and press Enter");
  
  while (Serial.available() == 0) {
    delay(100);
  }
  
  float knownWeight = Serial.parseFloat();
  Serial.print("Calibrating with known weight: ");
  Serial.print(knownWeight);
  Serial.println("g");
  
  // Read raw value
  float rawValue = scale.get_units(10);
  float calibrationFactor = rawValue / knownWeight;
  
  Serial.print("Raw value: ");
  Serial.println(rawValue);
  Serial.print("Calibration factor: ");
  Serial.println(calibrationFactor);
  
  // Update calibration
  scale.set_scale(calibrationFactor);
  
  Serial.println("Calibration complete!");
}

// Function to tare the scale
void tareScale() {
  Serial.println("Taring scale...");
  scale.tare();
  currentWeight = 0.0;
  stableWeight = 0.0;
  Serial.println("Scale tared!");
}

// Serial command handler
void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "calibrate") {
      calibrateLoadCell();
    } else if (command == "tare") {
      tareScale();
    } else if (command == "status") {
      Serial.print("Current weight: ");
      Serial.print(currentWeight);
      Serial.print("g, Stable: ");
      Serial.println(weightStable ? "Yes" : "No");
    } else if (command == "wifi") {
      Serial.print("WiFi status: ");
      Serial.println(wifiConnected ? "Connected" : "Disconnected");
    } else {
      Serial.println("Available commands: calibrate, tare, status, wifi");
    }
  }
}
