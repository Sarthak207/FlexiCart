import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface UseMobileCameraResult {
  takePicture: () => Promise<string | null>;
  isCapacitor: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useMobileCamera = (): UseMobileCameraResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isCapacitor = Capacitor.isNativePlatform();

  const takePicture = async (): Promise<string | null> => {
    if (!isCapacitor) {
      setError('Camera not available in web browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (err) {
      setError('Failed to take picture');
      console.error('Camera error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    takePicture,
    isCapacitor,
    isLoading,
    error
  };
};