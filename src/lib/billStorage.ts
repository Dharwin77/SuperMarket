// Bill data storage for shareable links
// This stores bill details in localStorage for retrieval via invoice ID

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface BillData {
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  customerWhatsApp?: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  pointsEarned: number;
  pointsUsed: number;
  date: string;
  time: string;
  storeName: string;
  storeAddress: string;
  gstNumber: string;
}

const BILLS_STORAGE_KEY = 'supermarket_bills';

export function saveBill(billData: BillData): void {
  try {
    const bills = getAllBills();
    bills[billData.invoiceNumber] = billData;
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
    console.log('✅ Bill saved successfully:', billData.invoiceNumber);
    console.log('📦 Bill data:', billData);
    console.log('📚 All bills in storage:', Object.keys(bills));
  } catch (error) {
    console.error('❌ Error saving bill:', error);
  }
}

export function getBill(invoiceNumber: string): BillData | null {
  try {
    const bills = getAllBills();
    console.log('🔍 Looking for bill:', invoiceNumber);
    console.log('📚 Available bills:', Object.keys(bills));
    const foundBill = bills[invoiceNumber] || null;
    if (foundBill) {
      console.log('✅ Bill found:', foundBill);
    } else {
      console.log('❌ Bill NOT found for:', invoiceNumber);
    }
    return foundBill;
  } catch (error) {
    console.error('❌ Error getting bill:', error);
    return null;
  }
}

function getAllBills(): Record<string, BillData> {
  try {
    const billsJson = localStorage.getItem(BILLS_STORAGE_KEY);
    return billsJson ? JSON.parse(billsJson) : {};
  } catch (error) {
    console.error('Error getting all bills:', error);
    return {};
  }
}
