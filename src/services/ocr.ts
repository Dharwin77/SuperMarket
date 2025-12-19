// OCR Service using Tesseract.js + Groq LLM for Product Identification
import { createWorker } from 'tesseract.js';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage (not recommended for production)
});

// Worker instance for OCR
let worker: any = null;

/**
 * Initialize OCR worker
 */
export async function initializeOCR() {
  try {
    console.log('🔍 Initializing OCR worker...');
    worker = await createWorker('eng');
    console.log('✅ OCR worker initialized');
    return true;
  } catch (error) {
    console.error('⚠️ Failed to initialize OCR worker:', error);
    return false;
  }
}

/**
 * Extract text from image using Tesseract.js
 * @param imageFile - The image file to process
 * @returns Promise<string> - Extracted text
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  if (!worker) {
    await initializeOCR();
  }

  try {
    console.log('🔍 Extracting text from image...');
    
    // Preprocess image for better OCR accuracy
    const processedImage = await preprocessImage(imageFile);
    
    const result = await worker.recognize(processedImage);
    const text = result.data.text.trim();
    
    console.log('✅ OCR extraction complete');
    console.log('📝 Extracted text:', text);
    console.log('📊 OCR confidence:', result.data.confidence);
    
    // Log word count and character count for debugging
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    console.log(`📈 Text statistics: ${wordCount} words, ${charCount} characters`);
    
    return text;
  } catch (error) {
    console.error('⚠️ OCR extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Preprocess image for better OCR accuracy
 * @param imageFile - The image file to preprocess
 * @returns Promise<string> - Processed image as data URL
 */
async function preprocessImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      try {
        // Set canvas dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;
        
        // Scale down if needed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, width, height);
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Apply preprocessing specifically for product packaging
          // Increase contrast and brightness significantly
          ctx.filter = 'contrast(2.0) brightness(1.3) saturate(1.2)';
          ctx.drawImage(img, 0, 0, width, height);
          ctx.filter = 'none';
          
          // Apply a more sophisticated filter to enhance text
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Enhanced preprocessing for product packaging:
          // 1. Increase contrast further
          // 2. Apply adaptive thresholding simulation
          // 3. Enhance red channel which is often prominent in packaging
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate enhanced luminance with emphasis on red (common in packaging)
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply stronger threshold with hysteresis-like effect
            let newValue;
            if (luminance > 180) {
              newValue = 255; // Strong white
            } else if (luminance > 120) {
              newValue = 200; // Medium gray
              // Boost red channel for packaging text
              data[i] = Math.min(255, data[i] * 1.2);
            } else {
              newValue = 0;   // Strong black
            }
            
            data[i] = newValue;     // Red
            data[i + 1] = newValue; // Green
            data[i + 2] = newValue; // Blue
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Identify product from OCR text using Groq LLM
 * @param ocrText - Text extracted from OCR
 * @returns Promise<object> - Identified product information
 */
export async function identifyProductWithGroq(ocrText: string): Promise<any> {
  const cleanText = ocrText.trim();
  if (!cleanText || cleanText.length === 0) {
    throw new Error('No text provided for product identification');
  }

  // Enhanced quality check for OCR text
  const alphanumericCount = (cleanText.match(/[a-zA-Z0-9]/g) || []).length;
  const totalCount = cleanText.length;
  const ratio = totalCount > 0 ? alphanumericCount / totalCount : 0;
  
  // More lenient checks but still filter out obviously bad text
  const wordCount = cleanText.split(/\s+/).filter(word => word.length > 1).length;
  
  console.log(`🔍 OCR text quality analysis:`);
  console.log(`   Total characters: ${totalCount}`);
  console.log(`   Alphanumeric characters: ${alphanumericCount}`);
  console.log(`   Alphanumeric ratio: ${(ratio * 100).toFixed(1)}%`);
  console.log(`   Word count: ${wordCount}`);
  
  // Allow shorter text if it contains recognizable brand names
  const knownBrands = ['KITKAT', 'COCA', 'COLA', 'PEPSI', 'LAY', 'SNICKERS', 'TWIX', 'MARS', 'HERSHEYS', 'NESCAFE'];
  const hasKnownBrand = knownBrands.some(brand => cleanText.toUpperCase().includes(brand));
  
  // Still reject if text is extremely poor quality
  if (cleanText.length < 3 || (ratio < 0.05 && !hasKnownBrand)) {
    console.log('⚠️ OCR text quality is too poor for reliable identification');
    return {
      productName: "Unknown Product",
      brand: "Unknown",
      category: "General",
      confidence: 0
    };
  }

  try {
    console.log('🤖 Sending OCR text to Groq for product identification...');
    
    const prompt = `
You are an expert retail product classifier that specializes in identifying consumer goods from OCR text extracted from product packaging.

Instructions:
1. Analyze the OCR text which may contain brand names, product names, flavors, sizes, and other packaging information
2. Extract the most relevant product information
3. Be aware that OCR text may contain errors, artifacts, or incomplete words
4. Focus on identifying the core product, brand, and category
5. If you see common brand names like "KitKat", "Coca-Cola", "Lays", etc., prioritize those in your response

OCR Text:
"""
${ocrText}
"""

Respond in JSON format with this exact structure:
{
  "productName": "Full product name including flavor/variant if visible",
  "brand": "Brand name",
  "category": "Product category (e.g., Chocolate, Snacks, Beverages, etc.)",
  "confidence": 0-100
}

Special cases:
- If the text is clearly from a known brand, use the official brand name
- If you see "KITKAT" or variations, the brand is "KitKat"
- If you see "COCA COLA" or variations, the brand is "Coca-Cola"
- If the text is too unclear to identify a product, return:
{
  "productName": "Unknown Product",
  "brand": "Unknown",
  "category": "General",
  "confidence": 0
}

Examples:
- For OCR containing "KITKAT" and "CHOCOLATE", return:
{
  "productName": "KitKat Chocolate Bar",
  "brand": "KitKat",
  "category": "Chocolate",
  "confidence": 95
}

- For OCR containing "LAY S" and "CLASSIC", return:
{
  "productName": "Lay's Classic Potato Chips",
  "brand": "Lay's",
  "category": "Snacks",
  "confidence": 90
}

Provide your best interpretation based on the OCR text.
`;
    // Try multiple models in order of preference, starting with the working Llama 3.1 8B Instant
    const models = [
      "llama-3.1-8b-instant",                  // Llama 3.1 8B Instant (confirmed working)
      "llama3-groq-70b-8192-tool-use-preview",  // Llama 3 Groq 70B
      "llama3-groq-8b-8192-tool-use-preview",   // Llama 3 Groq 8B
      "llama3-70b-8192",                       // Llama 3 70B
      "llama3-8b-8192",                        // Llama 3 8B
      "mixtral-8x7b-32768",                    // Mixtral 8x7B
      "gemma-7b-it"                            // Gemma 7B
    ];
    
    let completion;
    let lastError: any = null;
    
    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`);
        completion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: model,
          temperature: 0.7,
          max_tokens: 200,
          response_format: { type: "json_object" },
        });
        console.log(`✅ Successfully used model: ${model}`);
        break; // Success, exit the loop
      } catch (apiError: any) {
        console.error(`⚠️ Model ${model} failed:`, apiError.message);
        lastError = apiError;
        
        // If it's not a model decommissioned error, rethrow immediately
        if (!apiError.message || !apiError.message.includes('decommissioned')) {
          throw apiError;
        }
        
        // Continue to try the next model
        continue;
      }
    }
    
    // If all models failed
    if (!completion) {
      console.error('⚠️ All Groq models failed');
      throw new Error('All Groq models are currently unavailable: ' + (lastError?.message || 'Unknown error'));
    }

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON, with fallback for malformed responses
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      console.error('⚠️ Failed to parse Groq response as JSON:', response);
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[^]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error('⚠️ Failed to extract JSON from response');
          throw new Error('Invalid response format from Groq');
        }
      } else {
        throw new Error('No valid JSON found in Groq response');
      }
    }
    
    console.log('✅ Groq product identification complete');
    console.log('📦 Identified product:', result);
    
    return result;
  } catch (error) {
    console.error('⚠️ Groq product identification failed:', error);
    throw new Error('Failed to identify product with Groq');
  }
}

/**
 * Process image through OCR and Groq identification
 * @param imageFile - The image file to process
 * @returns Promise<object> - Combined OCR and product identification results
 */
export async function processImageWithOCR(imageFile: File): Promise<any> {
  try {
    // Step 1: Extract text with OCR
    const ocrText = await extractTextFromImage(imageFile);
    
    // Step 2: Identify product with Groq
    const productInfo = await identifyProductWithGroq(ocrText);
    
    return {
      ocrText,
      productInfo,
      success: true
    };
  } catch (error) {
    console.error('⚠️ Image processing failed:', error);
    return {
      ocrText: '',
      productInfo: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default {
  initializeOCR,
  extractTextFromImage,
  identifyProductWithGroq,
  processImageWithOCR
};