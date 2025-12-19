-- Migration to add cost_price and selling_price columns to products table
-- Run this SQL in your Supabase SQL Editor

-- Add cost_price column (decimal with 2 decimal places)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);

-- Add selling_price column (decimal with 2 decimal places)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN products.cost_price IS 'The cost price at which the product was purchased';
COMMENT ON COLUMN products.selling_price IS 'The selling price of the product (if different from regular price)';

-- Optional: Create an index for faster queries involving cost_price
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
