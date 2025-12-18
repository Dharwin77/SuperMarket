// Ollama AI Service (Runs Locally - No API Keys Needed!)

let isOllamaAvailable = false;

export async function initializeGemini() {
  console.log('🔍 Checking for Ollama...');
  
  try {
    // Check if Ollama is running
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama is running! Available models:', data.models?.length || 0);
      isOllamaAvailable = true;
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Ollama not detected. Using smart fallback responses.');
    console.log('💡 To enable AI: Download Ollama from https://ollama.ai');
  }
  
  return false;
}

export async function sendMessageToGemini(
  message: string,
  context?: { products?: any[]; conversationHistory?: any[] }
): Promise<string> {
  // Try Ollama first
  if (!isOllamaAvailable) {
    await initializeGemini();
  }

  if (isOllamaAvailable) {
    try {
      console.log('🤖 Sending message to Ollama AI...');
      
      // Build context-aware prompt
      let prompt = '';
      
      if (context?.products && context.products.length > 0) {
        const productInfo = context.products.slice(0, 20).map(p => 
          `${p.name} (${p.category}) - ₹${p.price}, Stock: ${p.stock}, Min Stock: ${p.min_stock}`
        ).join('\n');
        
        prompt = `You are a helpful AI shopping assistant for a retail store. Here's the current inventory (first 20 products):

${productInfo}

User: ${message}

Provide helpful, friendly, and concise responses. Use bullet points when listing items.`;
      } else {
        prompt = `You are a helpful AI shopping assistant. The inventory is currently empty.

User: ${message}

Provide a helpful response.`;
      }

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Received response from Ollama');
        return data.response || "I'm here to help!";
      }
    } catch (error) {
      console.log('⚠️ Ollama request failed, using fallback');
      isOllamaAvailable = false;
    }
  }

  // Fallback to smart responses
  console.log('💬 Using smart fallback responses');
  return generateFallbackResponse(message, context?.products || []);
}

// Fallback response generator (when Gemini is unavailable)
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
