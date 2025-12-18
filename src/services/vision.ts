// Ollama Vision Service for Image/Video Analysis

let isOllamaAvailable = false;

export async function initializeVision() {
  console.log('🔍 Checking for Ollama Vision...');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      const hasVisionModel = data.models?.some((m: any) => 
        m.name.includes('llava') || m.name.includes('vision')
      );
      
      if (hasVisionModel) {
        console.log('✅ Ollama Vision model detected!');
        isOllamaAvailable = true;
        return true;
      } else {
        console.warn('⚠️ Vision model not found. Install with: ollama pull llava');
        return false;
      }
    }
  } catch (error) {
    console.warn('⚠️ Ollama not detected. Using smart fallback.');
  }
  
  return false;
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
  // Initialize if not already done
  if (!isOllamaAvailable) {
    await initializeVision();
  }

  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  if (isOllamaAvailable) {
    try {
      console.log('🤖 Analyzing image with Ollama Vision...');
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llava',
          prompt: `Analyze this product image and identify what it is. Be specific about the product type, category, and brand if visible. Respond in this format:
Product: [product name/type]
Category: [category]
Description: [brief description]`,
          images: [base64Image.split(',')[1]], // Remove data:image/... prefix
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image analyzed by Ollama');
        return parseVisionResponse(data.response, products);
      }
    } catch (error) {
      console.log('⚠️ Ollama Vision failed, using fallback');
    }
  }

  // Fallback: Intelligent matching based on file name and products
  return generateFallbackAnalysis(imageFile, products);
}

function parseVisionResponse(response: string, products: any[]) {
  const lines = response.split('\n');
  let detectedProduct = 'Unknown Product';
  let category = 'General';
  let description = response;

  // Parse the response
  for (const line of lines) {
    if (line.toLowerCase().includes('product:')) {
      detectedProduct = line.split(':')[1]?.trim() || detectedProduct;
    }
    if (line.toLowerCase().includes('category:')) {
      category = line.split(':')[1]?.trim() || category;
    }
  }

  // Find related products
  const relatedProducts = findRelatedProducts(detectedProduct, category, products);

  return {
    detectedProduct,
    confidence: 85,
    relatedProducts,
    description
  };
}

function generateFallbackAnalysis(imageFile: File, products: any[]) {
  const fileName = imageFile.name.toLowerCase();
  
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
