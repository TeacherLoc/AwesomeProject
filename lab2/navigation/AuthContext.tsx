import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  userToken: string | null;
  userRole: 'customer' | 'admin' | null; // Thêm userRole nếu cần phân quyền
  signIn: (token: string, role: 'customer' | 'admin') => void;
  signOut: () => void;
  isLoading: boolean; // Để xử lý trạng thái tải ban đầu (nếu có)
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children } : { children: ReactNode; }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  React.useEffect(() => {
    setIsLoading(false);
  }, []);

  const signIn = (token: string, role: 'customer' | 'admin') => {
    setUserToken(token);
    setUserRole(role);
  };

  const signOut = () => {
    setUserToken(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
