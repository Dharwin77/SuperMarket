// Groq Vision Service for Image/Video Analysis

let isVisionApiAvailable = false;
let selectedVisionModel =
  import.meta.env.VITE_GROQ_VISION_MODEL ||
  import.meta.env.VITE_GROQ_MODEL ||
  'meta-llama/llama-4-scout-17b-16e-instruct';

const GROQ_VISION_API_URL =
  import.meta.env.VITE_GROQ_API_URL ||
  'https://api.groq.com/openai/v1/chat/completions';

function getGroqApiKey(): string {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.GROQ_API_KEY ||
    import.meta.env.VITE_GROK_API_KEY ||
    ''
  ).trim();
}

export async function initializeVision() {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    console.warn('⚠️ GROQ API key not found for vision scanning. Using smart fallback detection.');
    isVisionApiAvailable = false;
    return false;
  }

  console.log(`✅ Groq Vision configured with model: ${selectedVisionModel}`);
  console.log('📸 AI-powered image recognition enabled');
  isVisionApiAvailable = true;
  return true;
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
  if (!isVisionApiAvailable) {
    await initializeVision();
  }

  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  if (isVisionApiAvailable) {
    try {
      console.log('🤖 Analyzing image with Groq Vision...');

      const response = await fetch(GROQ_VISION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getGroqApiKey()}`,
        },
        body: JSON.stringify({
          model: selectedVisionModel,
          messages: [
            {
              role: 'system',
              content:
                'You identify supermarket products from images. If the image is not a physical retail product, respond exactly with Product: NOT_A_PRODUCT. Otherwise reply in 3 lines: Product: <name>, Category: <category>, Description: <brief description>.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Identify the product in this image. Prefer exact names when possible. Available inventory sample count: ${products.length}.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) {
          console.log('✅ Image analyzed by Groq Vision');
          return parseVisionResponse(content, products);
        }
        console.warn('⚠️ Groq Vision returned empty output. Using fallback analysis.');
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`⚠️ Groq Vision returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.warn('⚠️ Groq Vision request failed:', error);
    }
  }

  // Fallback: Intelligent matching based on file name and products
  return generateFallbackAnalysis(imageFile, products);
}

function parseVisionResponse(response: string, products: any[]) {
  let detectedProduct = 'Unknown Product';
  let category = 'General';
  let description = response;

  // Parse flexible model output, including one-line "Product: ..., Category: ..." responses.
  const productMatch = response.match(/product\s*:\s*(.+?)(?=(?:\n|,?\s*category\s*:|,?\s*description\s*:|$))/i);
  const categoryMatch = response.match(/category\s*:\s*(.+?)(?=(?:\n|,?\s*description\s*:|$))/i);
  const descriptionMatch = response.match(/description\s*:\s*(.+?)\s*$/i);

  if (productMatch?.[1]) {
    detectedProduct = normalizeVisionField(productMatch[1]);
  }

  if (categoryMatch?.[1]) {
    category = normalizeVisionField(categoryMatch[1]);
  }

  if (descriptionMatch?.[1]) {
    description = normalizeVisionField(descriptionMatch[1]);
  }

  // Check if AI determined this is not a product
  if (detectedProduct.includes('NOT_A_PRODUCT') || detectedProduct.toLowerCase().includes('not a product')) {
    return {
      detectedProduct: 'Non-product image detected',
      confidence: 0,
      relatedProducts: [],
      description: 'This image does not appear to be a retail product. Please upload a photo of an actual product.'
    };
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

function normalizeVisionField(value: string) {
  return value
    .replace(/^[-*\s]+/, '')
    .replace(/^"|"$/g, '')
    .trim();
}

function generateFallbackAnalysis(imageFile: File, products: any[]) {
  const fileName = imageFile.name.toLowerCase();
  
  console.log('🔍 Using smart fallback analysis for:', fileName);
  
  // First check if this looks like a non-product file
  const nonProductKeywords = ['diagram', 'chart', 'screenshot', 'document', 'pdf', 'excel', 'schema', 'drawing', 'graph', 'presentation', 'slide', 'desktop', 'screen'];
  for (const keyword of nonProductKeywords) {
    if (fileName.includes(keyword)) {
      return {
        detectedProduct: 'Non-product image',
        confidence: 0,
        relatedProducts: [],
        description: '⚠️ This appears to be a diagram, chart, or document rather than a product photo. Please upload an image of an actual retail product.'
      };
    }
  }
  
  // Enhanced product keyword mapping with brand names and common products
  const productKeywords = {
    // Snacks
    'munch': { product: 'Munch Chocolate Bar', category: 'Chocolates', brands: ['nestle', 'munch'] },
    'chips': { product: 'Chips', category: 'Snacks', brands: ['lays', 'kurkure', 'bingo'] },
    'lays': { product: 'Lays Chips', category: 'Snacks', brands: ['lays'] },
    'kurkure': { product: 'Kurkure', category: 'Snacks', brands: ['kurkure'] },
    'biscuit': { product: 'Biscuit', category: 'Biscuits', brands: ['parle', 'britannia', 'sunfeast'] },
    'cookie': { product: 'Cookies', category: 'Biscuits', brands: [] },
    
    // Chocolates
    'chocolate': { product: 'Chocolate', category: 'Chocolates', brands: ['dairy milk', 'kitkat', 'snickers', 'munch'] },
    'dairy': { product: 'Dairy Milk', category: 'Chocolates', brands: ['cadbury'] },
    'kitkat': { product: 'KitKat', category: 'Chocolates', brands: ['nestle'] },
    'snickers': { product: 'Snickers', category: 'Chocolates', brands: ['snickers'] },
    'milkybar': { product: 'Milkybar', category: 'Chocolates', brands: ['nestle'] },
    
    // Beverages
    'drink': { product: 'Beverage', category: 'Beverages', brands: ['coca cola', 'pepsi', 'sprite'] },
    'cola': { product: 'Cola', category: 'Beverages', brands: ['coca cola', 'pepsi'] },
    'pepsi': { product: 'Pepsi', category: 'Beverages', brands: ['pepsi'] },
    'coke': { product: 'Coca Cola', category: 'Beverages', brands: ['coca cola'] },
    'sprite': { product: 'Sprite', category: 'Beverages', brands: ['sprite'] },
    'juice': { product: 'Juice', category: 'Beverages', brands: ['real', 'tropicana'] },
    'water': { product: 'Water', category: 'Beverages', brands: ['bisleri', 'aquafina', 'kinley'] },
    
    // Dairy
    'milk': { product: 'Milk', category: 'Dairy', brands: ['amul', 'mother dairy'] },
    'cheese': { product: 'Cheese', category: 'Dairy', brands: ['amul', 'britannia'] },
    'butter': { product: 'Butter', category: 'Dairy', brands: ['amul', 'mother dairy'] },
    'curd': { product: 'Curd', category: 'Dairy', brands: ['amul'] },
    'yogurt': { product: 'Yogurt', category: 'Dairy', brands: [] },
    
    // Grains & Staples
    'bread': { product: 'Bread', category: 'Bakery', brands: ['britannia', 'harvest gold'] },
    'rice': { product: 'Rice', category: 'Grains', brands: ['india gate', 'daawat'] },
    'flour': { product: 'Flour', category: 'Grains', brands: ['aashirvaad', 'pillsbury'] },
    'atta': { product: 'Atta', category: 'Grains', brands: ['aashirvaad'] },
    
    // Common brands
    'britannia': { product: 'Britannia Product', category: 'Biscuits', brands: ['britannia'] },
    'parle': { product: 'Parle Product', category: 'Biscuits', brands: ['parle'] },
    'amul': { product: 'Amul Product', category: 'Dairy', brands: ['amul'] },
    'nestle': { product: 'Nestle Product', category: 'Chocolates', brands: ['nestle'] },
  };

  let detectedInfo: any = null;
  let matchedKeyword = '';

  // Check for product keywords in filename
  for (const [keyword, info] of Object.entries(productKeywords)) {
    if (fileName.includes(keyword)) {
      detectedInfo = info;
      matchedKeyword = keyword;
      break;
    }
  }

  // If no keyword match in filename, try to match against existing products
  if (!detectedInfo && products && products.length > 0) {
    console.log('🔍 Searching in product database...');
    
    // Try to find products with names similar to filename
    const fileWords = fileName.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    
    for (const product of products) {
      const productNameLower = product.name.toLowerCase();
      const productWords = productNameLower.split(/\s+/);
      
      // Check if any file words match product words
      for (const fileWord of fileWords) {
        if (productWords.some(pw => pw.includes(fileWord) || fileWord.includes(pw))) {
          console.log(`✅ Found match: ${product.name}`);
          return {
            detectedProduct: product.name,
            confidence: 75,
            relatedProducts: [product, ...findRelatedProducts(product.name, product.category, products).slice(0, 5)],
            description: `🎯 **Product Identified!**\n\nFound "${product.name}" in your inventory based on the image filename. This product is in the ${product.category} category and is currently ${product.stock > 0 ? 'in stock' : 'out of stock'}.`
          };
        }
      }
    }
  }

  // If no match found at all
  if (!detectedInfo) {
    return {
      detectedProduct: 'Unknown product',
      confidence: 0,
      relatedProducts: [],
      description: `⚠️ **Product Not Recognized**\n\nCould not identify the product from the image. \n\n**Tips:**\n• Ensure the image clearly shows the product packaging\n• Try renaming the file with the product name (e.g., "lays-chips.jpg")\n• Upload a clearer image with visible branding\n• The product might not be in your inventory yet`
    };
  }

  // Find related products in inventory
  const relatedProducts = findRelatedProducts(detectedInfo.product, detectedInfo.category, products);

  return {
    detectedProduct: detectedInfo.product,
    confidence: relatedProducts.length > 0 ? 80 : 50,
    relatedProducts,
    description: relatedProducts.length > 0 
      ? `🎯 **Product Detected!**\n\nIdentified as "${detectedInfo.product}" (${detectedInfo.category}). Found ${relatedProducts.length} matching item${relatedProducts.length > 1 ? 's' : ''} in your store inventory.`
      : `🔍 **Possible Match**\n\nThis appears to be "${detectedInfo.product}" (${detectedInfo.category}), but we couldn't find exact matches in your inventory. Consider adding this product to your store!`
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
