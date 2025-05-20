
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Types for the data structure from Supabase
export interface ApiCategory {
  id: string;
  name: string;
  color: string;
}

export interface ApiStats {
  id: string;
  api_id: string;
  total_calls: number;
  last_week_calls: number;
  uptime: number;
  response_time: number;
  updated_at: string;
}

export interface ApiEndpoint {
  id: string;
  api_id: string;
  path: string;
  method: string;
  description: string;
  created_at: string;
}

export interface Api {
  id: string;
  name: string;
  description: string;
  version: string;
  owner: string;
  base_url: string;
  documentation_url: string | null;
  category_id: string;
  tags: string[];
  auth_type: 'apiKey' | 'oauth2' | 'none';
  auth_description: string | null;
  created_at: string;
  updated_at: string;
  // These fields are not directly from the table but will be populated
  category?: ApiCategory;
  stats?: ApiStats;
  endpoints?: ApiEndpoint[];
}

// Fetch all API categories
export const fetchApiCategories = async (): Promise<ApiCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('api_categories')
      .select('*');
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching API categories:', error);
    toast({
      title: "Error",
      description: "Failed to fetch API categories",
      variant: "destructive",
    });
    return [];
  }
};

// Fetch all APIs with related data (category, stats, endpoints)
export const fetchApis = async (): Promise<Api[]> => {
  try {
    // First, fetch all APIs
    const { data: apisData, error: apisError } = await supabase
      .from('apis')
      .select('*');
    
    if (apisError) {
      throw new Error(apisError.message);
    }
    
    if (!apisData || apisData.length === 0) {
      return [];
    }
    
    // Fetch all categories
    const { data: categoriesData } = await supabase
      .from('api_categories')
      .select('*');
    
    // Create a map for quick lookup
    const categoriesMap = categoriesData ? 
      Object.fromEntries(categoriesData.map(cat => [cat.id, cat])) : {};
    
    // Fetch all stats
    const { data: statsData } = await supabase
      .from('api_stats')
      .select('*');
    
    // Create a map for quick lookup
    const statsMap = statsData ? 
      Object.fromEntries(statsData.map(stat => [stat.api_id, stat])) : {};
    
    // Fetch all endpoints
    const { data: endpointsData } = await supabase
      .from('api_endpoints')
      .select('*');
    
    // Group endpoints by api_id
    const endpointsMap: Record<string, ApiEndpoint[]> = {};
    if (endpointsData) {
      endpointsData.forEach(endpoint => {
        if (!endpointsMap[endpoint.api_id]) {
          endpointsMap[endpoint.api_id] = [];
        }
        endpointsMap[endpoint.api_id].push(endpoint as ApiEndpoint);
      });
    }
    
    // Combine all data and ensure correct types
    const apis = apisData.map(api => ({
      ...api,
      auth_type: (api.auth_type as 'apiKey' | 'oauth2' | 'none') || 'none',
      category: categoriesMap[api.category_id],
      stats: statsMap[api.id],
      endpoints: endpointsMap[api.id] || []
    })) as Api[];
    
    return apis;
  } catch (error) {
    console.error('Error fetching APIs:', error);
    toast({
      title: "Error",
      description: "Failed to fetch APIs data",
      variant: "destructive",
    });
    return [];
  }
};

// Fetch a single API by ID
export const fetchApiById = async (id: string): Promise<Api | null> => {
  try {
    // Fetch the API
    const { data: api, error: apiError } = await supabase
      .from('apis')
      .select('*')
      .eq('id', id)
      .single();
    
    if (apiError) {
      throw new Error(apiError.message);
    }
    
    if (!api) {
      return null;
    }
    
    // Fetch the category
    const { data: category } = await supabase
      .from('api_categories')
      .select('*')
      .eq('id', api.category_id)
      .single();
    
    // Fetch the stats
    const { data: stats } = await supabase
      .from('api_stats')
      .select('*')
      .eq('api_id', api.id)
      .maybeSingle();
    
    // Fetch the endpoints
    const { data: endpoints } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('api_id', api.id);
    
    // Combine all data and ensure correct types
    return {
      ...api,
      auth_type: (api.auth_type as 'apiKey' | 'oauth2' | 'none') || 'none',
      category,
      stats,
      endpoints: endpoints || []
    } as Api;
  } catch (error) {
    console.error(`Error fetching API with ID ${id}:`, error);
    toast({
      title: "Error",
      description: `Failed to fetch API with ID ${id}`,
      variant: "destructive",
    });
    return null;
  }
};

// Create a new API and its related data
export const createApi = async (
  apiData: Omit<Api, 'id' | 'created_at' | 'updated_at' | 'category' | 'stats' | 'endpoints'> & {
    stats?: Omit<ApiStats, 'id' | 'api_id' | 'updated_at'>;
    endpoints?: Omit<ApiEndpoint, 'id' | 'api_id' | 'created_at'>[];
  }
): Promise<Api | null> => {
  try {
    // Start a transaction
    const { data: api, error: apiError } = await supabase
      .from('apis')
      .insert({
        name: apiData.name,
        description: apiData.description,
        base_url: apiData.base_url,
        version: apiData.version,
        documentation_url: apiData.documentation_url,
        owner: apiData.owner,
        category_id: apiData.category_id,
        tags: apiData.tags,
        auth_type: apiData.auth_type,
        auth_description: apiData.auth_description,
      })
      .select()
      .single();
    
    if (apiError) {
      throw new Error(apiError.message);
    }
    
    // Create stats
    if (apiData.stats) {
      const { error: statsError } = await supabase
        .from('api_stats')
        .insert({
          api_id: api.id,
          total_calls: apiData.stats.total_calls,
          last_week_calls: apiData.stats.last_week_calls,
          uptime: apiData.stats.uptime,
          response_time: apiData.stats.response_time,
        });
      
      if (statsError) {
        throw new Error(statsError.message);
      }
    } else {
      // Create default stats
      const { error: statsError } = await supabase
        .from('api_stats')
        .insert({
          api_id: api.id,
        });
      
      if (statsError) {
        throw new Error(statsError.message);
      }
    }
    
    // Create endpoints
    if (apiData.endpoints && apiData.endpoints.length > 0) {
      const endpoints = apiData.endpoints.map(endpoint => ({
        api_id: api.id,
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
      }));
      
      const { error: endpointsError } = await supabase
        .from('api_endpoints')
        .insert(endpoints);
      
      if (endpointsError) {
        throw new Error(endpointsError.message);
      }
    }
    
    // Return the newly created API with all related data
    return await fetchApiById(api.id);
  } catch (error) {
    console.error('Error creating API:', error);
    toast({
      title: "Error",
      description: "Failed to create API",
      variant: "destructive",
    });
    return null;
  }
};

// Dashboard metrics calculation
export const getDashboardMetrics = async () => {
  try {
    // Fetch all APIs with their related data
    const apis = await fetchApis();
    
    // Calculate metrics
    const totalApis = apis.length;
    const totalApiCalls = apis.reduce((sum, api) => sum + (api.stats?.total_calls || 0), 0);
    
    // Calculate APIs created in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newApisLastMonth = apis.filter(api => 
      new Date(api.created_at) > oneMonthAgo
    ).length;
    
    // Calculate popular categories
    const categoryCounts: Record<string, { name: string, count: number }> = {};
    apis.forEach(api => {
      if (api.category) {
        if (!categoryCounts[api.category.id]) {
          categoryCounts[api.category.id] = { name: api.category.name, count: 0 };
        }
        categoryCounts[api.category.id].count++;
      }
    });
    
    const popularCategories = Object.values(categoryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ name, count }) => ({
        name,
        percentage: Math.round((count / totalApis) * 100)
      }));
    
    // Sort APIs by total calls to get top APIs
    const topApis = [...apis]
      .sort((a, b) => (b.stats?.total_calls || 0) - (a.stats?.total_calls || 0))
      .slice(0, 3)
      .map(api => ({
        id: api.id,
        name: api.name,
        calls: api.stats?.total_calls || 0,
        uptime: api.stats?.uptime || 99.9,
      }));
    
    // Mock data for API calls over time (this would typically come from a time-series table)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const apiCallsOverTime = months.map((month, index) => ({
      month,
      calls: 800000 + index * 150000 + Math.floor(Math.random() * 100000)
    }));
    
    return {
      totalApis,
      totalApiCalls,
      newApisLastMonth,
      activeUsers: Math.floor(Math.random() * 1000) + 1000, // Mock data for active users
      popularCategories,
      apiCallsOverTime,
      topApis,
    };
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    toast({
      title: "Error",
      description: "Failed to calculate dashboard metrics",
      variant: "destructive",
    });
    return null;
  }
};
