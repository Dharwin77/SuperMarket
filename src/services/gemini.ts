// AI Chat Service (Groq API + smart fallback)

let isGrokAvailable = false;
const GROK_API_URL = import.meta.env.VITE_GROQ_API_URL || import.meta.env.VITE_GROK_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROK_MODEL = import.meta.env.VITE_GROQ_MODEL || import.meta.env.VITE_GROK_MODEL || 'llama-3.3-70b-versatile';

function getGrokApiKey(): string {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.GROQ_API_KEY ||
    import.meta.env.VITE_GROK_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

function hasGrokCredentials(): boolean {
  return Boolean(getGrokApiKey());
}

import { isRelatedToSupermarket, getOfftopicSuggestion } from "@/lib/supermarketFilter";

function toSafeNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDateSafe(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatInr(value: number): string {
  return `₹${toSafeNumber(value).toFixed(2)}`;
}

function getMinStockThreshold(product: any): number {
  const minStock = toSafeNumber(product?.min_stock, NaN);
  return Number.isFinite(minStock) && minStock > 0 ? minStock : 10;
}

const QUERY_STOP_WORDS = new Set([
  'what', 'which', 'where', 'when', 'why', 'how', 'much', 'many', 'show', 'tell',
  'about', 'for', 'the', 'with', 'from', 'that', 'this', 'please', 'have', 'any',
  'can', 'you', 'and', 'are', 'all', 'list', 'give', 'me', 'get'
]);

function queryTokens(input: string): string[] {
  return normalizeText(input)
    .split(' ')
    .filter(token => token.length >= 3 && !QUERY_STOP_WORDS.has(token));
}

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some(phrase => text.includes(phrase));
}

function scoreProductMatch(input: string, product: any): number {
  const normalizedInput = normalizeText(input);
  const tokens = queryTokens(input);
  const name = normalizeText(product?.name || '');
  const category = normalizeText(product?.category || '');
  const barcode = String(product?.barcode || '').toLowerCase();

  let score = 0;

  if (!name) {
    return 0;
  }

  if (normalizedInput.includes(name)) {
    score += 120;
  }

  if (name.includes(normalizedInput) && normalizedInput.length >= 4) {
    score += 80;
  }

  if (barcode && normalizedInput.includes(barcode)) {
    score += 140;
  }

  for (const token of tokens) {
    if (name.includes(token)) {
      score += 18;
    }
    if (category.includes(token)) {
      score += 6;
    }
  }

  return score;
}

function findMatchedProducts(input: string, products: any[], limit = 3): any[] {
  return products
    .map(product => ({ product, score: scoreProductMatch(input, product) }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(match => match.product);
}

function getSalesWindow(lowerInput: string): { label: string; start: Date } | null {
  const now = new Date();
  const start = new Date(now);

  if (lowerInput.includes('today')) {
    start.setHours(0, 0, 0, 0);
    return { label: 'today', start };
  }

  if (lowerInput.includes('yesterday')) {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    return { label: 'yesterday', start };
  }

  if (lowerInput.includes('this week') || lowerInput.includes('weekly')) {
    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    return { label: 'this week', start };
  }

  if (lowerInput.includes('this month') || lowerInput.includes('monthly')) {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { label: 'this month', start };
  }

  return null;
}

function normalizeTokenStem(token: string): string {
  if (token.endsWith('ies') && token.length > 3) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function matchCategoriesFromQuery(lowerInput: string, products: any[]): string[] {
  const categories = [...new Set(products.map(product => String(product?.category || '').trim()).filter(Boolean))];

  if (categories.length === 0) {
    return [];
  }

  const queryStemSet = new Set(queryTokens(lowerInput).map(normalizeTokenStem));

  return categories.filter(category => {
    const normalizedCategory = normalizeText(category);
    if (!normalizedCategory) {
      return false;
    }

    if (lowerInput.includes(normalizedCategory)) {
      return true;
    }

    const categoryTokens = normalizedCategory.split(' ').filter(Boolean);
    return categoryTokens.some(token => queryStemSet.has(normalizeTokenStem(token)));
  });
}

function buildCategoryCountAccuracyResponse(lowerInput: string, products: any[]): string | null {
  const asksCount = containsAny(lowerInput, ['how many', 'count', 'number of', 'total', 'quantity', 'qty']);
  const asksProducts = containsAny(lowerInput, ['product', 'products', 'item', 'items']);
  const asksAvailable = containsAny(lowerInput, ['available', 'in stock', 'have', 'has']);
  const asksList = containsAny(lowerInput, ['list', 'show', 'which', 'what are']);

  if (!asksProducts && !asksCount && !asksList) {
    return null;
  }

  if (products.length === 0) {
    return 'The inventory is currently empty, so there are no product counts to report.';
  }

  const matchedCategories = matchCategoriesFromQuery(lowerInput, products);

  if (matchedCategories.length > 0) {
    const responses = matchedCategories.slice(0, 3).map(category => {
      const categoryProducts = products.filter(product => String(product?.category || '').toLowerCase() === category.toLowerCase());
      const totalCount = categoryProducts.length;
      const availableCount = categoryProducts.filter(product => toSafeNumber(product.stock) > 0).length;

      if (asksCount || asksAvailable) {
        if (asksAvailable) {
          return `• ${category}: ${availableCount} available product${availableCount === 1 ? '' : 's'} (out of ${totalCount})`;
        }
        return `• ${category}: ${totalCount} product${totalCount === 1 ? '' : 's'} total`;
      }

      const sample = categoryProducts.slice(0, 5).map(product => `${product.name} (${toSafeNumber(product.stock)} in stock)`).join(', ');
      return `• ${category}: ${sample || 'No products listed'}`;
    });

    const heading = asksCount || asksAvailable
      ? '📊 **Exact Category Count**'
      : '📦 **Category Products**';

    return `${heading}\n\n${responses.join('\n')}`;
  }

  if (asksCount && asksProducts) {
    const totalCount = products.length;
    const availableCount = products.filter(product => toSafeNumber(product.stock) > 0).length;
    const outOfStockCount = totalCount - availableCount;

    if (asksAvailable) {
      return `📊 **Exact Product Availability**\n\n• Available Products: ${availableCount}\n• Out of Stock Products: ${outOfStockCount}\n• Total Products: ${totalCount}`;
    }

    return `📊 **Exact Product Count**\n\n• Total Products: ${totalCount}\n• Available Products: ${availableCount}`;
  }

  return null;
}

function buildProductAccuracyResponse(lowerInput: string, input: string, products: any[]): string | null {
  const asksProductQuery =
    lowerInput.includes('find') ||
    lowerInput.includes('search') ||
    lowerInput.includes('looking for') ||
    lowerInput.includes('do you have') ||
    lowerInput.includes('price of') ||
    lowerInput.includes('stock of') ||
    lowerInput.includes('expiry of') ||
    lowerInput.includes('barcode') ||
    lowerInput.includes('calculate') ||
    lowerInput.includes('multiply') ||
    lowerInput.includes('total value') ||
    lowerInput.includes('stock*price') ||
    lowerInput.includes('stock * price') ||
    lowerInput.includes('stock x price') ||
    lowerInput.includes('stock × price');

  if (!asksProductQuery) {
    return null;
  }

  if (products.length === 0) {
    return 'The inventory is currently empty. I cannot find product-level details yet.';
  }

  const matches = findMatchedProducts(input, products, 3);

  if (matches.length === 0) {
    return 'I could not find a matching product. Please share the exact product name or barcode.';
  }

  const best = matches[0];
  const stock = toSafeNumber(best.stock);
  const price = toSafeNumber(best.price);
  const minStock = getMinStockThreshold(best);
  const expiryDate = parseDateSafe(best.expiry_date);

  const asksStockValueCalculation =
    lowerInput.includes('calculate') ||
    lowerInput.includes('multiply') ||
    lowerInput.includes('total value') ||
    lowerInput.includes('stock*price') ||
    lowerInput.includes('stock * price') ||
    lowerInput.includes('stock x price') ||
    lowerInput.includes('stock × price') ||
    (lowerInput.includes('stock') && lowerInput.includes('price'));

  if (asksStockValueCalculation) {
    const stockValue = stock * price;
    return `🧮 **Calculation for ${best.name}:**\n\n• Stock Quantity: ${stock}\n• Price per unit: ${formatInr(price)}\n• **Total Stock Value: ${formatInr(stockValue)}**\n\nThis is the total value of ${best.name} in your inventory.`;
  }

  if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('how much')) {
    return `💰 **${best.name}**\n\n• Price: ${formatInr(price)}\n• Category: ${best.category || 'N/A'}\n• Current Stock: ${stock} units`;
  }

  if (lowerInput.includes('stock') || lowerInput.includes('available') || lowerInput.includes('quantity')) {
    const stockState = stock <= 0 ? '❌ Out of stock' : stock < minStock ? '⚠️ Low stock' : '✅ In stock';
    return `📦 **${best.name} Stock Status**\n\n• Current Stock: ${stock} units\n• Reorder Level: ${minStock} units\n• Status: ${stockState}`;
  }

  if (lowerInput.includes('expiry') || lowerInput.includes('expire')) {
    if (!expiryDate) {
      return `🗓️ **${best.name}** has no expiry date set.`;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff < 0) {
      return `⚠️ **${best.name}** expired ${Math.abs(dayDiff)} day${Math.abs(dayDiff) === 1 ? '' : 's'} ago (${expiryDate.toLocaleDateString()}).`;
    }
    return `🗓️ **${best.name}** expires in ${dayDiff} day${dayDiff === 1 ? '' : 's'} (${expiryDate.toLocaleDateString()}).`;
  }

  if (lowerInput.includes('barcode')) {
    return `🏷️ **${best.name}**\n\n• Barcode: ${best.barcode || 'Not available'}\n• Category: ${best.category || 'N/A'}\n• Price: ${formatInr(price)}`;
  }

  return `🔍 **Best Match: ${best.name}**\n\n• Category: ${best.category || 'N/A'}\n• Price: ${formatInr(price)}\n• Stock: ${stock} units${best.barcode ? `\n• Barcode: ${best.barcode}` : ''}${expiryDate ? `\n• Expiry: ${expiryDate.toLocaleDateString()}` : ''}`;
}

function buildInventoryAccuracyResponse(lowerInput: string, products: any[]): string | null {
  const asksStockValueCalculation =
    lowerInput.includes('calculate') ||
    lowerInput.includes('multiply') ||
    lowerInput.includes('stock*price') ||
    lowerInput.includes('stock * price') ||
    lowerInput.includes('stock x price') ||
    lowerInput.includes('stock × price') ||
    (lowerInput.includes('stock') && lowerInput.includes('price'));

  if (asksStockValueCalculation) {
    // Let product-specific calculation logic handle this to avoid generic inventory snapshots.
    return null;
  }

  const asksInventory =
    lowerInput.includes('inventory') ||
    lowerInput.includes('stock') ||
    lowerInput.includes('out of stock') ||
    lowerInput.includes('low stock') ||
    lowerInput.includes('stock value') ||
    lowerInput.includes('inventory value');

  if (!asksInventory) {
    return null;
  }

  if (products.length === 0) {
    return 'The inventory is currently empty. Add products to get accurate inventory analytics.';
  }

  if (lowerInput.includes('out of stock') || lowerInput.includes('zero stock')) {
    const outOfStock = products.filter(product => toSafeNumber(product.stock) <= 0);
    if (outOfStock.length === 0) {
      return '✅ No products are out of stock right now.';
    }
    return `⚠️ **Out of Stock (${outOfStock.length})**\n\n${outOfStock.slice(0, 10).map((product: any, index: number) => `${index + 1}. ${product.name}`).join('\n')}`;
  }

  if (lowerInput.includes('low stock') || lowerInput.includes('restock') || lowerInput.includes('running low')) {
    const lowStock = products.filter(product => toSafeNumber(product.stock) < getMinStockThreshold(product));
    if (lowStock.length === 0) {
      return '✅ All products are above minimum stock levels.';
    }
    return `⚠️ **Low Stock Alert (${lowStock.length})**\n\n${lowStock.slice(0, 10).map((product: any, index: number) => {
      const stock = toSafeNumber(product.stock);
      const min = getMinStockThreshold(product);
      return `${index + 1}. ${product.name} - ${stock} left (min ${min})`;
    }).join('\n')}`;
  }

  if (lowerInput.includes('value')) {
    const totalValue = products.reduce((sum, product) => sum + toSafeNumber(product.price) * toSafeNumber(product.stock), 0);
    return `📊 **Inventory Valuation**\n\n• Products: ${products.length}\n• Units in Stock: ${products.reduce((sum, product) => sum + toSafeNumber(product.stock), 0)}\n• Total Stock Value: ${formatInr(totalValue)}`;
  }

  const totalStock = products.reduce((sum, product) => sum + toSafeNumber(product.stock), 0);
  const lowStockCount = products.filter(product => toSafeNumber(product.stock) < getMinStockThreshold(product)).length;
  return `📦 **Inventory Snapshot**\n\n• Products: ${products.length}\n• Total Units: ${totalStock}\n• Low Stock Items: ${lowStockCount}`;
}

function buildSalesAccuracyResponse(lowerInput: string, sales: any[]): string | null {
  const asksSales =
    lowerInput.includes('sale') ||
    lowerInput.includes('revenue') ||
    lowerInput.includes('transaction') ||
    lowerInput.includes('payment') ||
    lowerInput.includes('top selling') ||
    lowerInput.includes('best selling');

  if (!asksSales) {
    return null;
  }

  if (sales.length === 0) {
    return '📊 No sales data is available yet.';
  }

  const window = getSalesWindow(lowerInput);
  const filteredSales = window
    ? sales.filter(sale => {
        const saleDate = parseDateSafe(sale.created_at);
        return saleDate ? saleDate >= window.start : false;
      })
    : sales;

  if (filteredSales.length === 0) {
    return `📊 No sales found for ${window?.label || 'the selected period'}.`;
  }

  if (lowerInput.includes('payment')) {
    const paymentSummary = filteredSales.reduce((acc: Record<string, { count: number; total: number }>, sale: any) => {
      const method = String(sale.payment_method || 'unknown').toUpperCase();
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += toSafeNumber(sale.total_amount);
      return acc;
    }, {});

    return `💳 **Payment Breakdown${window ? ` (${window.label})` : ''}**\n\n${Object.entries(paymentSummary).map(([method, data]) => `• ${method}: ${data.count} sales (${formatInr(data.total)})`).join('\n')}`;
  }

  if (lowerInput.includes('top selling') || lowerInput.includes('best selling') || lowerInput.includes('popular item')) {
    const productMap = filteredSales.reduce((acc: Record<string, { quantity: number; amount: number }>, sale: any) => {
      const items = Array.isArray(sale.items) ? sale.items : [];
      items.forEach((item: any) => {
        const name = String(item.product_name || 'Unknown Product');
        if (!acc[name]) {
          acc[name] = { quantity: 0, amount: 0 };
        }
        acc[name].quantity += toSafeNumber(item.quantity);
        acc[name].amount += toSafeNumber(item.total);
      });
      return acc;
    }, {});

    const topSelling = Object.entries(productMap)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);

    if (topSelling.length === 0) {
      return 'No item-level sales data is available for top-selling analysis.';
    }

    return `🔥 **Top Selling Products${window ? ` (${window.label})` : ''}**\n\n${topSelling.map(([name, data], index) => `${index + 1}. ${name} - ${data.quantity} units (${formatInr(data.amount)})`).join('\n')}`;
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + toSafeNumber(sale.total_amount), 0);
  const avgSale = totalRevenue / filteredSales.length;
  return `💰 **Sales Summary${window ? ` (${window.label})` : ''}**\n\n• Transactions: ${filteredSales.length}\n• Revenue: ${formatInr(totalRevenue)}\n• Average Bill: ${formatInr(avgSale)}`;
}

function buildPurchaseOrderAccuracyResponse(lowerInput: string, orders: any[]): string | null {
  const asksOrders =
    lowerInput.includes('purchase order') ||
    lowerInput.includes('purchase') ||
    lowerInput.includes('supplier') ||
    lowerInput.includes('ordered') ||
    lowerInput.includes('pending order') ||
    lowerInput.includes('received order');

  if (!asksOrders) {
    return null;
  }

  if (orders.length === 0) {
    return '📦 No purchase orders are available yet.';
  }

  const statusCounts = orders.reduce((acc: Record<string, number>, order: any) => {
    const status = String(order.status || 'unknown').toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalAmount = orders.reduce((sum, order) => sum + toSafeNumber(order.total_amount), 0);

  if (lowerInput.includes('pending')) {
    const pendingOrders = orders.filter(order => String(order.status || '').toLowerCase() === 'pending');
    if (pendingOrders.length === 0) {
      return '✅ No pending purchase orders.';
    }
    return `⏳ **Pending Purchase Orders (${pendingOrders.length})**\n\n${pendingOrders.slice(0, 8).map((order: any, index: number) => `${index + 1}. ${order.supplier || 'Unknown Supplier'} - ${formatInr(order.total_amount)}`).join('\n')}`;
  }

  return `📦 **Purchase Order Summary**\n\n• Total Orders: ${orders.length}\n• Total Value: ${formatInr(totalAmount)}\n• Pending: ${statusCounts.pending || 0}\n• Ordered: ${statusCounts.ordered || 0}\n• Received: ${statusCounts.received || 0}\n• Cancelled: ${statusCounts.cancelled || 0}`;
}

function buildComparativeAccuracyResponse(lowerInput: string, products: any[]): string | null {
  if (products.length === 0) {
    return null;
  }

  const asksHighest = containsAny(lowerInput, ['highest', 'most', 'maximum', 'max', 'top']);
  const asksLowest = containsAny(lowerInput, ['lowest', 'least', 'minimum', 'min', 'bottom']);
  const asksStock = containsAny(lowerInput, ['stock', 'quantity', 'units']);
  const asksPrice = containsAny(lowerInput, ['price', 'cost', 'rate', 'expensive', 'cheap', 'cheapest']);

  if (asksHighest && asksStock) {
    const top = [...products].sort((a, b) => toSafeNumber(b.stock) - toSafeNumber(a.stock))[0];
    return `📈 **Highest Stock Product**\n\n• ${top.name}\n• Stock: ${toSafeNumber(top.stock)} units\n• Price: ${formatInr(top.price)}\n• Category: ${top.category || 'N/A'}`;
  }

  if (asksLowest && asksStock) {
    const low = [...products].sort((a, b) => toSafeNumber(a.stock) - toSafeNumber(b.stock))[0];
    return `📉 **Lowest Stock Product**\n\n• ${low.name}\n• Stock: ${toSafeNumber(low.stock)} units\n• Price: ${formatInr(low.price)}\n• Category: ${low.category || 'N/A'}`;
  }

  if (asksHighest && asksPrice) {
    const expensive = [...products].sort((a, b) => toSafeNumber(b.price) - toSafeNumber(a.price))[0];
    return `💸 **Most Expensive Product**\n\n• ${expensive.name}\n• Price: ${formatInr(expensive.price)}\n• Stock: ${toSafeNumber(expensive.stock)} units\n• Category: ${expensive.category || 'N/A'}`;
  }

  if (asksLowest && asksPrice) {
    const cheapest = [...products].sort((a, b) => toSafeNumber(a.price) - toSafeNumber(b.price))[0];
    return `💰 **Cheapest Product**\n\n• ${cheapest.name}\n• Price: ${formatInr(cheapest.price)}\n• Stock: ${toSafeNumber(cheapest.stock)} units\n• Category: ${cheapest.category || 'N/A'}`;
  }

  if (containsAny(lowerInput, ['how many product', 'number of products', 'product count'])) {
    return `📦 You currently have **${products.length} products** in inventory.`;
  }

  if (containsAny(lowerInput, ['how many category', 'number of categories', 'category count'])) {
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    return `📂 You currently have **${categories.length} categories**: ${categories.join(', ')}.`;
  }

  return null;
}

function buildUniversalBestEffortResponse(input: string, products: any[], context?: any): string {
  const matchedProducts = findMatchedProducts(input, products, 3);
  const sales = context?.sales || [];
  const purchaseOrders = context?.purchaseOrders || [];

  const totalStock = products.reduce((sum, product) => sum + toSafeNumber(product.stock), 0);
  const inventoryValue = products.reduce((sum, product) => sum + toSafeNumber(product.stock) * toSafeNumber(product.price), 0);
  const lowStockCount = products.filter(product => toSafeNumber(product.stock) < getMinStockThreshold(product)).length;
  const totalRevenue = sales.reduce((sum: number, sale: any) => sum + toSafeNumber(sale.total_amount), 0);
  const pendingOrders = purchaseOrders.filter((order: any) => String(order.status || '').toLowerCase() === 'pending').length;

  if (matchedProducts.length > 0) {
    const list = matchedProducts
      .map((product: any, index: number) => `${index + 1}. ${product.name} - ${formatInr(product.price)} (Stock: ${toSafeNumber(product.stock)})`)
      .join('\n');

    return `I interpreted your question and found related products:\n\n${list}\n\nIf you want, ask for a specific metric like **price**, **stock**, **expiry**, **sales**, or **orders** for a precise answer.`;
  }

  if (products.length === 0 && sales.length === 0 && purchaseOrders.length === 0) {
    return `I can answer any supermarket operations question, but there is no data loaded yet.\n\nStart by adding products, sales, or purchase orders, then I can provide exact numbers and insights.`;
  }

  return `I can answer that with your store data. Here is the latest snapshot:\n\n• Products: ${products.length}\n• Total Units: ${totalStock}\n• Inventory Value: ${formatInr(inventoryValue)}\n• Low Stock Items: ${lowStockCount}\n• Sales Records: ${sales.length}\n• Revenue: ${formatInr(totalRevenue)}\n• Pending Purchase Orders: ${pendingOrders}\n\nAsk in any style, and I will map it to these metrics automatically.`;
}

function generateDataDrivenFallbackResponse(input: string, products: any[], context?: any): string | null {
  const lowerInput = input.toLowerCase();

  const categoryCountResponse = buildCategoryCountAccuracyResponse(lowerInput, products);
  if (categoryCountResponse) return categoryCountResponse;

  const productResponse = buildProductAccuracyResponse(lowerInput, input, products);
  if (productResponse) return productResponse;

  const inventoryResponse = buildInventoryAccuracyResponse(lowerInput, products);
  if (inventoryResponse) return inventoryResponse;

  const salesResponse = buildSalesAccuracyResponse(lowerInput, context?.sales || []);
  if (salesResponse) return salesResponse;

  const purchaseResponse = buildPurchaseOrderAccuracyResponse(lowerInput, context?.purchaseOrders || []);
  if (purchaseResponse) return purchaseResponse;

  const comparativeResponse = buildComparativeAccuracyResponse(lowerInput, products);
  if (comparativeResponse) return comparativeResponse;

  return null;
}

export async function initializeGemini() {
  if (!hasGrokCredentials()) {
    isGrokAvailable = false;
    console.warn('⚠️ GROQ API key is missing. Set VITE_GROQ_API_KEY (or GROQ_API_KEY). Using smart fallback responses.');
    return false;
  }

  isGrokAvailable = true;
  console.log(`✅ Groq API configured. Using model: ${GROK_MODEL}`);
  return true;
}

export async function sendMessageToGemini(
  message: string,
  context?: { 
    products?: any[]; 
    sales?: any[];
    staff?: any[];
    duties?: any[];
    events?: any[];
    purchaseOrders?: any[];
    conversationHistory?: any[] 
  }
): Promise<string> {
  // Enforce Supermarkt-only conversation: reject off-topic queries with a suggestion
  if (!isRelatedToSupermarket(message, context?.products || [])) {
    return getOfftopicSuggestion();
  }
  // Try Groq API first
  if (!isGrokAvailable) {
    await initializeGemini();
  }

  if (isGrokAvailable) {
    try {
      console.log('🤖 Sending message to Groq API...');
      
      // Build context-aware prompt with all available data
      let prompt = 'You are a helpful AI assistant for a supermarket management system.\n\n';
      
      if (context?.products && context.products.length > 0) {
        const productInfo = context.products.slice(0, 15).map(p => 
          `${p.name} (${p.category}) - ₹${p.price}, Stock: ${p.stock}${p.expiry_date ? `, Expiry: ${p.expiry_date}` : ''}`
        ).join('\n');
        prompt += `Current Inventory (${context.products.length} products):\n${productInfo}\n\n`;
      }
      
      if (context?.sales && context.sales.length > 0) {
        const totalRevenue = context.sales.reduce((sum, s) => sum + s.total_amount, 0);
        prompt += `Sales: ${context.sales.length} transactions, Total Revenue: ₹${totalRevenue.toFixed(2)}\n\n`;
      }
      
      if (context?.staff && context.staff.length > 0) {
        prompt += `Staff: ${context.staff.length} employees\n\n`;
      }
      
      prompt += `User Question: ${message}\n\nProvide helpful, concise responses with bullet points when listing items.`;

      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getGrokApiKey()}`,
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a concise supermarket operations assistant. Use bullet points when helpful and stay on-topic.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim()) {
          console.log('✅ Received response from Groq API');
          return text.trim();
        }
        console.warn('⚠️ Groq API returned an empty response. Falling back to smart mode.');
      } else {
        const rawErrorText = await response.text();
        console.warn(`⚠️ Groq API error ${response.status}: ${rawErrorText}`);
      }
    } catch (error) {
      console.log('⚠️ Groq API request failed, using fallback');
    }
  }

  // Fallback to smart responses
  console.log('💬 Using smart fallback responses');
  return generateFallbackResponse(message, context?.products || [], context);
}

// Fallback response generator (when API is unavailable)
function generateFallbackResponse(input: string, products: any[], context?: any): string {
  const lowerInput = input.toLowerCase();

  const dataDrivenResponse = generateDataDrivenFallbackResponse(input, products, context);
  if (dataDrivenResponse) {
    return dataDrivenResponse;
  }
  
  // GREETING AND HELP
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return `Hello! 👋 I'm your AI Supermarket Assistant. I can help you with:\n\n**📦 Products & Inventory:**\n• Product search and availability\n• Stock levels and low stock alerts\n• Category browsing\n• Pricing information\n• Expiry tracking\n\n**💰 Sales & Finance:**\n• Sales reports and revenue\n• Profit analysis\n• Invoice history\n\n**👥 Staff & Operations:**\n• Staff information\n• Task assignments and duties\n• Event calendar\n\n**📊 Reports & Analytics:**\n• Purchase orders\n• Stock valuations\n• Business insights\n\nWhat would you like to know?`;
  }
  
  // HELP/FEATURES QUERY
  if (lowerInput.includes('help') || lowerInput.includes('what can you do') || lowerInput.includes('features')) {
    return `I'm your comprehensive Supermarket Management Assistant! Here's what I can do:\n\n**Product Management:**\n• Check product availability\n• View stock levels\n• Track expiry dates\n• Browse by category\n• Calculate stock values\n\n**Sales & Revenue:**\n• View sales history\n• Check revenue reports\n• Track payment methods\n• Customer information\n\n**Staff & Tasks:**\n• Staff directory\n• Duty assignments\n• Task tracking\n\n**Analytics:**\n• Low stock alerts\n• Profit calculations\n• Purchase orders\n• Event scheduling\n\nJust ask me anything about your store!`;
  }
  
  // Check if asking about available products
  if (
    lowerInput.includes('what') && (lowerInput.includes('product') || lowerInput.includes('item')) ||
    lowerInput.includes('available') || 
    lowerInput.includes('have') || 
    lowerInput.includes('list') ||
    lowerInput.includes('show me')
  ) {
    if (products.length === 0) {
      return 'The inventory is currently empty. No products are available at the moment.';
    }
    
    // Group products by category
    const categories = products.reduce((acc: any, p: any) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});
    
    const categoryNames = Object.keys(categories);
    
    if (categoryNames.length > 0) {
      let response = `📦 We have ${products.length} products available across ${categoryNames.length} categories:\n\n`;
      
      for (const category of categoryNames.slice(0, 5)) {
        const categoryProducts = categories[category].slice(0, 3);
        response += `**${category}:**\n`;
        response += categoryProducts.map((p: any) => 
          `  • ${p.name} - ₹${p.price.toFixed(2)} (Stock: ${p.stock})`
        ).join('\n');
        response += '\n\n';
      }
      
      if (categoryNames.length > 5) {
        response += `...and ${categoryNames.length - 5} more categories!`;
      }
      
      return response.trim();
    }
  }
  
  if (lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
    if (products.length === 0) {
      return 'I would love to recommend products, but it seems the inventory is currently empty. Please add some products first!';
    }
    const randomProducts = products.slice(0, Math.min(5, products.length));
    return `Based on your query, I'd recommend these popular items:\n\n${randomProducts.map((p, i) => `${i + 1}. ${p.name} - ₹${p.price.toFixed(2)} (${p.category})`).join('\n')}\n\nWould you like more details about any of these?`;
  }
  
  // Check for expiry-related queries
  if (lowerInput.includes('expir') || lowerInput.includes('experi') || lowerInput.includes('old')) {
    if (products.length === 0) {
      return 'The inventory is currently empty. No products to check for expiry.';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find products with expiry dates
    const productsWithExpiry = products.filter(p => p.expiry_date);
    
    if (productsWithExpiry.length === 0) {
      return 'No products in the inventory have expiry dates set. Please update product information to track expiry dates.';
    }
    
    // Find expired products
    const expiredProducts = productsWithExpiry.filter(p => {
      const expiryDate = new Date(p.expiry_date!);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate < today;
    });
    
    // Find products expiring soon (within 7 days)
    const expiringSoon = productsWithExpiry.filter(p => {
      const expiryDate = new Date(p.expiry_date!);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });
    
    if (expiredProducts.length === 0 && expiringSoon.length === 0) {
      return `✅ **No Expired Products**\n\nAll ${productsWithExpiry.length} products with expiry dates are still fresh! Everything looks good.`;
    }
    
    let response = '🗓️ **Product Expiry Status:**\n\n';
    
    if (expiredProducts.length > 0) {
      response += `⚠️ **${expiredProducts.length} Expired Product${expiredProducts.length > 1 ? 's' : ''}:**\n`;
      expiredProducts.slice(0, 5).forEach((p, i) => {
        const expiryDate = new Date(p.expiry_date!);
        const daysAgo = Math.floor((today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
        response += `${i + 1}. ${p.name} - Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago (${expiryDate.toLocaleDateString()})\n`;
      });
      response += '\n';
    }
    
    if (expiringSoon.length > 0) {
      response += `🔔 **${expiringSoon.length} Product${expiringSoon.length > 1 ? 's' : ''} Expiring Soon:**\n`;
      expiringSoon.slice(0, 5).forEach((p, i) => {
        const expiryDate = new Date(p.expiry_date!);
        const daysUntil = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        response += `${i + 1}. ${p.name} - Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${expiryDate.toLocaleDateString()})\n`;
      });
    }
    
    return response.trim();
  }
  
  // Check for calculation requests (MUST BE BEFORE general stock check)
  if (lowerInput.includes('calculate') || lowerInput.includes('multiply') || lowerInput.includes('total value') || 
      (lowerInput.includes('*') || lowerInput.includes('×')) ||
      (lowerInput.includes('stock') && lowerInput.includes('price'))) {
    
    if (products.length === 0) {
      return 'I cannot perform calculations as the inventory is empty.';
    }
    
    // Try to find product name in the query
    for (const product of products) {
      const productNameLower = product.name.toLowerCase();
      // Check if product name or partial name is in the query
      if (lowerInput.includes(productNameLower)) {
        const stockValue = product.stock * product.price;
        return `🧮 **Calculation for ${product.name}:**\n\n• Stock Quantity: ${product.stock}\n• Price per unit: ₹${product.price.toFixed(2)}\n• **Total Stock Value: ₹${stockValue.toFixed(2)}**\n\nThis is the total value of ${product.name} in your inventory.`;
      }
      
      // Also check for partial matches (e.g., "britania" for "Britannia")
      const words = productNameLower.split(' ');
      for (const word of words) {
        if (word.length >= 4 && lowerInput.includes(word)) {
          const stockValue = product.stock * product.price;
          return `🧮 **Calculation for ${product.name}:**\n\n• Stock Quantity: ${product.stock}\n• Price per unit: ₹${product.price.toFixed(2)}\n• **Total Stock Value: ₹${stockValue.toFixed(2)}**\n\nThis is the total value of ${product.name} in your inventory.`;
        }
      }
    }
    
    return 'I couldn\'t identify which product you want to calculate. Please include the product name in your query, for example: "calculate milk stock quantity * price"';
  }
  
  if (lowerInput.includes('stock') || lowerInput.includes('inventory')) {
    if (products.length === 0) {
      return 'The inventory is currently empty. No products are in stock.';
    }
    const lowStock = products.filter(p => p.stock < p.min_stock);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    
    if (lowStock.length > 0) {
      return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ⚠️ Low Stock Alert: ${lowStock.length} items\n\nItems running low:\n${lowStock.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} - Only ${p.stock} left!`).join('\n')}`;
    }
    return `📊 Inventory Status:\n\n• Total Products: ${products.length}\n• Total Stock: ${totalStock} items\n• ✅ All items are well-stocked!`;
  }
  
  // Check for price queries
  if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('how much')) {
    if (products.length === 0) {
      return 'I don\'t have any pricing information as the inventory is empty.';
    }
    return `I can help you with pricing information! We have products ranging from ₹${Math.min(...products.map(p => p.price)).toFixed(2)} to ₹${Math.max(...products.map(p => p.price)).toFixed(2)}. What specific product are you interested in?`;
  }
  
  // Check for category queries
  if (lowerInput.includes('category') || lowerInput.includes('categories')) {
    if (products.length === 0) {
      return 'No categories available as the inventory is empty.';
    }
    const categories = [...new Set(products.map(p => p.category))];
    return `📂 We have products in ${categories.length} categories:\n\n${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nWhich category interests you?`;
  }
  
  // SALES AND REVENUE QUERIES
  if (lowerInput.includes('sales') || lowerInput.includes('revenue') || lowerInput.includes('earnings') || lowerInput.includes('income')) {
    const sales = context?.sales || [];
    if (sales.length === 0) {
      return '📊 **Sales Report:**\n\nNo sales data available yet. Start making sales to see revenue reports!';
    }
    
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
    const avgSale = totalRevenue / sales.length;
    const paymentMethods = sales.reduce((acc: any, s: any) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
      return acc;
    }, {});
    
    let response = `💰 **Sales Summary:**\n\n`;
    response += `• Total Sales: ${sales.length} transactions\n`;
    response += `• Total Revenue: ₹${totalRevenue.toFixed(2)}\n`;
    response += `• Average Sale: ₹${avgSale.toFixed(2)}\n\n`;
    response += `**Payment Methods:**\n`;
    Object.entries(paymentMethods).forEach(([method, count]) => {
      response += `• ${method.toUpperCase()}: ${count} transactions\n`;
    });
    
    return response.trim();
  }
  
  // STAFF QUERIES
  if (lowerInput.includes('staff') || lowerInput.includes('employee') || lowerInput.includes('worker') || lowerInput.includes('team')) {
    const staff = context?.staff || [];
    if (staff.length === 0) {
      return '👥 **Staff Directory:**\n\nNo staff members found in the system. Add employees to manage your team!';
    }
    
    const activeStaff = staff.filter((s: any) => s.status === 'Active');
    const departments = [...new Set(staff.filter((s: any) => s.department).map((s: any) => s.department))];
    
    let response = `👥 **Staff Overview:**\n\n`;
    response += `• Total Employees: ${staff.length}\n`;
    response += `• Active: ${activeStaff.length}\n`;
    response += `• Inactive: ${staff.length - activeStaff.length}\n\n`;
    
    if (departments.length > 0) {
      response += `**Departments:** ${departments.join(', ')}\n\n`;
    }
    
    response += `Recent staff members:\n`;
    staff.slice(0, 5).forEach((s: any, i: number) => {
      response += `${i + 1}. ${s.full_name}${s.department ? ` (${s.department})` : ''} - ${s.status}\n`;
    });
    
    return response.trim();
  }
  
  // DUTIES AND TASKS
  if (lowerInput.includes('duty') || lowerInput.includes('duties') || lowerInput.includes('task') || lowerInput.includes('assignment')) {
    const duties = context?.duties || [];
    if (duties.length === 0) {
      return '📋 **Task Management:**\n\nNo duties or tasks assigned yet. Create task assignments to track work!';
    }
    
    const pending = duties.filter((d: any) => d.status === 'Pending');
    const inProgress = duties.filter((d: any) => d.status === 'In Progress');
    const completed = duties.filter((d: any) => d.status === 'Completed');
    const overdue = duties.filter((d: any) => d.status === 'Overdue');
    
    let response = `📋 **Task Status:**\n\n`;
    response += `• Total Tasks: ${duties.length}\n`;
    response += `• ⏳ Pending: ${pending.length}\n`;
    response += `• 🔄 In Progress: ${inProgress.length}\n`;
    response += `• ✅ Completed: ${completed.length}\n`;
    if (overdue.length > 0) response += `• ⚠️ Overdue: ${overdue.length}\n`;
    
    if (pending.length > 0) {
      response += `\n**Pending Tasks:**\n`;
      pending.slice(0, 3).forEach((d: any, i: number) => {
        response += `${i + 1}. ${d.duty_title}${d.deadline ? ` (Due: ${new Date(d.deadline).toLocaleDateString()})` : ''}\n`;
      });
    }
    
    return response.trim();
  }
  
  // PURCHASE ORDERS
  if (lowerInput.includes('purchase') || lowerInput.includes('order') || lowerInput.includes('supplier')) {
    const orders = context?.purchaseOrders || [];
    if (orders.length === 0) {
      return '📦 **Purchase Orders:**\n\nNo purchase orders found. Create orders to manage inventory restocking!';
    }
    
    const pending = orders.filter((o: any) => o.status === 'pending');
    const ordered = orders.filter((o: any) => o.status === 'ordered');
    const received = orders.filter((o: any) => o.status === 'received');
    
    let response = `📦 **Purchase Orders:**\n\n`;
    response += `• Total Orders: ${orders.length}\n`;
    response += `• Pending: ${pending.length}\n`;
    response += `• Ordered: ${ordered.length}\n`;
    response += `• Received: ${received.length}\n\n`;
    
    if (pending.length > 0 || ordered.length > 0) {
      response += `**Active Orders:**\n`;
      [...pending, ...ordered].slice(0, 3).forEach((o: any, i: number) => {
        response += `${i + 1}. ${o.supplier} - ₹${o.total_amount.toFixed(2)} (${o.status})\n`;
      });
    }
    
    return response.trim();
  }
  
  // EVENTS AND CALENDAR
  if (lowerInput.includes('event') || lowerInput.includes('calendar') || lowerInput.includes('schedule') || lowerInput.includes('meeting')) {
    const events = context?.events || [];
    if (events.length === 0) {
      return '📅 **Calendar & Events:**\n\nNo upcoming events scheduled. Add events to manage deliveries, meetings, and important dates!';
    }
    
    const today = new Date();
    const upcoming = events.filter((e: any) => new Date(e.event_date) >= today);
    
    let response = `📅 **Events & Calendar:**\n\n`;
    response += `• Total Events: ${events.length}\n`;
    response += `• Upcoming: ${upcoming.length}\n\n`;
    
    if (upcoming.length > 0) {
      response += `**Upcoming Events:**\n`;
      upcoming.slice(0, 5).forEach((e: any, i: number) => {
        response += `${i + 1}. ${e.title} - ${new Date(e.event_date).toLocaleDateString()}${e.event_type ? ` (${e.event_type})` : ''}\n`;
      });
    }
    
    return response.trim();
  }
  
  // PROFIT AND ANALYTICS
  if (lowerInput.includes('profit') || lowerInput.includes('margin') || lowerInput.includes('earnings')) {
    if (products.length === 0) {
      return 'Cannot calculate profit without product data. Add products with cost and selling prices!';
    }
    
    const productsWithPricing = products.filter(p => p.cost_price && p.selling_price);
    if (productsWithPricing.length === 0) {
      return 'Profit calculation requires cost_price and selling_price for products. Please update product information!';
    }
    
    let totalProfit = 0;
    productsWithPricing.forEach(p => {
      const profit = (p.selling_price - p.cost_price) * p.stock;
      totalProfit += profit;
    });
    
    const avgMargin = productsWithPricing.reduce((sum, p) => {
      return sum + ((p.selling_price - p.cost_price) / p.cost_price * 100);
    }, 0) / productsWithPricing.length;
    
    return `💹 **Profit Analysis:**\n\n• Products Analyzed: ${productsWithPricing.length}\n• Potential Profit: ₹${totalProfit.toFixed(2)}\n• Average Margin: ${avgMargin.toFixed(1)}%\n\nThis is based on current stock levels and pricing.`;
  }
  
  // SPECIFIC PRODUCT SEARCH
  if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('do you have') || lowerInput.includes('looking for')) {
    if (products.length === 0) {
      return 'The inventory is empty. Add products to search for them!';
    }
    
    // Try to find product by name mention
    for (const product of products) {
      const productNameLower = product.name.toLowerCase();
      const words = productNameLower.split(' ');
      
      // Check full name or significant words
      if (lowerInput.includes(productNameLower) || words.some(word => word.length >= 4 && lowerInput.includes(word))) {
        let response = `🔍 **Found: ${product.name}**\n\n`;
        response += `• Category: ${product.category}\n`;
        response += `• Price: ₹${product.price.toFixed(2)}\n`;
        response += `• Stock: ${product.stock} units\n`;
        if (product.barcode) response += `• Barcode: ${product.barcode}\n`;
        if (product.expiry_date) response += `• Expiry: ${new Date(product.expiry_date).toLocaleDateString()}\n`;
        response += `\n${product.stock > 0 ? '✅ In stock!' : '❌ Out of stock'}`;
        return response;
      }
    }
    
    return 'I couldn\'t find that specific product. Try asking "what products are available" to see all items, or search by category.';
  }
  
  // RECOMMENDATIONS
  if (lowerInput.includes('recommend') || lowerInput.includes('suggest') || lowerInput.includes('popular') || lowerInput.includes('best')) {
    if (products.length === 0) {
      return 'I would love to recommend products, but the inventory is currently empty. Please add some products first!';
    }
    
    // Recommend products with good stock
    const wellStocked = products.filter(p => p.stock > (p.min_stock || 10) * 2).slice(0, 5);
    
    if (wellStocked.length > 0) {
      let response = `⭐ **Recommended Products:**\n\n`;
      wellStocked.forEach((p, i) => {
        response += `${i + 1}. **${p.name}** (${p.category})\n`;
        response += `   ₹${p.price.toFixed(2)} - ${p.stock} in stock\n`;
      });
      return response.trim();
    }
    
    // Fallback to first few products
    return `⭐ **Available Products:**\n\n${products.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} - ₹${p.price.toFixed(2)} (${p.category})`).join('\n')}`;
  }
  
  // LOW STOCK SPECIFIC
  if (lowerInput.includes('low stock') || lowerInput.includes('running low') || lowerInput.includes('restock') || lowerInput.includes('refill')) {
    if (products.length === 0) {
      return 'No products to check for low stock.';
    }
    
    const lowStock = products.filter(p => p.stock < (p.min_stock || 10));
    
    if (lowStock.length === 0) {
      return '✅ **Stock Levels Good!**\n\nAll products are adequately stocked. No restocking needed at this time.';
    }
    
    let response = `⚠️ **Low Stock Alert:**\n\n${lowStock.length} products need restocking:\n\n`;
    lowStock.slice(0, 10).forEach((p, i) => {
      const shortage = (p.min_stock || 10) - p.stock;
      response += `${i + 1}. ${p.name} - Only ${p.stock} left (Need ${shortage} more)\n`;
    });
    
    return response.trim();
  }
  
  // REPORTS AND ANALYTICS
  if (lowerInput.includes('report') || lowerInput.includes('analytics') || lowerInput.includes('summary') || lowerInput.includes('overview')) {
    let response = `📊 **Business Overview:**\n\n`;
    
    // Products
    if (products.length > 0) {
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      response += `**Inventory:**\n`;
      response += `• Products: ${products.length}\n`;
      response += `• Total Stock: ${products.reduce((sum, p) => sum + p.stock, 0)} units\n`;
      response += `• Inventory Value: ₹${totalValue.toFixed(2)}\n\n`;
    }
    
    // Sales
    const sales = context?.sales || [];
    if (sales.length > 0) {
      const totalRevenue = sales.reduce((sum: number, s: any) => sum + s.total_amount, 0);
      response += `**Sales:**\n`;
      response += `• Transactions: ${sales.length}\n`;
      response += `• Total Revenue: ₹${totalRevenue.toFixed(2)}\n\n`;
    }
    
    // Staff
    const staff = context?.staff || [];
    if (staff.length > 0) {
      response += `**Staff:**\n• Employees: ${staff.length}\n• Active: ${staff.filter((s: any) => s.status === 'Active').length}\n\n`;
    }
    
    if (products.length === 0 && sales.length === 0 && staff.length === 0) {
      return 'No data available yet for reports. Start by adding products, making sales, and managing staff!';
    }
    
    return response.trim();
  }
  
  return buildUniversalBestEffortResponse(input, products, context);
}

export function isGeminiAvailable(): boolean {
  return isGrokAvailable || hasGrokCredentials();
}
