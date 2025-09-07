# Smart Cart Complete Hardware Integration Guide

This comprehensive guide will walk you through setting up the complete Smart Cart system with all hardware integrations, from basic software setup to full hardware deployment on Raspberry Pi.

## 🎯 Quick Start (Software Only - 5 minutes)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Backend Setup
```bash
# Windows
cd hardware-integration
start_backend.bat

# Linux/Mac
cd hardware-integration
chmod +x start_backend.sh
./start_backend.sh
```

### 3. Test the System (Software Only)
1. Open http://localhost:5173 in your browser
2. Add products to cart manually via the UI
3. Test checkout with Stripe test cards (use 4242 4242 4242 4242)

## 🔧 Complete Hardware Integration Setup

### Prerequisites

#### Software Requirements
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Python 3.8+**: [Download](https://python.org/)
- **Arduino IDE**: [Download](https://arduino.cc/) (for ESP32 load cell)
- **Git**: [Download](https://git-scm.com/)

#### Hardware Requirements
- **Raspberry Pi 4** (4GB+ RAM recommended)
- **MicroSD Card** (32GB+ Class 10)
- **MFRC522 RFID Reader Module**
- **Pi Camera Module v2 or v3**
- **ESP32 Development Board** (for load cell)
- **HX711 Load Cell Amplifier**
- **Load Cell** (5kg capacity recommended)
- **Breadboard and Jumper Wires**
- **LED indicators** (optional)
- **Buzzer** (optional)

## 📋 Step 1: Raspberry Pi Configuration

### 1.1 Install Raspberry Pi OS
1. Download [Raspberry Pi Imager](https://rpi.org/imager)
2. Flash **Raspberry Pi OS (64-bit)** to SD card
3. Enable SSH, configure WiFi, and set username/password during setup

### 1.2 Initial System Configuration
```bash
# SSH into your Pi
ssh pi@your_pi_ip

# Update system
sudo apt update && sudo apt upgrade -y

# Enable required interfaces
sudo raspi-config
# Navigate to: Interface Options > Camera > Enable
# Navigate to: Interface Options > SPI > Enable  
# Navigate to: Interface Options > I2C > Enable
# Reboot when prompted
sudo reboot
```

### 1.3 Install System Dependencies
```bash
# Install Python and development tools
sudo apt install python3-pip python3-venv python3-dev -y

# Install OpenCV and camera dependencies
sudo apt install libopencv-dev python3-opencv -y
sudo apt install python3-picamera2 -y

# Install additional system libraries
sudo apt install libatlas-base-dev libhdf5-dev libhdf5-serial-dev -y
sudo apt install libqt5gui5 libqt5webkit5 libqt5test5 -y

# Install GPIO libraries
sudo apt install python3-rpi.gpio -y
```

## 📡 Step 2: RFID Reader (MFRC522) Setup

### 2.1 Hardware Connections

**IMPORTANT**: Power off your Raspberry Pi before making connections!

Connect MFRC522 to Raspberry Pi GPIO pins:

| MFRC522 Pin | Raspberry Pi Pin | GPIO Number | Wire Color |
|-------------|------------------|-------------|------------|
| VCC         | 3.3V (Pin 1)     | -           | Red        |
| GND         | GND (Pin 6)      | -           | Black      |
| RST         | GPIO 22 (Pin 15) | 22          | Yellow     |
| IRQ         | Not connected    | -           | -          |
| MISO        | GPIO 9 (Pin 21)  | 9           | Blue       |
| MOSI        | GPIO 10 (Pin 19) | 10          | Green      |
| SCK         | GPIO 11 (Pin 23) | 11          | White      |
| SDA/SS      | GPIO 8 (Pin 24)  | 8           | Orange     |

### 2.2 Install RFID Libraries
```bash
cd ~/smart-cart/hardware-integration/rfid

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# If requirements.txt doesn't exist, install manually:
pip install RPi.GPIO mfrc522 requests
```

### 2.3 Test RFID Reader
```bash
# Test SPI interface
ls -la /dev/spi*
# Should show: /dev/spidev0.0 and /dev/spidev0.1

# Test RFID reader
python3 rfid_reader.py
# Place RFID tags near the reader to test detection
```

**Expected Output:**
```
Starting RFID reader...
RFID tag detected: a1b2c3d4
Found product: Red Apples
✓ Success indicator
```

## 📷 Step 3: Pi Camera Setup

### 3.1 Hardware Connection
1. **Power off** your Raspberry Pi
2. Connect the Pi Camera ribbon cable to the **Camera** port (not Display port)
3. Ensure the cable is properly seated with contacts facing the right direction
4. Power on the Pi

### 3.2 Test Camera Installation
```bash
# Check if camera is detected
libcamera-hello --list-cameras

# Expected output should show your camera model
# Test camera capture
libcamera-still -o test.jpg --width 1920 --height 1080

# Verify image was captured
ls -la test.jpg
```

### 3.3 Install Camera Dependencies
```bash
cd ~/smart-cart/hardware-integration/camera

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install TensorFlow Lite (optimized for Pi)
pip install tflite-runtime

# Install other dependencies
pip install opencv-python requests numpy picamera2

# Download ImageNet class labels
wget https://raw.githubusercontent.com/tensorflow/tensorflow/master/tensorflow/lite/examples/python/label_image/labels.txt -O imagenet_classes.txt
```

### 3.4 Test Object Detection
```bash
# Test camera object detection
python3 object_detection.py

# Point camera at objects to test detection
# Expected output:
# "Detected: Red Apples (confidence: 0.85)"
```

## ⚖️ Step 4: Load Cell (ESP32 + HX711) Setup

### 4.1 Hardware Connections

**ESP32 to HX711 Connections:**
| HX711 Pin | ESP32 Pin | Description |
|-----------|-----------|-------------|
| VCC       | 3.3V      | Power       |
| GND       | GND       | Ground      |
| DT (Data) | GPIO 19   | Data line   |
| SCK (Clock)| GPIO 18   | Clock line  |

**Load Cell to HX711 Connections:**
| Load Cell Wire | HX711 Pin | Description |
|---------------|-----------|-------------|
| Red           | E+        | Excitation+ |
| Black         | E-        | Excitation- |
| White         | A+        | Signal+     |
| Green         | A-        | Signal-     |

### 4.2 ESP32 Arduino Setup

#### Install Arduino IDE and ESP32 Support
1. Download and install [Arduino IDE](https://arduino.cc/downloads)
2. Add ESP32 board support:
   - File → Preferences
   - Additional Board Manager URLs: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
   - Tools → Board → Boards Manager
   - Search "ESP32" and install "ESP32 by Espressif Systems"

#### Install Required Libraries
1. Tools → Manage Libraries
2. Install these libraries:
   - **HX711 Arduino Library** by Bogdan Necula
   - **ArduinoJson** by Benoit Blanchon
   - **WiFi** (should be pre-installed)

### 4.3 Configure and Upload ESP32 Code

1. Open `hardware-integration/load-cell/load_cell_esp32.ino`
2. Update WiFi credentials:
```cpp
const char* ssid = "YOUR_ACTUAL_WIFI_NAME";
const char* password = "YOUR_ACTUAL_WIFI_PASSWORD";
```
3. Update backend API endpoint:
```cpp
const char* apiEndpoint = "http://YOUR_PI_IP_ADDRESS:8000/api/weight/update";
```
4. Select your ESP32 board: Tools → Board → ESP32 Arduino → ESP32 Dev Module
5. Select correct port: Tools → Port → (your ESP32 port)
6. Upload the code: Sketch → Upload

### 4.4 Calibrate Load Cell
```cpp
// In Arduino IDE Serial Monitor (115200 baud):
// 1. Type "tare" and press Enter to zero the scale
// 2. Place a known weight (e.g., 1000g) on the load cell
// 3. Type "calibrate" and press Enter
// 4. Enter the known weight value when prompted
// 5. The system will calculate and apply the calibration factor
```

## 🔄 Step 5: Backend API Integration

### 5.1 Configure Backend Environment
```bash
cd ~/smart-cart/hardware-integration/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn websockets pydantic

# Create environment file
cp .env.example .env
nano .env
```

Update `.env` file:
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Hardware endpoints
FRONTEND_URL=http://localhost:5173
RFID_ENABLED=true
CAMERA_ENABLED=true
LOAD_CELL_ENABLED=true

# Database (if using)
DATABASE_URL=sqlite:///smart_cart.db
```

### 5.2 Start Backend Server
```bash
# Run the backend API
python3 main.py

# Should output:
# INFO: Started server process [1234]
# INFO: Waiting for application startup.
# INFO: Application startup complete.
# INFO: Uvicorn running on http://0.0.0.0:8000
```

### 5.3 Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00","active_connections":0}

# Test cart endpoint
curl -X POST http://localhost:8000/api/cart/add-item \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "product_id": "1",
    "quantity": 1,
    "scan_type": "manual",
    "scan_value": "test",
    "timestamp": 1642248600
  }'
```

## 🌐 Step 6: Frontend Integration

### 6.1 Update Frontend Configuration

Edit the frontend WebSocket connection in `src/hooks/useCartUpdates.ts`:
```typescript
// Replace localhost with your Pi's IP address
const websocketUrl = 'ws://YOUR_PI_IP_ADDRESS:8000/ws';
```

### 6.2 Configure Stripe Payment Integration

1. Get your Stripe keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Add them to your Supabase Edge Function secrets via the Supabase dashboard
3. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## 🚀 Step 7: Complete System Deployment

### 7.1 Start All Services on Raspberry Pi

Create a startup script:
```bash
# Create startup script
nano ~/start_smart_cart.sh
```

Add this content:
```bash
#!/bin/bash
cd ~/smart-cart

echo "Starting Smart Cart System..."

# Start backend API
cd hardware-integration/backend
source venv/bin/activate
python3 main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start RFID reader
cd ../rfid
source venv/bin/activate
python3 rfid_reader.py &
RFID_PID=$!

# Start camera detection
cd ../camera
source venv/bin/activate
python3 object_detection.py &
CAMERA_PID=$!

echo "Smart Cart services started!"
echo "Backend PID: $BACKEND_PID"
echo "RFID PID: $RFID_PID"
echo "Camera PID: $CAMERA_PID"

# Keep script running
wait
```

Make executable and run:
```bash
chmod +x ~/start_smart_cart.sh
~/start_smart_cart.sh
```

### 7.2 Frontend Deployment Options

#### Option A: Local Development Server
```bash
# On your development machine
npm run dev
# Access via http://localhost:5173
```

#### Option B: Production Build
```bash
# Build for production
npm run build

# Serve static files (install serve first: npm install -g serve)
serve -s dist -l 3000
```

#### Option C: Deploy to Cloud
- **Vercel**: Connect your GitHub repo to Vercel
- **Netlify**: Drag and drop your `dist` folder
- **Supabase**: Use Supabase hosting (if available)

## 🔧 Step 8: System Testing and Calibration

### 8.1 Hardware Testing Checklist

**RFID Testing:**
```bash
# 1. Test RFID detection
python3 ~/smart-cart/hardware-integration/rfid/rfid_reader.py

# 2. Place RFID tags on products
# 3. Verify console output shows detection
# 4. Check frontend updates in real-time
```

**Camera Testing:**
```bash
# 1. Test camera detection
python3 ~/smart-cart/hardware-integration/camera/object_detection.py

# 2. Show products to camera
# 3. Verify object recognition works
# 4. Check confidence scores in logs
```

**Load Cell Testing:**
```bash
# 1. Monitor ESP32 serial output in Arduino IDE
# 2. Place items on load cell
# 3. Verify weight readings are stable
# 4. Check API updates via: curl http://YOUR_PI_IP:8000/api/weight
```

### 8.2 Integration Testing

**Full System Test:**
1. Start all services
2. Place an RFID-tagged item on the load cell
3. Scan with RFID reader
4. Verify item appears in frontend cart
5. Check weight measurement matches expected weight
6. Complete checkout process with Stripe

## 🔒 Step 9: Production-Ready Enhancements

### 9.1 Security Improvements

**Network Security:**
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 8000/tcp  # Backend API
sudo ufw allow 5173/tcp  # Frontend (if serving from Pi)

# Change default passwords
sudo passwd pi
sudo passwd root
```

**API Security:**
- Implement API key authentication
- Add rate limiting
- Use HTTPS in production
- Validate all input data

### 9.2 Reliability Features

**Auto-restart Services:**
Create systemd services:
```bash
# Create service file
sudo nano /etc/systemd/system/smart-cart-backend.service
```

Add service configuration:
```ini
[Unit]
Description=Smart Cart Backend API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-cart/hardware-integration/backend
ExecStart=/home/pi/smart-cart/hardware-integration/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable smart-cart-backend
sudo systemctl start smart-cart-backend
```

**Offline Mode Support:**
- Add local SQLite database for offline storage
- Implement data synchronization when connection returns
- Cache product information locally
- Queue transactions for later processing

### 9.3 Monitoring and Logging

**System Monitoring:**
```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Monitor system resources
htop

# Monitor disk I/O
sudo iotop

# Check service logs
sudo journalctl -u smart-cart-backend -f
```

**Application Logging:**
- Implement structured logging with timestamps
- Log all hardware events and API calls  
- Set up log rotation to prevent disk space issues
- Add remote log aggregation for production

### 9.4 Advanced Features

**Admin Dashboard Enhancements:**
- Real-time hardware status monitoring
- Product inventory management
- Sales analytics and reporting
- Remote configuration management

**Mobile App Integration:**
- Create React Native or Flutter mobile app
- QR code scanning for product lookup
- Push notifications for cart updates
- Mobile payment integration

**AI/ML Improvements:**
- Custom product recognition model training
- Predictive inventory management
- Customer behavior analytics
- Fraud detection for unusual patterns

## 🔧 Step 10: Troubleshooting Common Issues

### 10.1 Hardware Issues

**RFID Reader Not Working:**
```bash
# Check SPI is enabled
lsmod | grep spi
# Should show: spi_bcm2835

# Check device permissions
ls -la /dev/spi*
# Should show spidev0.0 and spidev0.1

# Test with simple detection script
python3 -c "
import RPi.GPIO as GPIO
import MFRC522
reader = MFRC522.MFRC522()
print('RFID reader initialized successfully')
"
```

**Camera Not Detected:**
```bash
# Check camera detection
vcgencmd get_camera
# Should return: supported=1 detected=1

# Test camera with libcamera
libcamera-hello --list-cameras

# Check camera permissions
groups $USER
# User should be in 'video' group
```

**ESP32 Load Cell Issues:**
```bash
# Check Arduino IDE Serial Monitor (115200 baud)
# Common issues and solutions:

# 1. WiFi connection failed
# Solution: Verify SSID and password, check signal strength

# 2. API endpoint unreachable
# Solution: Verify Pi IP address, check firewall settings

# 3. Unstable weight readings
# Solution: Check wiring connections, recalibrate load cell

# 4. HX711 not responding
# Solution: Check power connections, verify GPIO pins
```

### 10.2 Software Issues

**Backend API Not Starting:**
```bash
# Check Python environment
which python3
python3 --version

# Check required packages
pip list | grep fastapi

# Check port availability
sudo netstat -tulpn | grep :8000

# Check logs
tail -f /var/log/syslog | grep smart-cart
```

**Frontend Connection Issues:**
```bash
# Check WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" http://YOUR_PI_IP:8000/ws

# Test API endpoints
curl http://YOUR_PI_IP:8000/api/health

# Check browser console for errors
# Open developer tools in browser (F12)
```

**Database/Stripe Issues:**
- Verify Supabase connection and API keys
- Check Stripe webhook endpoints are accessible
- Test payment flows with Stripe test cards
- Review Supabase Edge Function logs

### 10.3 Performance Optimization

**Raspberry Pi Performance:**
```bash
# Monitor CPU and memory usage
htop

# Check temperature
vcgencmd measure_temp

# Optimize GPU memory split
sudo nano /boot/config.txt
# Add: gpu_mem=128

# Enable hardware acceleration
# Add: dtoverlay=vc4-kms-v3d
```

**Network Optimization:**
- Use wired Ethernet instead of WiFi when possible
- Optimize API call frequency
- Implement request batching for multiple updates
- Use compression for large data transfers

## 🎯 Production Deployment Checklist

### Pre-Deployment
- [ ] All hardware components tested individually
- [ ] Integration testing completed successfully
- [ ] Security configurations applied
- [ ] Backup and recovery procedures documented
- [ ] Performance benchmarks established

### Hardware Setup
- [ ] Raspberry Pi configured and secured
- [ ] All sensors calibrated and tested
- [ ] Power supply and connections secured
- [ ] Environmental protection (cases, mounts) installed
- [ ] Network connectivity verified

### Software Deployment
- [ ] Backend API deployed and monitored
- [ ] Frontend built and deployed
- [ ] Database migrations completed
- [ ] Stripe integration tested with real payments
- [ ] Monitoring and logging configured

### Operations
- [ ] System monitoring dashboard active
- [ ] Automated backups configured
- [ ] Update procedures documented
- [ ] Support contact information available
- [ ] User training materials prepared

---

## 📞 Support and Troubleshooting

**Common Commands Summary:**
```bash
# System status
systemctl status smart-cart-*

# View logs
sudo journalctl -u smart-cart-backend -f

# Restart services
sudo systemctl restart smart-cart-backend

# Check hardware connections
gpio readall

# Test API
curl http://localhost:8000/api/health

# Monitor resources
htop
```

**Need Help?** 
- Check the troubleshooting section above
- Review system logs for error messages
- Verify all hardware connections
- Test each component individually
- Check network connectivity and firewall settings

For additional support, create an issue in the project repository with:
- Detailed description of the problem
- System configuration details
- Relevant log files
- Steps to reproduce the issue

---

**Smart Cart System - Production Ready Hardware Integration Guide v2.0**