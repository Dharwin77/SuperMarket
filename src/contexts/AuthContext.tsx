import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
}

interface StoreDetails {
  storeName: string;
  gstNumber: string;
  storeAddress: string;
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  storeDetails: StoreDetails;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateStoreDetails: (details: StoreDetails) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default store details
const defaultStoreDetails: StoreDetails = {
  storeName: 'SuperMarket',
  gstNumber: '29ABCDE1234F1Z5',
  storeAddress: '123 Main Street, City, State - 123456',
  username: 'admin',
  password: 'admin123',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [storeDetails, setStoreDetails] = useState<StoreDetails>(defaultStoreDetails);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedStoreDetails = localStorage.getItem('storeDetails');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (savedStoreDetails) {
      setStoreDetails(JSON.parse(savedStoreDetails));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Validate credentials against store details
    if (username === storeDetails.username && password === storeDetails.password) {
      const userData = { username };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateStoreDetails = (details: StoreDetails) => {
    setStoreDetails(details);
    localStorage.setItem('storeDetails', JSON.stringify(details));
    
    // Update user if username changed
    if (user && details.username !== user.username) {
      const updatedUser = { username: details.username };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        storeDetails,
        login,
        logout,
        updateStoreDetails,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
