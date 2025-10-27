import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineSale {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  items: any[];
  total_amount: number;
  payment_method: string;
  sale_date: string;
  synced: boolean;
  created_at: string;
}

const OFFLINE_SALES_KEY = 'offline_sales';
const PRODUCTS_CACHE_KEY = 'products_cache';

export const initOfflineStorage = async () => {
  try {
    // Initialize storage
    const sales = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
    if (!sales) {
      await AsyncStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify([]));
    }
    
    console.log('Offline storage initialized');
  } catch (error) {
    console.error('Error initializing offline storage:', error);
  }
};

// Save products cache
export const saveProductsCache = async (products: any[]) => {
  try {
    await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving products cache:', error);
  }
};

// Get products from cache
export const getProductsCache = async (): Promise<any[]> => {
  try {
    const cache = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
    return cache ? JSON.parse(cache) : [];
  } catch (error) {
    console.error('Error getting products cache:', error);
    return [];
  }
};

// Save offline sale
export const saveOfflineSale = async (sale: OfflineSale) => {
  try {
    const sales = await getOfflineSales();
    sales.push(sale);
    await AsyncStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(sales));
    console.log('Offline sale saved:', sale.id);
  } catch (error) {
    console.error('Error saving offline sale:', error);
    throw error;
  }
};

// Get offline sales (not synced)
export const getOfflineSales = async (): Promise<OfflineSale[]> => {
  try {
    const sales = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
    const allSales = sales ? JSON.parse(sales) : [];
    return allSales.filter((sale: OfflineSale) => !sale.synced);
  } catch (error) {
    console.error('Error getting offline sales:', error);
    return [];
  }
};

// Mark sale as synced
export const markSaleAsSynced = async (saleId: string) => {
  try {
    const sales = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
    const allSales = sales ? JSON.parse(sales) : [];
    
    const updatedSales = allSales.map((sale: OfflineSale) =>
      sale.id === saleId ? { ...sale, synced: true } : sale
    );
    
    await AsyncStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(updatedSales));
    console.log('Sale marked as synced:', saleId);
  } catch (error) {
    console.error('Error marking sale as synced:', error);
  }
};

// Get count of pending syncs
export const getPendingSyncsCount = async (): Promise<number> => {
  try {
    const sales = await getOfflineSales();
    return sales.length;
  } catch (error) {
    console.error('Error getting pending syncs count:', error);
    return 0;
  }
};
