# Smart Cart Pilot Project

A comprehensive smart shopping cart system with hardware integrations, real-time updates, and Stripe payment processing.

## 🚀 Features

- **Real-time Cart Updates**: WebSocket-based real-time cart synchronization
- **Hardware Integrations**: RFID, Camera, and Load Cell support
- **Stripe Payment Processing**: Secure payment with webhook support
- **Product Recognition**: Computer vision for automatic product detection
- **Weight Verification**: ESP32-based load cell integration
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## 🏗️ Architecture

### Frontend (React + TypeScript)
- Real-time WebSocket connections
- Hardware integration hooks
- Stripe payment integration
- Responsive UI with shadcn/ui components

### Backend (FastAPI)
- RESTful API for hardware integrations
- WebSocket server for real-time updates
- Cart management and weight tracking

### Hardware Components
- **RFID Reader**: MFRC522 for product scanning
- **Pi Camera**: Object detection with MobileNet
- **Load Cells**: ESP32-based weight measurement

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Raspberry Pi (for hardware integrations)
- ESP32 (for load cell integration)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd smart-bag-pilot
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tvfwhtkzrjayibrbsjds.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Environment
NODE_ENV=development
```

### 4. Install Backend Dependencies

```bash
cd hardware-integration/backend
pip install -r requirements.txt
```

## 🚀 Running the Application

### Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Backend API Server

```bash
cd hardware-integration/backend
python main.py
```

The API will be available at `http://localhost:8000`

## 🔧 Hardware Setup

### RFID Reader (Raspberry Pi)

1. **Install Dependencies**:
   ```bash
   cd hardware-integration/rfid
   pip install -r requirements.txt
   ```

2. **Hardware Connections**:
   - Connect MFRC522 to Raspberry Pi GPIO pins
   - Update pin configuration in `rfid_reader.py`

3. **Run RFID Reader**:
   ```bash
   python rfid_reader.py
   ```

### Camera Integration (Raspberry Pi)

1. **Install Dependencies**:
   ```bash
   cd hardware-integration/camera
   pip install -r requirements.txt
   ```

2. **Setup Camera**:
   - Enable Pi Camera in Raspberry Pi configuration
   - Install TensorFlow and OpenCV

3. **Run Object Detection**:
   ```bash
   python object_detection.py
   ```

### Load Cell Integration (ESP32)

1. **Hardware Setup**:
   - Connect HX711 load cell amplifier to ESP32
   - Update pin configuration in Arduino code

2. **Upload Code**:
   - Use Arduino IDE or PlatformIO
   - Upload `load_cell_esp32.ino` to ESP32

3. **Configure WiFi**:
   - Update WiFi credentials in the code
   - Set backend API endpoint

## 🔌 API Endpoints

### Cart Management
- `POST /api/cart/add-item` - Add item to cart
- `GET /api/cart/{user_id}` - Get user's cart
- `DELETE /api/cart/{user_id}/item/{product_id}` - Remove item
- `PUT /api/cart/{user_id}/item/{product_id}` - Update quantity

### Weight Management
- `POST /api/weight/update` - Update weight data
- `GET /api/weight/{device_id}` - Get device weight
- `GET /api/weight` - Get all weight data

### WebSocket
- `WS /ws` - Real-time updates connection

## 💳 Stripe Integration

### Setup Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Update environment variables with your keys

### Webhook Configuration

1. Set up webhook endpoint: `https://your-domain.com/api/stripe-webhook`
2. Configure events: `checkout.session.completed`, `invoice.payment_succeeded`
3. Update `STRIPE_WEBHOOK_SECRET` in environment

### Testing Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## 🧪 Testing the Full Flow

### 1. Start All Services

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd hardware-integration/backend
python main.py

# Terminal 3: RFID Reader (if available)
cd hardware-integration/rfid
python rfid_reader.py

# Terminal 4: Camera (if available)
cd hardware-integration/camera
python object_detection.py
```

### 2. Test Cart Operations

1. **Manual Add**: Use the scan page to add products
2. **RFID Scan**: Place RFID tags on products and scan
3. **Camera Detection**: Show products to camera for recognition
4. **Weight Check**: Verify cart weight matches expected weight
5. **Checkout**: Complete payment with Stripe

### 3. Verify Real-time Updates

- Open multiple browser tabs
- Add items in one tab
- Verify updates appear in other tabs instantly

## 📱 Mobile Support

The application is fully responsive and works on mobile devices. For hardware integrations on mobile:

- Use the web interface for manual product scanning
- Connect to the same WiFi network as hardware devices
- Ensure backend API is accessible from mobile device

## 🔒 Security Considerations

- Use HTTPS in production
- Validate all API inputs
- Implement proper authentication
- Secure WebSocket connections
- Protect Stripe webhook endpoints

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Check if backend is running on port 8000
   - Verify firewall settings
   - Check browser console for errors

2. **RFID Reader Not Working**:
   - Verify GPIO connections
   - Check MFRC522 library installation
   - Ensure proper permissions

3. **Camera Detection Issues**:
   - Verify camera is enabled
   - Check TensorFlow installation
   - Ensure adequate lighting

4. **Load Cell Readings Inaccurate**:
   - Calibrate with known weights
   - Check HX711 connections
   - Verify power supply

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Raspberry Pi GPIO Guide](https://pinout.xyz/)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the hardware setup guides

---

**Happy Shopping! 🛒✨**
