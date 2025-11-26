#!/usr/bin/env python3
"""
Advanced Object Detection Pipeline with Camera Optimization
- Multi-frame smoothing & best-frame selection
- Auto-exposure & blur detection
- Object tracking with ID consistency
- Optimized for IP webcam with distance/lighting robustness
"""

import cv2
import numpy as np
import time
import logging
from collections import deque, defaultdict
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AdvancedDetection")


@dataclass
class DetectionConfig:
    """Configuration for advanced detection system"""
    # Camera settings
    camera_url: str = "http://10.200.212.15:8080/video"
    frame_width: int = 1280  # Higher resolution for better accuracy
    frame_height: int = 720
    fps_target: int = 30
    
    # Detection settings
    confidence_threshold: float = 0.6  # Higher threshold for quality
    nms_iou_threshold: float = 0.4  # Non-max suppression
    model_name: str = "yolov8n.pt"  # Can upgrade to yolov8m.pt or yolov9
    
    # Frame quality settings
    blur_threshold: float = 100.0  # Laplacian variance threshold
    min_brightness: int = 40  # Minimum acceptable brightness
    max_brightness: int = 220  # Maximum acceptable brightness
    
    # Multi-frame settings
    frame_buffer_size: int = 5  # Frames to analyze for best selection
    detection_confirmation_frames: int = 3  # Frames to confirm detection
    
    # Tracking settings
    max_track_age: int = 30  # Frames to keep track alive
    min_track_hits: int = 3  # Minimum hits before confirming object
    iou_threshold: float = 0.3  # IOU threshold for tracking
    
    # Performance settings
    frame_skip: int = 2  # Process every Nth frame
    use_gpu: bool = True  # Use GPU if available


@dataclass
class TrackedObject:
    """Represents a tracked object with ID consistency"""
    track_id: int
    class_name: str
    confidence: float
    bbox: List[float]
    hits: int = 0
    age: int = 0
    confirmed: bool = False
    last_seen_frame: int = 0


class CameraOptimizer:
    """Optimizes camera settings for IP webcam"""
    
    def __init__(self, cap: cv2.VideoCapture):
        self.cap = cap
        self.exposure_history = deque(maxlen=30)
        self.brightness_history = deque(maxlen=30)
    
    def optimize_settings(self):
        """Apply optimal camera settings for IP webcam"""
        # Set resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # Disable auto-focus if possible (reduces jitter)
        self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
        
        # Set exposure manually for consistency
        self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)  # Manual mode
        self.cap.set(cv2.CAP_PROP_EXPOSURE, -6)  # Experiment with values
        
        # Set white balance
        self.cap.set(cv2.CAP_PROP_AUTO_WB, 1)
        
        logger.info("✅ Camera settings optimized")
    
    def adjust_exposure(self, frame: np.ndarray):
        """Dynamically adjust exposure based on brightness"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        self.brightness_history.append(mean_brightness)
        
        if len(self.brightness_history) >= 10:
            avg_brightness = np.mean(self.brightness_history)
            
            # Adjust exposure if too dark or too bright
            if avg_brightness < 50:
                current_exp = self.cap.get(cv2.CAP_PROP_EXPOSURE)
                self.cap.set(cv2.CAP_PROP_EXPOSURE, current_exp + 1)
                logger.info(f"📊 Increased exposure (brightness: {avg_brightness:.1f})")
            elif avg_brightness > 200:
                current_exp = self.cap.get(cv2.CAP_PROP_EXPOSURE)
                self.cap.set(cv2.CAP_PROP_EXPOSURE, current_exp - 1)
                logger.info(f"📊 Decreased exposure (brightness: {avg_brightness:.1f})")


class FrameQualityAnalyzer:
    """Analyzes frame quality for best-frame selection"""
    
    @staticmethod
    def calculate_blur(frame: np.ndarray) -> float:
        """Calculate blur using Laplacian variance (higher = sharper)"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return laplacian_var
    
    @staticmethod
    def calculate_brightness(frame: np.ndarray) -> float:
        """Calculate average brightness"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return np.mean(gray)
    
    @staticmethod
    def calculate_contrast(frame: np.ndarray) -> float:
        """Calculate contrast (standard deviation of brightness)"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return np.std(gray)
    
    @staticmethod
    def is_good_quality(frame: np.ndarray, config: DetectionConfig) -> bool:
        """Check if frame meets quality standards"""
        blur = FrameQualityAnalyzer.calculate_blur(frame)
        brightness = FrameQualityAnalyzer.calculate_brightness(frame)
        
        is_sharp = blur > config.blur_threshold
        is_well_lit = config.min_brightness < brightness < config.max_brightness
        
        return is_sharp and is_well_lit
    
    @staticmethod
    def score_frame(frame: np.ndarray) -> float:
        """Calculate overall quality score"""
        blur = FrameQualityAnalyzer.calculate_blur(frame)
        contrast = FrameQualityAnalyzer.calculate_contrast(frame)
        brightness = FrameQualityAnalyzer.calculate_brightness(frame)
        
        # Normalize and combine scores
        blur_score = min(blur / 200.0, 1.0)
        contrast_score = min(contrast / 100.0, 1.0)
        brightness_score = 1.0 - abs(brightness - 127.5) / 127.5
        
        return (blur_score * 0.5 + contrast_score * 0.3 + brightness_score * 0.2)


class FramePreprocessor:
    """Advanced preprocessing pipeline"""
    
    @staticmethod
    def denoise(frame: np.ndarray) -> np.ndarray:
        """Apply denoising"""
        return cv2.fastNlMeansDenoisingColored(frame, None, 10, 10, 7, 21)
    
    @staticmethod
    def enhance_contrast(frame: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE"""
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        enhanced = cv2.merge([l, a, b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    @staticmethod
    def correct_exposure(frame: np.ndarray) -> np.ndarray:
        """Auto-correct exposure"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        
        # Equalize V channel
        v = cv2.equalizeHist(v)
        
        hsv = cv2.merge([h, s, v])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    @staticmethod
    def sharpen(frame: np.ndarray) -> np.ndarray:
        """Apply sharpening filter"""
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        return cv2.filter2D(frame, -1, kernel)
    
    @staticmethod
    def preprocess(frame: np.ndarray, light: bool = False) -> np.ndarray:
        """Full preprocessing pipeline"""
        if light:
            # Light preprocessing for speed
            return FramePreprocessor.enhance_contrast(frame)
        else:
            # Full preprocessing for quality
            frame = FramePreprocessor.enhance_contrast(frame)
            frame = FramePreprocessor.sharpen(frame)
            return frame


class ObjectTracker:
    """Simple but effective object tracker for ID consistency"""
    
    def __init__(self, config: DetectionConfig):
        self.config = config
        self.tracks: Dict[int, TrackedObject] = {}
        self.next_track_id = 1
        self.frame_count = 0
    
    def calculate_iou(self, box1: List[float], box2: List[float]) -> float:
        """Calculate Intersection over Union"""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # Intersection area
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return 0.0
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Union area
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def update(self, detections: List[Dict]) -> List[TrackedObject]:
        """Update tracks with new detections"""
        self.frame_count += 1
        
        # Match detections to existing tracks
        matched_tracks = set()
        matched_detections = set()
        
        for det_idx, det in enumerate(detections):
            best_iou = 0
            best_track_id = None
            
            for track_id, track in self.tracks.items():
                if track.class_name != det['class_name']:
                    continue
                
                iou = self.calculate_iou(track.bbox, det['bbox'])
                if iou > best_iou and iou > self.config.iou_threshold:
                    best_iou = iou
                    best_track_id = track_id
            
            if best_track_id is not None:
                # Update existing track
                track = self.tracks[best_track_id]
                track.bbox = det['bbox']
                track.confidence = det['confidence']
                track.hits += 1
                track.age = 0
                track.last_seen_frame = self.frame_count
                
                if track.hits >= self.config.min_track_hits:
                    track.confirmed = True
                
                matched_tracks.add(best_track_id)
                matched_detections.add(det_idx)
        
        # Create new tracks for unmatched detections
        for det_idx, det in enumerate(detections):
            if det_idx not in matched_detections:
                new_track = TrackedObject(
                    track_id=self.next_track_id,
                    class_name=det['class_name'],
                    confidence=det['confidence'],
                    bbox=det['bbox'],
                    hits=1,
                    age=0,
                    last_seen_frame=self.frame_count
                )
                self.tracks[self.next_track_id] = new_track
                self.next_track_id += 1
        
        # Age out old tracks
        tracks_to_remove = []
        for track_id, track in self.tracks.items():
            if track_id not in matched_tracks:
                track.age += 1
                if track.age > self.config.max_track_age:
                    tracks_to_remove.append(track_id)
        
        for track_id in tracks_to_remove:
            del self.tracks[track_id]
        
        # Return only confirmed tracks
        return [t for t in self.tracks.values() if t.confirmed]


class AdvancedDetectionSystem:
    """Complete advanced detection system"""
    
    def __init__(self, config: DetectionConfig):
        self.config = config
        self.model = None
        self.cap = None
        self.camera_optimizer = None
        self.tracker = ObjectTracker(config)
        self.frame_buffer = deque(maxlen=config.frame_buffer_size)
        self.detection_history = defaultdict(int)
        self.frame_count = 0
        self.fps = 0
        self.last_fps_time = time.time()
    
    def initialize(self):
        """Initialize all components"""
        # Load YOLO model
        logger.info(f"🔄 Loading {self.config.model_name}...")
        device = 'cuda:0' if self.config.use_gpu else 'cpu'
        self.model = YOLO(self.config.model_name)
        self.model.to(device)
        logger.info(f"✅ Model loaded on {device}")
        
        # Initialize camera
        logger.info(f"🎥 Connecting to camera: {self.config.camera_url}")
        self.cap = cv2.VideoCapture(self.config.camera_url)
        
        if not self.cap.isOpened():
            raise RuntimeError("❌ Failed to open camera stream")
        
        # Optimize camera settings
        self.camera_optimizer = CameraOptimizer(self.cap)
        self.camera_optimizer.optimize_settings()
        
        logger.info("✅ Advanced detection system initialized")
    
    def select_best_frame(self) -> Optional[np.ndarray]:
        """Select best quality frame from buffer"""
        if len(self.frame_buffer) < 3:
            return None
        
        best_frame = None
        best_score = -1
        
        for frame in self.frame_buffer:
            score = FrameQualityAnalyzer.score_frame(frame)
            if score > best_score:
                best_score = score
                best_frame = frame
        
        return best_frame
    
    def detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Run YOLO detection with NMS"""
        results = self.model.predict(
            frame,
            conf=self.config.confidence_threshold,
            iou=self.config.nms_iou_threshold,
            verbose=False,
            stream=False
        )
        
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = self.model.names[cls_id]
                bbox = box.xyxy[0].tolist()
                
                detections.append({
                    'class_name': class_name,
                    'confidence': conf,
                    'bbox': bbox
                })
        
        return detections
    
    def draw_tracking_info(self, frame: np.ndarray, tracked_objects: List[TrackedObject]) -> np.ndarray:
        """Draw bounding boxes and tracking info"""
        annotated = frame.copy()
        
        for obj in tracked_objects:
            x1, y1, x2, y2 = map(int, obj.bbox)
            
            # Color based on confidence
            if obj.confidence > 0.8:
                color = (0, 255, 0)  # Green - high confidence
            elif obj.confidence > 0.6:
                color = (0, 255, 255)  # Yellow - medium confidence
            else:
                color = (0, 165, 255)  # Orange - low confidence
            
            # Draw box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            # Draw label with ID
            label = f"ID:{obj.track_id} {obj.class_name} {obj.confidence:.2f}"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            
            # Background for text
            cv2.rectangle(annotated, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), color, -1)
            
            # Text
            cv2.putText(annotated, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # Draw FPS
        cv2.putText(annotated, f"FPS: {self.fps:.1f}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Draw quality info
        blur = FrameQualityAnalyzer.calculate_blur(frame)
        brightness = FrameQualityAnalyzer.calculate_brightness(frame)
        cv2.putText(annotated, f"Sharpness: {blur:.0f} | Brightness: {brightness:.0f}", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return annotated
    
    def calculate_fps(self):
        """Calculate current FPS"""
        current_time = time.time()
        self.fps = 1.0 / (current_time - self.last_fps_time)
        self.last_fps_time = current_time
    
    def run(self):
        """Main detection loop"""
        logger.info("🚀 Starting advanced detection system...")
        logger.info("Press 'q' to quit, 'p' to pause, 's' to save frame")
        
        paused = False
        
        try:
            while True:
                if not paused:
                    ret, frame = self.cap.read()
                    if not ret:
                        logger.warning("⚠️ Failed to read frame")
                        time.sleep(0.1)
                        continue
                    
                    self.frame_count += 1
                    self.calculate_fps()
                    
                    # Add to buffer
                    self.frame_buffer.append(frame.copy())
                    
                    # Adjust exposure dynamically
                    if self.frame_count % 30 == 0:
                        self.camera_optimizer.adjust_exposure(frame)
                    
                    # Process every Nth frame
                    if self.frame_count % self.config.frame_skip == 0:
                        # Select best frame from buffer
                        best_frame = self.select_best_frame()
                        if best_frame is None:
                            best_frame = frame
                        
                        # Check quality
                        if not FrameQualityAnalyzer.is_good_quality(best_frame, self.config):
                            logger.debug("⚠️ Frame quality low, skipping detection")
                        else:
                            # Preprocess
                            processed = FramePreprocessor.preprocess(best_frame, light=True)
                            
                            # Detect objects
                            detections = self.detect_objects(processed)
                            
                            # Update tracker
                            tracked_objects = self.tracker.update(detections)
                            
                            # Draw tracking info
                            annotated = self.draw_tracking_info(frame, tracked_objects)
                            
                            # Log confirmed detections
                            if tracked_objects:
                                logger.info(f"📦 Tracked: {[(o.track_id, o.class_name, f'{o.confidence:.2f}') for o in tracked_objects]}")
                            
                            cv2.imshow("Advanced Detection System", annotated)
                    else:
                        # Just show raw frame
                        cv2.imshow("Advanced Detection System", frame)
                
                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    logger.info("🛑 Exiting...")
                    break
                elif key == ord('p'):
                    paused = not paused
                    logger.info(f"{'⏸️ Paused' if paused else '▶️ Resumed'}")
                elif key == ord('s'):
                    filename = f"capture_{int(time.time())}.jpg"
                    cv2.imwrite(filename, frame)
                    logger.info(f"💾 Saved: {filename}")
        
        except KeyboardInterrupt:
            logger.info("⚠️ Interrupted by user")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        logger.info("🧹 Cleanup complete")


def main():
    """Main entry point"""
    config = DetectionConfig(
        camera_url="http://10.200.212.15:8080/video",
        model_name="yolov8n.pt",  # Can upgrade to yolov8m.pt, yolov9c.pt
        confidence_threshold=0.6,
        frame_skip=2,
        use_gpu=True
    )
    
    system = AdvancedDetectionSystem(config)
    system.initialize()
    system.run()


if __name__ == "__main__":
    main()
