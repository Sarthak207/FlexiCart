import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { detectedLabel } = await req.json();
    
    if (!detectedLabel) {
      return new Response(JSON.stringify({ error: 'No label provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Error fetching products:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ match: null, confidence: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fuzzy matching logic
    const normalizedLabel = detectedLabel.toLowerCase().trim();
    
    // Calculate similarity scores
    const matches = products.map(product => {
      const productName = product.name.toLowerCase();
      const productCategory = product.category?.toLowerCase() || '';
      
      // Calculate different matching scores
      let score = 0;
      
      // Exact match
      if (productName === normalizedLabel) {
        score = 100;
      }
      // Contains full label
      else if (productName.includes(normalizedLabel)) {
        score = 80;
      }
      // Label contains product name
      else if (normalizedLabel.includes(productName)) {
        score = 70;
      }
      // Category match
      else if (normalizedLabel.includes(productCategory) || productCategory.includes(normalizedLabel)) {
        score = 60;
      }
      // Word overlap
      else {
        const labelWords = normalizedLabel.split(/\s+/);
        const nameWords = productName.split(/\s+/);
        const overlap = labelWords.filter(word => nameWords.some(nw => nw.includes(word) || word.includes(nw)));
        score = (overlap.length / Math.max(labelWords.length, nameWords.length)) * 50;
      }
      
      return { product, score };
    });

    // Sort by score and get best match
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0];

    // Only return if confidence is above threshold
    if (bestMatch.score < 30) {
      return new Response(JSON.stringify({ match: null, confidence: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Matched "${detectedLabel}" to "${bestMatch.product.name}" with score ${bestMatch.score}`);

    return new Response(JSON.stringify({
      match: bestMatch.product,
      confidence: bestMatch.score,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in match-product:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
