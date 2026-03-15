import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Add debugging
  console.log('useAuth hook:', { user, isLoading, error, isAuthenticated: !!user });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}