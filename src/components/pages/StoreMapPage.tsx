import { useProducts } from '@/hooks/useProducts';
import MapEditor from '@/components/MapEditor';

interface StoreMapPageProps {
  onNavigate: (tab: string) => void;
}

const StoreMapPage = ({ onNavigate }: StoreMapPageProps) => {
  const { products } = useProducts();
  
  return <MapEditor onNavigate={onNavigate} products={products} />;
};

export default StoreMapPage;