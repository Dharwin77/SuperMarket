import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Sparkles, ArrowLeft } from "lucide-react";
import { useProducts } from "@/hooks/useSupabase";
import { sendMessageToGemini, initializeGemini } from "@/services/gemini";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI shopping assistant powered by Ollama. I can help you with:\n\n• Product recommendations\n• Inventory and stock information\n• Pricing queries\n• Category browsing\n• Purchase suggestions\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ollamaReady, setOllamaReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeGemini().then(setOllamaReady);
  }, []);

  // Scroll to bottom when new chat message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // AI Chat function
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const question = chatInput;
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await sendMessageToGemini(question, {
        products: products || [],
        conversationHistory: chatMessages
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple AI response generator
  const generateAIResponse = (input: string, products: any[]) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return `Hello! I'm here to help you with anything related to products, inventory, or shopping. What would you like to know?`;
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
        return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ⚠️ Low Stock Alert: ${lowStock.length} items\n\nItems running low:\n${lowStock.map((p, i) => `${i + 1}. ${p.name} - Only ${p.stock} left!`).join('\n')}\n\nWould you like to place an order for these items?`;
      }
      return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ✅ All items are well-stocked!\n\nEverything looks great!`;
    }
    
    if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('expensive') || lowerInput.includes('cheap')) {
      if (products.length === 0) {
        return 'I cannot provide pricing information as there are no products in the inventory yet.';
      }
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      const maxPrice = Math.max(...products.map(p => p.price));
      const minPrice = Math.min(...products.map(p => p.price));
      const mostExpensive = products.find(p => p.price === maxPrice);
      const cheapest = products.find(p => p.price === minPrice);
      
      return `💰 Pricing Overview:\n\n• Average Price: ₹${avgPrice.toFixed(2)}\n• Price Range: ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}\n• Most Expensive: ${mostExpensive?.name} (₹${maxPrice.toFixed(2)})\n• Budget-Friendly: ${cheapest?.name} (₹${minPrice.toFixed(2)})\n\nI can help you find products within your budget!`;
    }
    
    if (lowerInput.includes('category') || lowerInput.includes('type') || lowerInput.includes('categories')) {
      if (products.length === 0) {
        return 'No product categories available yet. Please add some products first!';
      }
      const categories = [...new Set(products.map(p => p.category))];
      const categoryCounts = categories.map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
      }));
      
      return `📦 Product Categories:\n\n${categoryCounts.map((cat, i) => `${i + 1}. ${cat.name} (${cat.count} items)`).join('\n')}\n\nWhich category interests you?`;
    }
    
    if (lowerInput.includes('popular') || lowerInput.includes('best') || lowerInput.includes('top')) {
      if (products.length === 0) {
        return 'No products available to show popular items yet.';
      }
      const topProducts = products
        .sort((a, b) => b.stock - a.stock)
        .slice(0, Math.min(5, products.length));
      
      return `⭐ Top Products:\n\n${topProducts.map((p, i) => `${i + 1}. ${p.name}\n   ₹${p.price.toFixed(2)} | Stock: ${p.stock} units`).join('\n\n')}\n\nThese are our most stocked items!`;
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return `I can help you with:\n\n🔍 Product Search & Recommendations\n📊 Inventory & Stock Information\n💰 Pricing & Budget Queries\n📦 Category Browsing\n📈 Purchase Analytics\n🎯 Smart Suggestions\n\nJust ask me anything!`;
    }
    
    return `I understand you're asking about "${input}". I can help you with:\n\n• Product recommendations\n• Inventory status\n• Pricing information\n• Category searches\n• Stock alerts\n\nCould you be more specific about what you'd like to know?`;
  };

  return (
    <div className="min-h-screen glass-panel flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              AI Chat Assistant
              {ollamaReady && <Sparkles className="h-5 w-5 text-yellow-400" />}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ollamaReady ? 'Powered by Ollama' : 'Using smart fallback mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'bg-[#1A1F2E] border border-purple-500/30'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
              <p className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="bg-[#1A1F2E] border border-purple-500/30 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-6">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            type="text"
            placeholder="Ask me anything about your products..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-[#1A1F2E] border-purple-500/30 focus:border-purple-500 h-12"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
