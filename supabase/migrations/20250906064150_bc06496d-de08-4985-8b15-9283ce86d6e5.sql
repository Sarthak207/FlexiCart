-- Create store_maps table for store layouts
CREATE TABLE public.store_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  layout_data JSONB NOT NULL DEFAULT '{}', -- Store map layout as JSON
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_positions table to link products with map locations
CREATE TABLE public.product_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.store_maps(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  zone_name TEXT,
  shelf_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(map_id, product_id)
);

-- Create subscriptions table for user subscription management
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create analytics_events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing transactions table
ALTER TABLE public.transactions 
ADD COLUMN payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Add map_position_id to products table
ALTER TABLE public.products 
ADD COLUMN map_position_id UUID REFERENCES public.product_positions(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.store_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_maps
CREATE POLICY "Anyone can view active store maps" ON public.store_maps
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage store maps" ON public.store_maps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for product_positions  
CREATE POLICY "Anyone can view product positions" ON public.product_positions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage product positions" ON public.product_positions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for analytics_events
CREATE POLICY "Users can view their own analytics" ON public.analytics_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_product_positions_map_id ON public.product_positions(map_id);
CREATE INDEX idx_product_positions_product_id ON public.product_positions(product_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Add triggers for updated_at timestamps on new tables
CREATE TRIGGER update_store_maps_updated_at
  BEFORE UPDATE ON public.store_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_product_positions_updated_at
  BEFORE UPDATE ON public.product_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();