# Smart Cart Setup Guide

This guide will walk you through setting up the complete Smart Cart system with all hardware integrations.

## 🎯 Quick Start (5 minutes)

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

### 3. Test the System
1. Open http://localhost:8080 in your browser
2. Add products to cart manually
3. Test checkout with Stripe test cards

## 🔧 Complete Hardware Setup

### Prerequisites

#### Software Requirements
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Python 3.8+**: [Download](https://python.org/)
- **Arduino IDE**: [Download](https://arduino.cc/) (for ESP32)
- **Git**: [Download](https://git-scm.com/)

#### Hardware Requirements
- **Raspberry Pi 4** (for RFID and Camera)
- **ESP32 Dev Board** (for Load Cell)
- **MFRC522 RFID Reader Module**
- **Pi Camera Module v2**
- **HX711 Load Cell Amplifier**
- **Load Cell (5kg capacity)**
- **Jumper Wires and Breadboard**

### Step 1: Raspberry Pi Setup

#### 1.1 Install Raspberry Pi OS
1. Download [Raspberry Pi Imager](https://rpi.org/imager)
2. Flash Raspberry Pi OS (64-bit) to SD card
3. Enable SSH and configure WiFi during setup

#### 1.2 Enable Camera and GPIO
```bash
# Enable camera
sudo raspi-config
# Navigate to: Interface Options > Camera > Enable

# Enable SPI for RFID
sudo raspi-config
# Navigate to: Interface Options > SPI > Enable

# Reboot
sudo reboot
```

#### 1.3 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-venv -y

# Install OpenCV dependencies
sudo apt install libopencv-dev python3-opencv -y

# Install camera dependencies
sudo apt install python3-picamera2 -y
```

### Step 2: RFID Reader Setup

#### 2.1 Hardware Connections
Connect MFRC522 to Raspberry Pi:

| MFRC522 Pin | Raspberry Pi Pin | Description |
|-------------|------------------|-------------|
| VCC         | 3.3V (Pin 1)     | Power       |
| GND         | GND (Pin 6)      | Ground      |
| RST         | GPIO 22 (Pin 15) | Reset       |
| IRQ         | Not connected    | Interrupt   |
| MISO        | GPIO 9 (Pin 21)  | SPI MISO    |
| MOSI        | GPIO 10 (Pin 19) | SPI MOSI    |
| SCK         | GPIO 11 (Pin 23) | SPI Clock   |
| SDA         | GPIO 8 (Pin 24)  | SPI CS      |

#### 2.2 Install RFID Libraries
```bash
cd ~/smart-bag-pilot/hardware-integration/rfid
pip3 install -r requirements.txt
```

#### 2.3 Test RFID Reader
```bash
python3 rfid_reader.py
```

### Step 3: Camera Setup

#### 3.1 Hardware Connections
- Connect Pi Camera to the camera port on Raspberry Pi
- Ensure camera ribbon cable is properly seated

#### 3.2 Install Camera Dependencies
```bash
cd ~/smart-bag-pilot/hardware-integration/camera
pip3 install -r requirements.txt
```

#### 3.3 Test Camera
```bash
# Test camera detection
python3 object_detection.py
```

### Step 4: ESP32 Load Cell Setup

#### 4.1 Hardware Connections
Connect HX711 to ESP32:

| HX711 Pin | ESP32 Pin | Description |
|-----------|-----------|-------------|
| VCC       | 3.3V      | Power       |
| GND       | GND       | Ground      |
| DT        | GPIO 19   | Data        |
| SCK       | GPIO 18   | Clock       |

Connect Load Cell to HX711:
- E+ to Red wire
- E- to Black wire  
- A+ to White wire
- A- to Green wire

#### 4.2 Install ESP32 Arduino Core
1. Open Arduino IDE
2. Go to File > Preferences
3. Add ESP32 board URL: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
4. Go to Tools > Board > Boards Manager
5. Search for "ESP32" and install

#### 4.3 Install HX711 Library
1. Go to Tools > Manage Libraries
2. Search for "HX711" by Bogdan
3. Install the library

#### 4.4 Upload Code
1. Open `load_cell_esp32.ino` in Arduino IDE
2. Select ESP32 board and correct port
3. Update WiFi credentials in the code
4. Upload to ESP32

### Step 5: Backend API Setup

#### 5.1 Install Backend Dependencies
```bash
cd ~/smart-bag-pilot/hardware-integration/backend
pip3 install -r requirements.txt
```

#### 5.2 Configure Environment
```bash
# Copy environment template
cp ../env.example .env

# Edit environment variables
nano .env
```

Update the following variables:
```env
# Backend API URL (use your Pi's IP)
API_ENDPOINT=http://YOUR_PI_IP:8000/api/cart/add-item

# WiFi credentials for ESP32
WIFI_SSID=your_wifi_name
WIFI_PASSWORD=your_wifi_password
```

#### 5.3 Start Backend Server
```bash
python3 main.py
```

### Step 6: Frontend Configuration

#### 6.1 Update API Endpoints
Edit `src/hooks/useCartUpdates.ts`:
```typescript
const websocketUrl = 'ws://YOUR_PI_IP:8000/ws';
```

#### 6.2 Configure Stripe
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Update `.env` file with your keys

### Step 7: Testing the Complete System

#### 7.1 Start All Services
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (on Pi)
python3 main.py

# Terminal 3: RFID Reader (on Pi)
python3 rfid_reader.py

# Terminal 4: Camera (on Pi)
python3 object_detection.py
```

#### 7.2 Test Each Component

**RFID Testing:**
1. Place RFID tags on products
2. Scan tags with RFID reader
3. Verify items appear in cart

**Camera Testing:**
1. Show products to camera
2. Verify object detection works
3. Check cart updates

**Load Cell Testing:**
1. Place items on load cell
2. Verify weight readings
3. Check weight verification page

**Payment Testing:**
1. Add items to cart
2. Proceed to checkout
3. Use Stripe test cards

## 🔧 Troubleshooting

### Common Issues

#### RFID Reader Not Working
```bash
# Check SPI is enabled
lsmod | grep spi

# Check device permissions
ls -la /dev/spi*

# Test with simple script
python3 -c "import MFRC522; print('RFID library working')"
```

#### Camera Not Detected
```bash
# Check camera is enabled
vcgencmd get_camera

# Test camera
libcamera-hello --list-cameras

# Check camera permissions
groups $USER
```

#### ESP32 Not Connecting
1. Check WiFi credentials
2. Verify ESP32 is on same network
3. Check serial monitor for error messages
4. Ensure backend API is accessible

#### WebSocket Connection Failed
1. Check firewall settings
2. Verify backend is running on port 8000
3. Check browser console for errors
4. Test with curl: `curl http://YOUR_PI_IP:8000/api/health`

### Debug Commands

```bash
# Check all services
ps aux | grep python

# Check network connections
netstat -tulpn | grep :8000

# Check logs
tail -f /var/log/syslog

# Test API endpoints
curl -X GET http://localhost:8000/api/health
```

## 📊 Performance Optimization

### Raspberry Pi Optimization
```bash
# Increase GPU memory split
sudo nano /boot/config.txt
# Add: gpu_mem=128

# Enable hardware acceleration
sudo nano /boot/config.txt
# Add: start_x=1

# Optimize for camera
sudo nano /boot/config.txt
# Add: camera_auto_detect=1
```

### ESP32 Optimization
- Use deep sleep mode when not in use
- Implement connection retry logic
- Optimize weight reading frequency

## 🔒 Security Considerations

### Network Security
1. Use WPA3 WiFi encryption
2. Change default passwords
3. Enable firewall on Raspberry Pi
4. Use HTTPS in production

### API Security
1. Implement authentication
2. Validate all inputs
3. Rate limit API endpoints
4. Use secure WebSocket connections

## 📈 Monitoring and Logging

### System Monitoring
```bash
# Monitor CPU usage
htop

# Monitor memory
free -h

# Monitor disk space
df -h

# Monitor network
iftop
```

### Application Logging
- Backend logs: Check console output
- Frontend logs: Check browser console
- Hardware logs: Check serial output

## 🚀 Production Deployment

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify)
3. Configure environment variables
4. Set up custom domain

### Backend Deployment
1. Use production WSGI server (Gunicorn)
2. Set up reverse proxy (Nginx)
3. Configure SSL certificates
4. Set up monitoring and logging

### Hardware Deployment
1. Use proper enclosures
2. Implement power management
3. Set up remote monitoring
4. Create maintenance procedures

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
