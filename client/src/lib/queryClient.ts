import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localStorageManager } from "./localStorage-storage";

// localStorage-based query function
export const getQueryFn = (): QueryFunction<any> => async ({ queryKey }) => {
  const [endpoint, ...params] = queryKey as [string, ...any[]];
  
  switch (endpoint) {
    case "/api/transactions":
      return await localStorageManager.getTransactions();
    
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
