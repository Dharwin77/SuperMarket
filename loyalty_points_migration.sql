-- =============================================
-- LOYALTY POINTS & INVOICE HISTORY MIGRATION
-- =============================================

-- Create Customers Table
-- Stores customer data with mobile number as primary key
CREATE TABLE IF NOT EXISTS customers (
  mobile VARCHAR(15) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Invoices Table
-- Stores all invoice records linked to customers
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  customer_mobile VARCHAR(15) NOT NULL REFERENCES customers(mobile) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  points_earned INTEGER NOT NULL,
  points_used INTEGER DEFAULT 0,
  discount_applied DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  invoice_date DATE NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_customer_mobile ON invoices(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customers FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON invoices FOR UPDATE USING (true);

-- Optional: Create a function to auto-update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET 
    total_points = total_points + NEW.points_earned - NEW.points_used,
    total_purchases = total_purchases + 1,
    last_purchase_date = NEW.created_at
  WHERE mobile = NEW.customer_mobile;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update customer stats on invoice insert
CREATE TRIGGER trigger_update_customer_stats
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- Sample data (optional - remove in production)
-- INSERT INTO customers (mobile, total_points, total_purchases, last_purchase_date)
-- VALUES ('9360500228', 150, 5, NOW());
