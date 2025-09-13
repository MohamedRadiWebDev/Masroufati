import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localStorageManager } from "./localStorage-storage";

// localStorage-based query function
export const getQueryFn = (): QueryFunction<any> => async ({ queryKey }) => {
  const [endpoint, ...params] = queryKey as [string, ...any[]];
  
  switch (endpoint) {
    case "/api/transactions":
      // Support pagination only when explicitly requested with params: ["/api/transactions", page, limit]
      if (params.length >= 2) {
        const page = params[0] || 1;
        const limit = params[1] || 50;
        return await localStorageManager.getTransactions(page, limit);
      }
      // Default: return all transactions for analytics, balance, etc.
      return await localStorageManager.getAllTransactions();
    
    case "/api/categories":
      // Check if type parameter is provided
      if (params.length > 0 && params[0] && typeof params[0] === 'string') {
        return await localStorageManager.getCategoriesByType(params[0] as 'income' | 'expense');
      }
      return await localStorageManager.getCategories();
    
    case "/api/balance":
      return await localStorageManager.getBalance();
    
    case "/api/analytics":
      return await localStorageManager.getAnalytics();
    
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
};

// API request function for mutations using localStorage
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  
  switch (url) {
    case "/api/transactions":
      if (method === "POST" && data) {
        return await localStorageManager.createTransaction(data as any);
      }
      break;
    
    case "/api/categories":
      if (method === "POST" && data) {
        return await localStorageManager.createCategory(data as any);
      }
      break;
    
    default:
      // Handle dynamic URLs like /api/transactions/:id
      if (url.startsWith("/api/transactions/")) {
        const id = url.split("/").pop();
        if (id) {
          if (method === "GET") {
            return await localStorageManager.getTransaction(id);
          } else if (method === "PUT" && data) {
            return await localStorageManager.updateTransaction(id, data as any);
          } else if (method === "DELETE") {
            return await localStorageManager.deleteTransaction(id);
          }
        }
      }
      throw new Error(`Unsupported API call: ${method} ${url}`);
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes for most data
      gcTime: 1000 * 60 * 30, // 30 minutes cache (was cacheTime in v4)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Specialized cache settings for different data types
export const analyticsQueryOptions = {
  staleTime: 1000 * 60 * 2, // 2 minutes for analytics (changes more frequently)
  gcTime: 1000 * 60 * 10, // 10 minutes cache (was cacheTime in v4)
};

export const transactionsQueryOptions = {
  staleTime: 1000 * 60 * 1, // 1 minute for transactions (real-time updates)
  gcTime: 1000 * 60 * 15, // 15 minutes cache (was cacheTime in v4)
};

export const categoriesQueryOptions = {
  staleTime: 1000 * 60 * 60, // 1 hour for categories (rarely change)
  gcTime: 1000 * 60 * 60 * 2, // 2 hours cache (was cacheTime in v4)
};
