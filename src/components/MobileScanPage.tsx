import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMobileCamera } from '@/hooks/useMobileCamera';
import { useMobileDevice } from '@/hooks/useMobileDevice';
import { Camera, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface MobileScanPageProps {
  onNavigate: (tab: string) => void;
}

const MobileScanPage = ({ onNavigate }: MobileScanPageProps) => {
  const { takePicture, isCapacitor, isLoading, error } = useMobileCamera();
  const { deviceInfo, isMobile } = useMobileDevice();
  const [lastImage, setLastImage] = useState<string | null>(null);

  const handleTakePicture = async () => {
    const imageData = await takePicture();
    if (imageData) {
      setLastImage(imageData);
      toast.success('Picture taken successfully!');
      // Here you would typically process the image for barcode/product recognition
    } else if (error) {
      toast.error(error);
    }
  };

  if (!isMobile && !isCapacitor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Features Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Camera and mobile features are only available on mobile devices or in the mobile app.
            </p>
            <Button onClick={() => onNavigate('scan')}>
              Use Web Scanner Instead
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {deviceInfo?.isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Platform:</strong> {deviceInfo?.platform || 'Unknown'}</p>
            <p><strong>Model:</strong> {deviceInfo?.model || 'Unknown'}</p>
            <p><strong>OS:</strong> {deviceInfo?.operatingSystem} {deviceInfo?.osVersion}</p>
            <p><strong>Connection:</strong> 
              <span className={deviceInfo?.isConnected ? 'text-green-600' : 'text-red-600'}>
                {deviceInfo?.isConnected ? ` Connected (${deviceInfo.connectionType})` : ' Offline'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Camera Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Product Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Use your device camera to scan products and barcodes
          </p>
          
          <Button 
            onClick={handleTakePicture}
            disabled={isLoading || !deviceInfo?.isConnected}
            size="lg" 
            className="w-full"
          >
            {isLoading ? 'Taking Picture...' : 'Scan Product'}
          </Button>

          {lastImage && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Last Captured:</p>
              <img 
                src={lastImage} 
                alt="Captured product" 
                className="w-full max-w-xs mx-auto rounded-lg border"
              />
            </div>
          )}

          {!deviceInfo?.isConnected && (
            <p className="text-red-600 text-sm">
              ⚠️ No internet connection. Some features may not work.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={() => onNavigate('cart')}
          className="h-16"
        >
          View Cart
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('home')}
          className="h-16"
        >
          Browse Products
        </Button>
      </div>
    </div>
  );
};

export default MobileScanPage;