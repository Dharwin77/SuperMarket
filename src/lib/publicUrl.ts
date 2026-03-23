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
  const currentOrigin = window.location.origin;
  const isCurrentLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

  // Check for environment variable first
  const envPublicUrl = import.meta.env.VITE_PUBLIC_URL;
  
  // VERIFICATION LOG (temporary)
  console.log('🔍 PUBLIC URL CHECK:', envPublicUrl || 'NOT SET');
  
  if (envPublicUrl) {
    const normalizedEnvUrl = envPublicUrl.replace(/\/$/, '');
    const isEnvLocalOrTunnel =
      normalizedEnvUrl.includes('localhost') ||
      normalizedEnvUrl.includes('127.0.0.1') ||
      normalizedEnvUrl.includes('ngrok');

    // On a deployed site, prefer the deployed host over stale local/ngrok env values.
    if (!isCurrentLocalhost && isEnvLocalOrTunnel) {
      console.warn('⚠️ VITE_PUBLIC_URL points to local/ngrok URL in production. Using deployed origin instead.');
      return currentOrigin;
    }

    console.log('✅ Using environment variable for public URL');
    return normalizedEnvUrl;
  }

  // Check if we're on a production domain (not localhost)
  const isLocalhost = isCurrentLocalhost;
  
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
