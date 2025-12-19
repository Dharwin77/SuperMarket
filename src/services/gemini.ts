// Groq AI Service (LLaMA-3.1-8B-Instant)
import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export async function initializeGemini() {
  console.log('🔍 Initializing Groq AI (LLaMA-3.1-8B-Instant)...');
  
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Groq API key not found. Using fallback responses.');
    return false;
  }
  
  try {
    groqClient = new Groq({ 
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // For client-side usage
    });
    console.log('✅ Groq AI initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Groq:', error);
    return false;
  }
}

export async function sendMessageToGemini(
  message: string,
  context?: { products?: any[]; conversationHistory?: any[] }
): Promise<string> {
  // Initialize if needed
  if (!groqClient) {
    const initialized = await initializeGemini();
    if (!initialized) {
      return getFallbackResponse(message, context);
    }
  }

  if (groqClient) {
    try {
      console.log('🤖 Sending message to Groq AI...');
      
      // Build context-aware prompt
      let systemPrompt = 'You are a helpful AI shopping assistant for a retail store. Provide concise, friendly responses with bullet points when listing items.';
      let userPrompt = message;
      
      if (context?.products && context.products.length > 0) {
        const productInfo = context.products.slice(0, 20).map(p => 
          `${p.name} (${p.category}) - ₹${p.price}, Stock: ${p.stock}`
        ).join('\n');
        
        userPrompt = `Current inventory (first 20 products):\n${productInfo}\n\nUser question: ${message}\n\nProvide a helpful, concise response.`;
      }

      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false
      });
      
      const responseText = chatCompletion.choices[0]?.message?.content || "I'm here to help!";
      console.log('✅ Received response from Groq');
      return responseText;
      
    } catch (error) {
      console.error('⚠️ Groq request failed:', error);
      return getFallbackResponse(message, context);
    }
  }

  // Fallback to smart responses
  return getFallbackResponse(message, context);
}

// Fallback response generator (when Gemini is unavailable)
function getFallbackResponse(input: string, context?: { products?: any[] }): string {
  const products = context?.products || [];
  return generateFallbackResponse(input, products);
}

function generateFallbackResponse(input: string, products: any[]): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return `Hello! I'm your AI shopping assistant. I can help you with:\n\n• Product recommendations\n• Inventory and stock information\n• Pricing queries\n• Category browsing\n\nWhat would you like to know?`;
  }
  
  if (lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
    if (products.length === 0) {
      return 'I would love to recommend products, but it seems the inventory is currently empty. Please add some products first!';
    }
    const randomProducts = products.slice(0, Math.min(3, products.length));
    return `Based on your query, I'd recommend these popular items:\n\n${randomProducts.map((p, i) => `${i + 1}. ${p.name} - ₹${p.price.toFixed(2)} (${p.category})`).join('\n')}\n\nWould you like more details about any of these?`;
  }
  
  if (lowerInput.includes('stock') || lowerInput.includes('inventory')) {
    if (products.length === 0) {
      return 'The inventory is currently empty. No products are in stock.';
    }
    const lowStock = products.filter(p => p.stock < p.min_stock);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    
    if (lowStock.length > 0) {
      return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ⚠️ Low Stock Alert: ${lowStock.length} items\n\nItems running low:\n${lowStock.map((p, i) => `${i + 1}. ${p.name} - Only ${p.stock} left!`).join('\n')}`;
    }
    return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ✅ All items are well-stocked!`;
  }
  
  return `I understand you're asking about "${input}". I can help you with product recommendations, inventory status, pricing information, and more. What would you like to know?`;
}

export function isGeminiAvailable(): boolean {
  return isOllamaAvailable || !!import.meta.env.VITE_GEMINI_API_KEY;
}
