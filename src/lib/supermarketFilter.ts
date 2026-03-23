function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function isCloseTypoMatch(queryToken: string, candidateToken: string): boolean {
  if (!queryToken || !candidateToken) return false;
  if (queryToken === candidateToken) return true;
  if (Math.abs(queryToken.length - candidateToken.length) > 2) return false;

  const maxDistance = queryToken.length >= 8 ? 2 : 1;
  return levenshteinDistance(queryToken, candidateToken) <= maxDistance;
}

// Heuristic filter to determine if a user query is related to the Supermarkt site
export function isRelatedToSupermarket(input: string, products: any[] = []): boolean {
  if (!input || !input.trim()) return false;

  const text = input.toLowerCase();
  const normalizedTokens = text
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3);

  // Detect clearly off-topic patterns first.
  const offTopicHints = [
    'weather', 'news', 'sports', 'movie', 'politics', 'programming', 'code',
    'how to cook', 'restaurant', 'travel', 'flight', 'bank', 'recipe', 'medical',
    'health', 'legal'
  ];
  for (const h of offTopicHints) {
    if (text.includes(h)) return false;
  }

  // Strong indicators the question is about the store/site
  const siteKeywords = [
    'supermarkt', 'supermarket', 'store', 'shop', 'product', 'products', 'inventory', 'stock',
    'price', 'pricing', 'cost', 'bill', 'invoice', 'purchase', 'order', 'category', 'barcode',
    'sku', 'expiry', 'expiry date', 'discount', 'loyalty', 'checkout', 'cashier', 'available',
    'availability', 'how many', 'count', 'units', 'quantity', 'calculate', 'multiply', 'value'
  ];

  for (const k of siteKeywords) {
    if (text.includes(k)) return true;
  }

  // If the query mentions any product names from context, treat as related
  if (products && products.length > 0) {
    const names = products.slice(0, 80).map((p: any) => (p.name || '').toString().toLowerCase());
    for (const name of names) {
      if (!name) continue;
      if (text.includes(name)) return true;

      // Tolerate misspellings like "choaclate" -> "chocolate".
      const productTokens = name
        .split(/\s+/)
        .map(normalizeToken)
        .filter((token) => token.length >= 4);

      for (const queryToken of normalizedTokens) {
        for (const productToken of productTokens) {
          if (isCloseTypoMatch(queryToken, productToken)) {
            return true;
          }
        }
      }
    }
  }

  // Otherwise, if none of the site keywords matched, assume off-topic
  return false;
}

export function getOfftopicSuggestion(): string {
  return `I can only answer questions related to the Supermarkt website (products, inventory, pricing, categories, orders, invoices, stock, etc.). Please ask a question about your store or products so I can help.`;
}
