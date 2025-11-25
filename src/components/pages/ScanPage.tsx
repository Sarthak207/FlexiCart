import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Camera, ShoppingCart } from "lucide-react";
import { Product } from "@/types";

interface ScanPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

const ScanPage = ({ onAddToCart }: ScanPageProps) => {
  const [detections, setDetections] = useState<{ label: string; confidence: number }[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "detections") {
        setDetections(msg.data);
      }
    };
    ws.onerror = () => console.error("WebSocket error");
    ws.onclose = () => console.warn("WebSocket closed");
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Camera Feed */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="w-full h-[480px] bg-black rounded-xl overflow-hidden border border-primary/40 shadow-lg">
              <img
                src="http://localhost:8000/video_feed"
                alt="AI Camera Feed"
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Detected Objects Sidebar */}
        <Card className="w-full lg:w-[400px]">
          <CardContent className="p-6 space-y-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Detections
            </CardTitle>

            {detections.length === 0 ? (
              <p className="text-muted-foreground">No products detected yet...</p>
            ) : (
              <div className="space-y-3">
                {detections.map((det, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted/30 px-4 py-2 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{det.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(det.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        onAddToCart({
                          id: det.label,
                          name: det.label,
                          category: "detected",
                          image: "",
                          price: 1.0,
                          weight: 100,
                        }, 1)
                      }
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanPage;
