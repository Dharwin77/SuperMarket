# WhatsApp Bill Link Configuration

## Important: Public URL Setup

The SuperMarket system generates shareable bill links that are sent via WhatsApp. These links **MUST** be publicly accessible URLs, not localhost.

### 🔴 Critical Requirement

❌ **NEVER** use `http://localhost:8081/bill/INV123456` in WhatsApp messages  
✅ **ALWAYS** use public URLs like `https://smartretail.app/bill/INV123456`

WhatsApp will only make HTTPS links clickable!

---

## Setup Instructions

### Option 1: Production Deployment (Recommended)

1. Deploy your app to a hosting service (Vercel, Netlify, etc.)
2. Get your production domain (e.g., `https://smartretail.app`)
3. Set the environment variable:

```env
VITE_PUBLIC_URL=https://smartretail.app
```

### Option 2: Development with ngrok (For Testing)

1. Install ngrok: https://ngrok.com/download
2. Start your development server: `npm run dev`
3. In another terminal, run: `ngrok http 8081`
4. Copy the HTTPS URL (e.g., `https://abcd1234.ngrok.io`)
5. Create a `.env.local` file and add:

```env
VITE_PUBLIC_URL=https://abcd1234.ngrok.io
```

6. Restart your dev server

### Option 3: Edit Code Directly (Quick Test)

Edit `frontend/src/lib/publicUrl.ts` and replace the return value:

```typescript
export function getPublicUrl(): string {
  // Replace with your actual URL
  return 'https://your-ngrok-url.ngrok.io';
}
```

---

## How It Works

1. **Bill Generation**: When a bill is created, the system:
   - Saves bill data locally
   - Generates a shareable link using the public URL
   - Includes the link in WhatsApp message

2. **WhatsApp Message Format**:
```
🛒 SUPERMARKET INVOICE

📄 Invoice: INV123456
👤 Customer: John Doe
💰 Total: ₹180.00

View Full Bill:
https://smartretail.app/bill/INV123456

Thank you for shopping with us! 🙏
```

3. **Bill View**: When customer clicks the link:
   - Opens in their browser
   - Shows full bill details
   - No login required
   - Read-only view

---

## Testing the Feature

1. Set your public URL (ngrok or production)
2. Go to Billing section
3. Add items to cart
4. Fill customer details
5. Check "Send via WhatsApp"
6. Click "Generate Bill"
7. WhatsApp opens with message containing clickable link
8. Test the link on another device/WhatsApp

---

## Troubleshooting

### Link not clickable in WhatsApp
- Ensure URL starts with `https://`
- Check that URL is on its own line
- Verify no extra characters around the link

### Link shows "Bill not found"
- Check that bill data was saved (localStorage)
- Verify invoice number matches

### Still seeing localhost in links
- Clear browser cache
- Restart dev server after setting VITE_PUBLIC_URL
- Check console for warnings about public URL

---

## Security Notes

- Bill links are publicly accessible (no authentication required)
- Bills are view-only (no edit or delete buttons)
- Bill data stored in browser localStorage
- Consider implementing server-side storage for production
