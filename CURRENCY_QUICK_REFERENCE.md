# Quick Reference: Currency Formatting Guide

## ✅ DO's - Correct Usage

### 1. Display Currency in UI
```typescript
// ✅ CORRECT - Use ₹ symbol directly
<span>₹{amount.toFixed(2)}</span>
<span>₹{amount.toLocaleString()}</span>

// ✅ CORRECT - Use utility function
import { formatCurrency } from "@/lib/utils";
<span>{formatCurrency(amount)}</span>
```

### 2. CSV Exports
```typescript
// ✅ CORRECT - Include ₹ in CSV data
const csvData = products.map(p => ({
  "Price": `₹${p.price.toFixed(2)}`,
  "Total": `₹${p.total.toFixed(2)}`
}));
```

### 3. PDF Reports
```typescript
// ✅ CORRECT - ₹ symbol in PDF text
doc.text(`Total: ₹${amount.toFixed(2)}`, x, y);

// ✅ CORRECT - In autoTable
body: [[name, `₹${price.toFixed(2)}`]]
```

### 4. WhatsApp/SMS Messages
```typescript
// ✅ CORRECT - Use ₹ in messages
const message = `Total: ₹${total.toFixed(0)}`;
```

### 5. Number Formatting
```typescript
// ✅ CORRECT - Indian locale formatting
amount.toLocaleString()  // Outputs: 1,00,000
amount.toLocaleString('en-IN')  // Explicit locale

// ✅ CORRECT - Fixed decimals
amount.toFixed(2)  // For prices: 99.99
amount.toFixed(0)  // For invoices: 100
```

## ❌ DON'Ts - Incorrect Usage

### 1. Wrong Symbols
```typescript
// ❌ WRONG - Don't use apostrophe
<span>'{amount}</span>

// ❌ WRONG - Don't use Rs.
<span>Rs. {amount}</span>

// ❌ WRONG - Don't use INR
<span>INR {amount}</span>

// ❌ WRONG - Don't use dollar sign
<span>${amount}</span>
```

### 2. Missing Symbols
```typescript
// ❌ WRONG - Missing currency symbol where needed
<span>{amount.toFixed(2)}</span>  // Just number, no context
```

### 3. Inconsistent Formatting
```typescript
// ❌ WRONG - Mixing formats
<span>₹{amount}</span>  // No decimals
<span>₹{amount.toFixed(3)}</span>  // Wrong decimal places
```

## 📋 Copy-Paste Templates

### UI Display (with thousand separator)
```typescript
₹{amount.toLocaleString()}
```

### UI Display (with 2 decimals)
```typescript
₹{amount.toFixed(2)}
```

### Invoice/Receipt (no decimals)
```typescript
₹{amount.toFixed(0)}
```

### CSV Export
```typescript
"Price": `₹${amount.toFixed(2)}`
```

### WhatsApp Message
```typescript
`Total: ₹${amount.toFixed(0)}`
```

### PDF Text
```typescript
doc.text(`Amount: ₹${amount.toFixed(2)}`, x, y);
```

## 🎯 Quick Tips

1. **Always use ₹** (Indian Rupee symbol, Unicode: U+20B9)
2. **Use toLocaleString()** for thousand separators in displays
3. **Use toFixed(2)** for prices with decimals
4. **Use toFixed(0)** for invoice totals (cleaner look)
5. **Include ₹** in all exports (CSV, PDF)
6. **Test in Excel** to ensure CSV ₹ symbol displays correctly
7. **UTF-8 BOM** is already added to CSV exports

## 🔍 How to Type ₹ Symbol

### Windows
- `Alt + 8377` (numeric keypad)
- `Ctrl + Alt + 4`

### Mac
- `Option + 4` (in some keyboards)
- Copy from here: ₹

### Linux
- `Ctrl + Shift + U`, then type `20b9`, then press `Enter`

### VS Code
- Just copy: ₹
- Or use Unicode escape: `\u20B9`

## 📊 Format Examples by Context

| Context | Format | Example |
|---------|--------|---------|
| Product Price | ₹{price.toFixed(2)} | ₹99.99 |
| Dashboard Stats | ₹{value.toLocaleString()} | ₹1,00,000 |
| Invoice Total | ₹{total.toFixed(0)} | ₹2,450 |
| CSV Export | \`₹${amount.toFixed(2)}\` | "₹150.00" |
| PDF Report | ₹{amount.toFixed(2)} | ₹5,000.50 |
| WhatsApp | ₹{amount.toFixed(0)} | ₹350 |

## 🛠️ Utility Function Usage

```typescript
import { formatCurrency } from "@/lib/utils";

// Default: 2 decimals, with symbol, thousand separator
formatCurrency(1234.56)  // ₹1,234.56

// Custom decimals
formatCurrency(1234.56, { decimals: 0 })  // ₹1,235

// Without symbol
formatCurrency(1234.56, { showSymbol: false })  // 1,234.56

// Without thousand separator
formatCurrency(1234.56, { useThousandSeparator: false })  // ₹1234.56
```

---

**Remember:** Consistency is key! Always use ₹ symbol everywhere currency is displayed.
