import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface User {
  userId: number;
  email: string;
  name?: string;
  company_or_school?: string;
  role?: string;
  experience_level?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      // Handle mock token
      const token = localStorage.getItem('access_token');
      if (token === 'mock_token_for_ripple') {
        setUser({ userId: 1, email: 'ripple@gmail.com', name: 'Ripple User' });
        setIsLoading(false);
        return;
      }

      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Bypass for testing
      if (email === 'ripple@gmail.com' && password === '1234567890') {
        const mockToken = 'mock_token_for_ripple';
        localStorage.setItem('access_token', mockToken);
        setUser({ userId: 1, email: 'ripple@gmail.com', name: 'Ripple User' });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/profile');
        return;
      }

      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      await fetchUser();
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate('/profile');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, company_or_school?: string, role?: string) => {
    try {
      await authApi.register(name, email, password, company_or_school, role);
      toast({
        title: "Registration successful",
        description: "Now logging you in...",
      });
      await login(email, password);
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.detail || "Could not create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
