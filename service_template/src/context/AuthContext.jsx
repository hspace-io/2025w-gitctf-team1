import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // 페이지 로드 시 로그인 상태 복원 기능 제거 (처음 들어갔을 때 로그인되지 않은 상태로 시작)
  // useEffect(() => {
  //   const currentUser = localStorage.getItem('current_user');
  //   const token = localStorage.getItem('token');
  //   
  //   if (currentUser && token) {
  //     try {
  //       setUser(JSON.parse(currentUser));
  //       setIsLoggedIn(true);
  //     } catch (err) {
  //       console.error('Failed to restore login state:', err);
  //       localStorage.removeItem('current_user');
  //       localStorage.removeItem('token');
  //     }
  //   }
  // }, []);

  // API 교체: 로그인
  // POST /auth/login (username, password)
  // API에서 받은 사용자 정보를 저장
  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('current_user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

