// Permission hook for Vite-based React app

export function usePermissions() {
  const user = (typeof window !== 'undefined') 
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;
  
  const hasPermission = (code: string) => {
    if (!user) return false;
    
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(code);
    }
    
    if (user.role === 'ADMIN') return true;
    
    return false;
  };

  return { hasPermission, user };
}
