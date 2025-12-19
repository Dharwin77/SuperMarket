# OCR + Groq AI Product Identification Integration

## Overview

This document explains how to use the OCR (Optical Character Recognition) + Groq AI product identification feature in the SuperMarket application. This approach uses Tesseract.js to extract text from product images and Groq's Llama 3.1 8B Instant model to identify products based on the extracted text.

## Architecture

```
📸 Camera / Image Upload
        ↓
🔍 Tesseract.js (OCR – Free)
        ↓
🧠 Groq Llama 3.1 8B Instant
        ↓
📦 Identified Product Name / Object
        ↓
💾 Store / Continue Flow
```

## Implementation Details

### Services

1. **OCR Service** (`src/services/ocr.ts`):
   - Uses Tesseract.js for text extraction
   - Implements image preprocessing for better OCR accuracy
   - Integrates with Groq AI for product identification
   - Provides fallback mechanisms

2. **Scanner Page** (`src/pages/Scanner.tsx`):
   - Uses OCR and Groq AI approach exclusively
   - Shows OCR results in the UI
   - No fallback to other APIs

### Workflow

1. User uploads an image of a product
2. System processes the image using OCR + Groq AI
3. If successful, displays OCR results and identified product
4. Results are displayed in the UI with confidence scores

## Setup Instructions

### 1. Install Dependencies

The required dependencies should already be installed:

```bash
npm install tesseract.js groq-sdk
```

### 2. Configure Environment Variables

Add your Groq API key to `.env.local`:

```env
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
```

You can get a Groq API key from [console.groq.com](https://console.groq.com).

## Usage

### In the Application

1. Navigate to the Scanner page (`/scanner`)
2. Click "Upload Image/Video"
3. Select an image of a product with visible text
4. The system will automatically process the image using OCR + Groq AI
5. Results will be displayed in the UI:
   - Extracted OCR text
   - Identified product information (name, brand, category)
   - Confidence score

### In Code

To use the OCR service directly:

```typescript
import { processImageWithOCR } from '@/services/ocr';

// Process an image file
const result = await processImageWithOCR(imageFile);

if (result.success) {
  console.log('OCR Text:', result.ocrText);
  console.log('Product Info:', result.productInfo);
} else {
  console.error('OCR Processing failed:', result.error);
}
```

## Benefits

✅ **Free OCR** - Tesseract.js is completely free and open-source
✅ **Accurate Text Extraction** - Works well with clear product labels
✅ **Smart Product Identification** - Groq Llama 3.1 model understands context
✅ **No Cloud Vision APIs** - Doesn't require paid cloud services
✅ **Deployable** - Works in all environments

## Limitations

❌ **Plain Objects** - Won't work well on products without text labels
❌ **Blurry Images** - Quality affects OCR accuracy
❌ **Poor Lighting** - Low light conditions reduce accuracy

## Best Practices

### OCR Tips

1. Use images with clear, readable text
2. Ensure good lighting conditions
3. Avoid blurry or out-of-focus images
4. Crop images to focus on product labels when possible

### Groq Prompt Tips

1. Request structured output (JSON)
2. Ask the model to ignore noise in OCR text
3. Request normalized brand names

## Example OCR Prompt

The system uses this prompt template for Groq:

```
You are a retail product classifier.

Given the OCR text extracted from a product package, identify:
1. Product name
2. Brand
3. Product type/category

OCR Text:
"""
{extracted_ocr_text}
"""

Return the result in JSON format with the following structure:
{
  "productName": "Product name here",
  "brand": "Brand name here",
  "category": "Product category here",
  "confidence": 0-100
}

If the OCR text is unclear or doesn't contain product information, return:
{
  "productName": "Unknown Product",
  "brand": "Unknown",
  "category": "General",
  "confidence": 0
}
```

## Fallback Logic

If OCR text extraction fails or produces no useful results:

1. System displays "Product Not Identified" message
2. User can try rescanning with better lighting

## Troubleshooting

### OCR Not Initializing

- Check browser console for errors
- Ensure Tesseract.js is properly installed
- Verify browser compatibility

### Groq API Errors

- Check that `VITE_GROQ_API_KEY` is set in `.env.local`
- Verify API key is valid and has not expired
- Check rate limits (14,400 requests per day free tier)

### Poor OCR Results

- Improve image quality (better lighting, focus)
- Try different angles
- Ensure text is clearly visible and not distorted

## Future Improvements

1. Add image preprocessing for better OCR accuracy
2. Implement confidence scoring for better result filtering
3. Add support for multiple languages
4. Improve matching logic with more sophisticated algorithms
5. Add offline OCR support for environments without internet

## Support

For issues with the OCR integration:
- Check browser console for error messages
- Verify all dependencies are installed
- Ensure environment variables are correctly configured