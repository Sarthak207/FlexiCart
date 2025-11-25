import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Camera, ShoppingCart, Loader2 } from "lucide-react";
import { Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScanPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

interface Detection {
  label: string;
  confidence: number;
  matchedProduct?: Product;
  matchConfidence?: number;
  isMatching?: boolean;
}

const ScanPage = ({ onAddToCart }: ScanPageProps) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "detections" && msg.data) {
        const newDetections: Detection[] = msg.data.map((det: any) => ({
          label: det.label,
          confidence: det.confidence,
          isMatching: true,
        }));
        
        setDetections(newDetections);
        
        // Match each detection to products
        for (let i = 0; i < newDetections.length; i++) {
          try {
            const { data, error } = await supabase.functions.invoke('match-product', {
              body: { detectedLabel: newDetections[i].label }
            });
            
            if (!error && data?.match) {
              setDetections(prev => prev.map((det, idx) => 
                idx === i ? {
                  ...det,
                  matchedProduct: data.match,
                  matchConfidence: data.confidence,
                  isMatching: false,
                } : det
              ));
            } else {
              setDetections(prev => prev.map((det, idx) => 
                idx === i ? { ...det, isMatching: false } : det
              ));
            }
          } catch (error) {
            console.error('Error matching product:', error);
            setDetections(prev => prev.map((det, idx) => 
              idx === i ? { ...det, isMatching: false } : det
            ));
          }
        }
      }
    };
    
    ws.onerror = () => {
      console.error("WebSocket error");
      toast({
        title: "Connection Error",
        description: "Failed to connect to camera. Make sure the backend is running.",
        variant: "destructive",
      });
    };
    
    ws.onclose = () => console.warn("WebSocket closed");
    return () => ws.close();
  }, [toast]);

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
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Detection Info */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">Detected: {det.label}</p>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {(det.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Matched Product */}
                      {det.isMatching ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Matching product...</span>
                        </div>
                      ) : det.matchedProduct ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            {det.matchedProduct.image ? (
                              <img
                                src={det.matchedProduct.image}
                                alt={det.matchedProduct.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm line-clamp-2">
                                {det.matchedProduct.name}
                              </p>
                              <p className="text-lg font-bold text-primary">
                                ₹{det.matchedProduct.price.toFixed(2)}
                              </p>
                              {det.matchConfidence && (
                                <p className="text-xs text-muted-foreground">
                                  Match: {det.matchConfidence.toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              onAddToCart(det.matchedProduct!, 1);
                              toast({
                                title: "Added to cart",
                                description: `${det.matchedProduct!.name} added successfully`,
                              });
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No matching product found</p>
                      )}
                    </CardContent>
                  </Card>
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
