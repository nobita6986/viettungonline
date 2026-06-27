import { useNavigate, useLocation } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    refresh: () => navigate(0),
    back: () => navigate(-1),
    forward: () => navigate(1),
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}
