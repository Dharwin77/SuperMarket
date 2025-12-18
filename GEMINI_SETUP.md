# Google Gemini AI Chat Setup

## Quick Setup (3 steps)

### 1. Get Your Free API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add API Key to Your Project
1. Create a new file: `frontend/.env.local`
2. Add this line (replace with your actual key):
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

### 3. Restart Your Dev Server
```bash
cd frontend
npm run dev
```

## That's it! 🎉

Your AI Chat is now powered by Google Gemini AI!

## Features
✅ Real-time AI responses  
✅ Product-aware conversations  
✅ Inventory insights  
✅ Smart recommendations  
✅ Free tier with generous limits  
✅ Automatic fallback if API is unavailable  

## Troubleshooting

**Problem: "Using fallback mode" shows in chat**
- Solution: Check if `.env.local` file exists and contains the API key
- Make sure to restart the dev server after adding the key

**Problem: "Invalid API key" error**
- Solution: Verify the API key is correct and active in Google AI Studio

**Problem: "Rate limit reached"**
- Solution: Free tier has limits. Wait a few minutes and try again

## API Limits (Free Tier)
- 60 requests per minute
- More than enough for typical usage
- No credit card required

## Security Note
- Never commit `.env.local` to git
- The `.gitignore` already excludes it
- API key stays on your machine only
