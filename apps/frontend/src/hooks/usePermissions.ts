import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  
  // Note: For a robust RBAC, permissions should be injected into the session JWT.
  // Assuming 'ADMIN' role has all permissions for now, 
  // or reading from session.user.permissions if you add them later.
  const user = session?.user as any;
  
  const hasPermission = (code: string) => {
    if (!user) return false;
    
    // If you add permissions to JWT later, check them here:
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(code);
    }
    
    // Fallback based on role
    if (user.role === 'ADMIN') return true;
    
    // Explicit checks can be added here
    return false;
  };

  return { hasPermission };
}
