-- Migration to update products table schema
-- Run this in Supabase SQL Editor

-- Remove old columns that are no longer needed
ALTER TABLE products DROP COLUMN IF EXISTS supplier;
ALTER TABLE products DROP COLUMN IF EXISTS min_stock;
ALTER TABLE products DROP COLUMN IF EXISTS description;

-- Add new date columns for imported and expiry dates
ALTER TABLE products ADD COLUMN IF NOT EXISTS imported_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date date;

-- Update the updated_at column to auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
