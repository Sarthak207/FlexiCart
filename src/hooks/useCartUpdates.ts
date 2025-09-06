import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { CartItem } from '@/types';

interface CartUpdateMessage {
  type: 'cart_update';
  user_id: string;
  action: 'add' | 'remove' | 'update';
  item?: any;
  product_id?: string;
  quantity?: number;
  timestamp: number;
}

interface WeightUpdateMessage {
  type: 'weight_update';
  device_id: string;
  weight: number;
  stable: boolean;
  timestamp: number;
}

interface UseCartUpdatesOptions {
  userId: string;
  onCartUpdate?: (cartItems: CartItem[]) => void;
  onWeightUpdate?: (weight: number, stable: boolean) => void;
  websocketUrl?: string;
}

export const useCartUpdates = ({
  userId,
  onCartUpdate,
  onWeightUpdate,
  websocketUrl = 'ws://localhost:8000/ws'
}: UseCartUpdatesOptions) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [weightStable, setWeightStable] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const handleMessage = (message: CartUpdateMessage | WeightUpdateMessage) => {
    if (message.type === 'cart_update' && message.user_id === userId) {
      handleCartUpdate(message as CartUpdateMessage);
    } else if (message.type === 'weight_update') {
      handleWeightUpdate(message as WeightUpdateMessage);
    }
  };

  const handleCartUpdate = (message: CartUpdateMessage) => {
    setCartItems(prevItems => {
      let newItems = [...prevItems];

      switch (message.action) {
        case 'add':
          if (message.item) {
            // Check if item already exists
            const existingIndex = newItems.findIndex(
              item => item.product.id === message.item.product_id
            );

            if (existingIndex >= 0) {
              // Update quantity
              newItems[existingIndex].quantity += message.item.quantity;
            } else {
              // Add new item (you'll need to fetch product details)
              // For now, create a basic item structure
              const newItem: CartItem = {
                product: {
                  id: message.item.product_id,
                  name: `Product ${message.item.product_id}`,
                  price: 0,
                  image: '/placeholder.svg',
                  category: 'unknown'
                },
                quantity: message.item.quantity,
                addedAt: new Date(message.timestamp * 1000)
              };
              newItems.push(newItem);
            }
          }
          break;

        case 'remove':
          if (message.product_id) {
            newItems = newItems.filter(
              item => item.product.id !== message.product_id
            );
          }
          break;

        case 'update':
          if (message.product_id && message.quantity !== undefined) {
            const itemIndex = newItems.findIndex(
              item => item.product.id === message.product_id
            );
            if (itemIndex >= 0) {
              newItems[itemIndex].quantity = message.quantity;
            }
          }
          break;
      }

      setLastUpdate(message.timestamp);
      onCartUpdate?.(newItems);
      return newItems;
    });
  };

  const handleWeightUpdate = (message: WeightUpdateMessage) => {
    setCurrentWeight(message.weight);
    setWeightStable(message.stable);
    onWeightUpdate?.(message.weight, message.stable);
  };

  const { isConnected, error, sendMessage } = useWebSocket({
    url: websocketUrl,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('Connected to cart updates WebSocket');
    },
    onClose: () => {
      console.log('Disconnected from cart updates WebSocket');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Send ping to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(() => {
        sendMessage({ type: 'ping' });
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendMessage]);

  return {
    cartItems,
    currentWeight,
    weightStable,
    lastUpdate,
    isConnected,
    error
  };
};
