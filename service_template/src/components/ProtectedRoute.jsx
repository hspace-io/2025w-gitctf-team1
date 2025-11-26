import { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    if (!isLoggedIn && !hasShownAlert.current) {
      // 로그인하지 않은 경우 alert 표시 (한 번만)
      hasShownAlert.current = true;
      alert('로그인 후 이용해주세요.');
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    // 로그인하지 않은 경우 기본 페이지로 리다이렉트
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

