# 🛒 KartMitra - Smart AI Retail Checkout System

A complete AI-powered shopping application with YOLOv8 real-time object detection, fuzzy product matching, and seamless cart management.

## 🌟 Features

### 1. AI Camera Scan (YOLOv8)
- Real-time object detection using YOLOv8
- Live video stream with bounding boxes
- WebSocket-based detection broadcasting
- Optimized for low latency and smooth performance

### 2. Intelligent Product Matching
- Fuzzy string matching to map YOLO detections to Supabase products
- Confidence scoring system
- Automatic product suggestions
- One-click add to cart from detections

### 3. Browse Products
- Full product catalog view
- Search and filter by category
- Grid layout with product cards
- Quick add to cart

### 4. Shopping Cart
- Mini cart (sidebar)
- Full cart page with detailed view
- Quantity management
- Item removal
- Order summary with GST calculation

### 5. Mobile & Touch Optimized
- Touch-friendly UI
- Large interactive elements (48px minimum)
- Smooth scrolling
- Mobile-first design

## 🚀 Setup Instructions

### Backend Setup (Python + FastAPI + YOLO)

1. **Navigate to backend directory:**
   ```bash
   cd hardware-integration/backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download YOLOv8 model:**
   The model will be downloaded automatically on first run, or download manually:
   ```bash
   python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
   ```

5. **Configure camera:**
   Edit `main.py` and set your camera URL:
   ```python
   CAMERA_URL = "http://YOUR_PHONE_IP:8080/video"  # For mobile IP Webcam
   # OR
   CAMERA_URL = 0  # For USB/Pi Camera
   ```

6. **Run backend:**
   ```bash
   python main.py
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Import products to Supabase:**
   The CSV file with 5000+ products is at `public/data/products.csv`
   
   You can import via:
   - Supabase Dashboard: Table Editor → Import CSV
   - Or create a script to bulk import

3. **Run frontend:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:8080`

## 📱 Mobile IP Webcam Setup

1. **Install IP Webcam app** on your Android phone (from Play Store)

2. **Start the server** in the app

3. **Note the IP address** shown (e.g., `http://192.168.1.5:8080`)

4. **Update backend config** in `main.py`:
   ```python
   CAMERA_URL = "http://192.168.1.5:8080/video"
   ```

## 🎯 Usage Flow

1. **Start Shopping:**
   - Browse products or use AI Camera Scan

2. **AI Scan Mode:**
   - Point camera at products
   - YOLO detects objects in real-time
   - System matches detections to database products
   - Add matched products to cart

3. **Browse Mode:**
   - Search and filter products
   - View product details
   - Add to cart

4. **Checkout:**
   - Review cart
   - Proceed to payment
   - Complete order

## 🔧 Configuration

### Backend (`main.py`)
```python
CAMERA_URL = "http://192.168.1.5:8080/video"  # Camera source
CONFIDENCE_THRESHOLD = 0.5  # Detection confidence (0-1)
RESIZE_WIDTH = 640  # Frame width
RESIZE_HEIGHT = 480  # Frame height
FRAME_SKIP = 3  # Process every Nth frame
```

### Fuzzy Matching (`match-product` edge function)
The system uses multiple matching strategies:
- Exact name match (100% confidence)
- Contains substring (80%)
- Category match (60%)
- Word overlap (0-50%)

Minimum threshold: 30% to show a match

## 📊 Product Database Schema

```sql
products (
  id: uuid (primary key)
  name: text
  price: numeric
  image: text
  category: text
  rfid_code: text
  barcode: text
  weight: integer
  created_at: timestamp
  updated_at: timestamp
  map_position_id: uuid
)
```

## 🎨 UI Components

- **Home Page**: Quick actions and featured products
- **Scan Page**: AI camera feed + live detections
- **Browse Products**: Product grid with search/filter
- **Full Cart**: Detailed cart view with order summary
- **Checkout**: Payment and order completion

## 🔒 Security

- Edge functions handle all product matching server-side
- No direct product IDs exposed in frontend
- Supabase RLS policies for data access control

## 📈 Performance Optimization

### Backend
- Frame skipping (process every 3rd frame)
- Threading for camera capture
- Efficient YOLO inference
- WebSocket for real-time updates

### Frontend
- Lazy loading for product images
- Debounced search
- Optimistic UI updates
- Local cart state management

## 🎓 Demo Ready

Perfect for college presentations:
- Live AI detection demo
- Professional UI
- Real product database
- Full shopping flow
- Mobile responsive

## 🐛 Troubleshooting

**WebSocket connection failed:**
- Ensure backend is running on port 8000
- Check firewall settings

**No camera feed:**
- Verify camera URL is correct
- Check IP Webcam app is running
- Ensure devices are on same network

**No product matches:**
- Products may need better naming in database
- Adjust confidence threshold in match-product function
- Check YOLO detection labels

**Slow detection:**
- Increase FRAME_SKIP value
- Reduce RESIZE_WIDTH/HEIGHT
- Use lighter YOLO model (yolov8n)

## 🚀 Deployment

### Raspberry Pi
1. Install Python dependencies
2. Set up camera (USB or Pi Camera)
3. Run backend as systemd service
4. Deploy frontend to Lovable

### Production
- Use reverse proxy (nginx) for backend
- Enable HTTPS
- Set up proper domain
- Configure CORS for production domain

## 📞 Support

For issues or questions, check:
- Backend logs: `python main.py`
- Frontend logs: Browser console
- Edge function logs: Supabase dashboard

---

Built with ❤️ for Smart Shopping Experience
