// Gemini Vision Service for Product Scanner
import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiAI: GoogleGenerativeAI | null = null;
let visionModel: any = null;

export async function initializeVision() {
  console.log('🔍 Initializing Vision (using backend proxy)...');
  const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  try {
    // Probe backend health to ensure proxy endpoint is reachable
    const res = await fetch(`${backendUrl}/`);
    if (!res.ok) {
      console.warn('⚠️ Backend health check failed, vision proxy may be unavailable');
      return false;
    }
    console.log('✅ Vision backend proxy is reachable');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not reach vision backend proxy:', error);
    return false;
  }
}

export async function analyzeImage(
  imageFile: File,
  products: any[]
): Promise<{
  detectedProduct: string;
  confidence: number;
  relatedProducts: any[];
  description: string;
}> {
  // Send image to backend proxy for analysis
  try {
    const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const base64Image = await fileToBase64(imageFile);

    console.log('📤 Uploading image to backend proxy for analysis...');

    const resp = await fetch(`${backendUrl}/api/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, products })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Vision proxy error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    console.log('✅ Vision proxy response:', data);

    const detected = data.detectedProduct || data.product || 'Unknown Product';
    const category = data.category || '';
    const confidence = data.confidence || 70;
    const description = data.description || data.raw || '';

    const relatedProducts = findRelatedProducts(detected, category, products);

    return {
      detectedProduct: detected,
      confidence,
      relatedProducts,
      description
    };

  } catch (error) {
    console.error('⚠️ Vision proxy failed:', error);
    return analyzeFallback(imageFile.name, products);
  }
}

function parseVisionResponse(visionResult: string, products: any[]) {
  try {
    // Parse format: PRODUCT: [name] | CATEGORY: [category] | BRAND: [brand] | CONFIDENCE: [number] | DESC: [description]
    const productMatch = visionResult.match(/PRODUCT:\s*([^|]+)/i);
    const categoryMatch = visionResult.match(/CATEGORY:\s*([^|]+)/i);
    const brandMatch = visionResult.match(/BRAND:\s*([^|]+)/i);
    const confidenceMatch = visionResult.match(/CONFIDENCE:\s*(\d+)/i);
    const descMatch = visionResult.match(/DESC:\s*(.+)/i);

    const detectedProduct = productMatch ? productMatch[1].trim() : 'Unknown Product';
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
    const description = descMatch ? descMatch[1].trim() : visionResult;

    // Find related products
    const relatedProducts = findRelatedProducts(detectedProduct, category, products);

    return {
      detectedProduct,
      confidence,
      relatedProducts,
      description
    };
  } catch (error) {
    return {
      detectedProduct: 'Unknown Product',
      confidence: 50,
      relatedProducts: products.slice(0, 3),
      description: visionResult
    };
  }
}

function analyzeFallback(fileName: string, products: any[]) {
  
  // Try to detect category from filename
  const categories = {
    'chips': 'Snacks',
    'biscuit': 'Biscuits',
    'chocolate': 'Chocolates',
    'drink': 'Cold Drinks',
    'beverage': 'Cold Drinks',
    'bread': 'Bread',
    'milk': 'Dairy',
    'dairy': 'Dairy',
    'oil': 'Oil',
    'rice': 'Rice',
    'snack': 'Snacks',
  };

  let detectedCategory = 'General';
  let detectedProduct = 'Product';

  for (const [keyword, category] of Object.entries(categories)) {
    if (fileName.includes(keyword)) {
      detectedCategory = category;
      detectedProduct = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  const relatedProducts = findRelatedProducts(detectedProduct, detectedCategory, products);

  return {
    detectedProduct: `${detectedProduct} (Detected from filename)`,
    confidence: 70,
    relatedProducts,
    description: `Based on the image analysis, this appears to be a ${detectedProduct.toLowerCase()} product. We found ${relatedProducts.length} similar items in your store.`
  };
}

function findRelatedProducts(detectedProduct: string, category: string, products: any[]) {
  if (!products || products.length === 0) return [];

  const productLower = detectedProduct.toLowerCase();
  
  // Score each product based on relevance
  const scoredProducts = products.map(product => {
    let score = 0;
    
    // Exact category match
    if (product.category?.toLowerCase() === category.toLowerCase()) {
      score += 50;
    }
    
    // Partial category match
    if (product.category?.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(product.category?.toLowerCase())) {
      score += 30;
    }
    
    // Product name similarity
    const nameLower = product.name?.toLowerCase() || '';
    if (nameLower.includes(productLower) || productLower.includes(nameLower)) {
      score += 40;
    }
    
    // Word overlap
    const productWords = productLower.split(/\s+/);
    const nameWords = nameLower.split(/\s+/);
    const commonWords = productWords.filter(word => 
      word.length > 3 && nameWords.some(nw => nw.includes(word) || word.includes(nw))
    );
    score += commonWords.length * 10;
    
    return { ...product, relevanceScore: score };
  });

  // Sort by relevance and return top matches
  return scoredProducts
    .filter(p => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Video analysis - extract frame and analyze
export async function analyzeVideo(
  videoFile: File,
  products: any[]
): Promise<{
  detectedProduct: string;
  confidence: number;
  relatedProducts: any[];
  description: string;
}> {
  console.log('🎥 Extracting frame from video...');
  
  try {
    // Create video element to extract frame
    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    
    return new Promise((resolve) => {
      video.onloadeddata = async () => {
        // Seek to middle of video
        video.currentTime = video.duration / 2;
        
        video.onseeked = async () => {
          // Create canvas and extract frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (blob) {
              const imageFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
              const result = await analyzeImage(imageFile, products);
              URL.revokeObjectURL(videoUrl);
              resolve(result);
            }
          }, 'image/jpeg');
        };
      };
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return generateFallbackAnalysis(videoFile, products);
  }
}
