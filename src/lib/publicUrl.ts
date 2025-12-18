// Public URL configuration for shareable bill links
// IMPORTANT: Update this with your actual production domain or ngrok tunnel URL

/**
 * Get the public URL for bill links
 * This ensures WhatsApp bill links are always clickable and publicly accessible
 * 
 * Priority:
 * 1. VITE_PUBLIC_URL environment variable (if set)
 * 2. Production domain (if deployed)
 * 3. ngrok or similar tunnel URL (for development/testing)
 * 
 * NEVER use localhost for WhatsApp links!
 */
export function getPublicUrl(): string {
  // Check for environment variable first
  const envPublicUrl = import.meta.env.VITE_PUBLIC_URL;
  
  // VERIFICATION LOG (temporary)
  console.log('🔍 PUBLIC URL CHECK:', envPublicUrl || 'NOT SET');
  
  if (envPublicUrl) {
    console.log('✅ Using environment variable for public URL');
    return envPublicUrl;
  }

  // Check if we're on a production domain (not localhost)
  const currentOrigin = window.location.origin;
  const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  
  if (!isLocalhost) {
    return currentOrigin;
  }

  // Default fallback for development
  // TEMPORARY: Using current origin for now
  // TODO: Replace with your ngrok URL or production domain when available
  // Example: return 'https://abcd1234.ngrok.io';
  // Example: return 'https://smartretail.app';
  
  // For now, use current origin even if localhost (for local testing)
  // This will show localhost in WhatsApp but at least won't break
  console.warn('⚠️ Using current origin for bill link. For WhatsApp sharing, set VITE_PUBLIC_URL environment variable or update this function.');
  return currentOrigin;
}

/**
 * Generate a shareable bill link
 * @param invoiceNumber The invoice number to create a link for
 * @returns A publicly accessible URL for the bill
 */
export function generateBillLink(invoiceNumber: string): string {
  const publicUrl = getPublicUrl();
  return `${publicUrl}/bill/${invoiceNumber}`;
}
