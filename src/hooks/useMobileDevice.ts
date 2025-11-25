import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface DeviceInfo {
  platform: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  isConnected: boolean;
  connectionType: string;
}

export const useMobileDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isCapacitor = Capacitor.isNativePlatform();

  useEffect(() => {
    const getDeviceInfo = async () => {
      if (!isCapacitor) {
        setDeviceInfo({
          platform: 'web',
          model: 'Browser',
          operatingSystem: navigator.platform,
          osVersion: 'N/A',
          isConnected: navigator.onLine,
          connectionType: 'unknown'
        });
        setIsLoading(false);
        return;
      }

      try {
        const [device, networkStatus] = await Promise.all([
          Device.getInfo(),
          Network.getStatus()
        ]);

        setDeviceInfo({
          platform: device.platform,
          model: device.model || 'Unknown',
          operatingSystem: device.operatingSystem,
          osVersion: device.osVersion || 'Unknown',
          isConnected: networkStatus.connected,
          connectionType: networkStatus.connectionType
        });
      } catch (error) {
        console.error('Error getting device info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getDeviceInfo();

    // Listen for network changes
    if (isCapacitor) {
      let networkListener: any;
      
      Network.addListener('networkStatusChange', (status) => {
        setDeviceInfo(prev => prev ? {
          ...prev,
          isConnected: status.connected,
          connectionType: status.connectionType
        } : null);
      }).then(listener => {
        networkListener = listener;
      });

      return () => {
        if (networkListener) {
          networkListener.remove();
        }
      };
    }
  }, [isCapacitor]);

  return {
    deviceInfo,
    isLoading,
    isCapacitor,
    isMobile: isCapacitor || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
};