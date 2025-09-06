#!/usr/bin/env python3
"""
Smart Cart Backend Integration API
Handles hardware integrations and real-time updates
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import time
import asyncio
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Smart Cart Hardware Integration API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class CartItemRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: int = 1
    scan_type: str  # 'rfid', 'camera', 'manual'
    scan_value: str
    confidence: Optional[float] = None
    timestamp: float

class WeightUpdateRequest(BaseModel):
    device_id: str
    weight: float
    stable: bool
    timestamp: float
    reason: str

class CartUpdateRequest(BaseModel):
    user_id: str
    action: str  # 'add', 'remove', 'update'
    product_id: str
    quantity: int = 1
    timestamp: float

# In-memory storage (in production, use a database)
active_connections: List[WebSocket] = []
cart_data: Dict[str, List[Dict[str, Any]]] = {}
weight_data: Dict[str, Dict[str, Any]] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Smart Cart Hardware Integration API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/cart/add-item")
async def add_item_to_cart(item: CartItemRequest):
    """Add item to cart from hardware scan"""
    try:
        # Validate product exists (in production, check database)
        # For demo, we'll accept any product_id
        
        # Create cart item
        cart_item = {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "scan_type": item.scan_type,
            "scan_value": item.scan_value,
            "confidence": item.confidence,
            "added_at": datetime.now().isoformat(),
            "timestamp": item.timestamp
        }
        
        # Add to user's cart
        if item.user_id not in cart_data:
            cart_data[item.user_id] = []
        
        # Check if item already exists
        existing_item = None
        for existing in cart_data[item.user_id]:
            if existing["product_id"] == item.product_id:
                existing_item = existing
                break
        
        if existing_item:
            # Update quantity
            existing_item["quantity"] += item.quantity
            existing_item["updated_at"] = datetime.now().isoformat()
        else:
            # Add new item
            cart_data[item.user_id].append(cart_item)
        
        # Broadcast update to connected clients
        await manager.broadcast({
            "type": "cart_update",
            "user_id": item.user_id,
            "action": "add",
            "item": cart_item,
            "timestamp": time.time()
        })
        
        logger.info(f"Added item to cart: {item.product_id} for user {item.user_id}")
        
        return {
            "success": True,
            "message": "Item added to cart",
            "cart_item": cart_item
        }
        
    except Exception as e:
        logger.error(f"Error adding item to cart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/weight/update")
async def update_weight(weight_update: WeightUpdateRequest):
    """Update weight data from load cell"""
    try:
        # Store weight data
        weight_data[weight_update.device_id] = {
            "weight": weight_update.weight,
            "stable": weight_update.stable,
            "timestamp": weight_update.timestamp,
            "reason": weight_update.reason,
            "updated_at": datetime.now().isoformat()
        }
        
        # Broadcast weight update to connected clients
        await manager.broadcast({
            "type": "weight_update",
            "device_id": weight_update.device_id,
            "weight": weight_update.weight,
            "stable": weight_update.stable,
            "timestamp": weight_update.timestamp
        })
        
        logger.info(f"Weight updated: {weight_update.weight}g (stable: {weight_update.stable})")
        
        return {
            "success": True,
            "message": "Weight updated",
            "weight_data": weight_data[weight_update.device_id]
        }
        
    except Exception as e:
        logger.error(f"Error updating weight: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str):
    """Get user's cart"""
    if user_id not in cart_data:
        cart_data[user_id] = []
    
    return {
        "user_id": user_id,
        "items": cart_data[user_id],
        "total_items": sum(item["quantity"] for item in cart_data[user_id])
    }

@app.delete("/api/cart/{user_id}/item/{product_id}")
async def remove_item_from_cart(user_id: str, product_id: str):
    """Remove item from cart"""
    if user_id not in cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Find and remove item
    cart_items = cart_data[user_id]
    for i, item in enumerate(cart_items):
        if item["product_id"] == product_id:
            removed_item = cart_items.pop(i)
            
            # Broadcast update
            await manager.broadcast({
                "type": "cart_update",
                "user_id": user_id,
                "action": "remove",
                "product_id": product_id,
                "timestamp": time.time()
            })
            
            return {
                "success": True,
                "message": "Item removed from cart",
                "removed_item": removed_item
            }
    
    raise HTTPException(status_code=404, detail="Item not found in cart")

@app.put("/api/cart/{user_id}/item/{product_id}")
async def update_item_quantity(user_id: str, product_id: str, quantity: int):
    """Update item quantity in cart"""
    if user_id not in cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Find and update item
    for item in cart_data[user_id]:
        if item["product_id"] == product_id:
            item["quantity"] = quantity
            item["updated_at"] = datetime.now().isoformat()
            
            # Broadcast update
            await manager.broadcast({
                "type": "cart_update",
                "user_id": user_id,
                "action": "update",
                "product_id": product_id,
                "quantity": quantity,
                "timestamp": time.time()
            })
            
            return {
                "success": True,
                "message": "Item quantity updated",
                "item": item
            }
    
    raise HTTPException(status_code=404, detail="Item not found in cart")

@app.get("/api/weight/{device_id}")
async def get_weight(device_id: str):
    """Get current weight for device"""
    if device_id not in weight_data:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return weight_data[device_id]

@app.get("/api/weight")
async def get_all_weights():
    """Get all weight data"""
    return weight_data

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle client messages if needed
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(manager.active_connections),
        "carts": len(cart_data),
        "weight_devices": len(weight_data)
    }

# Background tasks
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("Smart Cart Hardware Integration API started")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("Smart Cart Hardware Integration API stopped")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
