# Groq AI Integration Guide

## Overview

The SuperMarket application uses **Groq Cloud AI** with **LLaMA-3.1-8B-Instant** for lightning-fast AI inference in production. This replaces the previous Ollama local dependency, making the app fully cloud-ready.

## AI Architecture

### Chat Assistant (Groq LLaMA-3.1-8B-Instant)
- **Service**: `src/services/gemini.ts`
- **Model**: `llama-3.1-8b-instant`
- **Use Cases**:
  - Product recommendations
  - Inventory queries
  - Pricing information
  - Smart shopping assistance
  - Customer support chat

### Product Scanner (Hybrid: Gemini Vision + Groq Analysis)
- **Service**: `src/services/vision.ts`
- **Vision Model**: `gemini-pro-vision` (Google Gemini)
- **Text Analysis**: `llama-3.1-8b-instant` (Groq)
- **Flow**:
  1. Gemini Vision detects product from image/video
  2. Groq LLaMA enhances description with recommendations
  3. Smart product matching with inventory

## Setup Instructions

### 1. Get Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy your key (starts with `gsk_...`)

### 2. Local Development Setup

Add to `.env.local`:

```env
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### 3. Production Deployment (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `VITE_GROQ_API_KEY`
   - **Value**: Your Groq API key
   - **Environments**: Production, Preview, Development
4. Redeploy the application

## Why Groq?

✅ **Ultra-Fast**: Sub-second inference latency  
✅ **Production-Ready**: No local dependencies  
✅ **Cost-Effective**: Generous free tier  
✅ **Serverless Compatible**: Works on Vercel, Netlify, etc.  
✅ **Reliable**: High availability cloud infrastructure  

## API Usage Limits

**Groq Free Tier**:
- 14,400 requests per day
- 30 requests per minute
- Perfect for SMB retail applications

## Migration from Ollama

| Feature | Before (Ollama) | After (Groq) |
|---------|----------------|--------------|
| Chat AI | llama2 (local) | llama-3.1-8b-instant (cloud) |
| Latency | 2-5 seconds | <1 second |
| Deployment | Requires local setup | Cloud-native |
| Availability | Local only | Global |

## Troubleshooting

### Error: "Groq API key not found"
- Check `.env.local` has `VITE_GROQ_API_KEY`
- Restart dev server: `npm run dev`

### Error: "Rate limit exceeded"
- You've exceeded free tier limits
- Implement request throttling or upgrade plan

### Chat not working in production
- Verify environment variable is set in Vercel
- Check browser console for API errors
- Ensure CORS is properly configured

## Testing

```bash
# Local testing
npm run dev

# Open Chat Assistant
# Navigate to: http://localhost:5173/chat

# Test message: "what products do you have?"
# Expected: AI lists inventory items

# Open Product Scanner
# Navigate to: http://localhost:5173/scanner

# Upload product image
# Expected: Vision detection + Groq-enhanced description
```

## Security Notes

⚠️ **Important**: 
- API keys are exposed in browser (client-side usage)
- Consider implementing a backend proxy for production
- Current setup uses `dangerouslyAllowBrowser: true` for rapid deployment
- For enterprise apps, move AI calls to server-side API routes

## Performance Optimization

**Current Configuration**:
- Temperature: 0.7 (balanced creativity)
- Max tokens: 500 (concise responses)
- Streaming: Disabled (simpler implementation)

**For Better UX**:
- Enable streaming for real-time responses
- Implement response caching for common queries
- Add loading skeletons

## Support

- **Groq Docs**: [console.groq.com/docs](https://console.groq.com/docs)
- **Model Info**: LLaMA 3.1 8B Instant
- **Community**: [discord.gg/groq](https://discord.gg/groq)

---

**Status**: ✅ Production Ready  
**Last Updated**: December 18, 2025  
**Version**: 2.0 (Groq Migration)
