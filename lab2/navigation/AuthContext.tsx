import React, { createContext, useState, useContext, ReactNode } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

interface AuthContextType {
  userToken: string | null;
  userRole: 'customer' | 'admin' | null; // Thêm userRole nếu cần phân quyền
  signIn: (token: string, role: 'customer' | 'admin') => void;
  signOut: () => Promise<void>;
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

  const signOut = async () => {
    try {
      // Đăng xuất Firebase
      await auth().signOut();
      // Đăng xuất Google (nếu đã đăng nhập bằng Google)
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Không cần xử lý lỗi nếu chưa đăng nhập Google
        console.log('Google sign out info:', googleError);
      }
    } catch (error) {
      console.log('Error signing out:', error);
    } finally {
      // Luôn xóa state local
      setUserToken(null);
      setUserRole(null);
    }
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
