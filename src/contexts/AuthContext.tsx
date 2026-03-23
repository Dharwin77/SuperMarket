import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'cashier' | 'staff';

interface User {
  username: string;
  role: UserRole;
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
  authReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_DEFAULT_PASSWORD = 'admin123';
const CASHIER_DEFAULT_PASSWORD = 'cashier123';
const STAFF_DEFAULT_PASSWORD = 'staff123';

const USERNAME_ALIASES: Record<string, string> = {
  satff: 'staff',
  sttaf: 'staff',
  adimn: 'admin',
  cahsier: 'cashier',
};

// Predefined user credentials with roles
const predefinedUsers = [
  { username: 'admin', password: ADMIN_DEFAULT_PASSWORD, role: 'admin' as UserRole },
  { username: 'cashier', password: CASHIER_DEFAULT_PASSWORD, role: 'cashier' as UserRole },
  { username: 'staff', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole },
  // Cashiers
  { username: '9876543210', password: CASHIER_DEFAULT_PASSWORD, role: 'cashier' as UserRole }, // Priya Sharma
  { username: '9876543211', password: CASHIER_DEFAULT_PASSWORD, role: 'cashier' as UserRole }, // Rahul Kumar
  { username: '9876543212', password: CASHIER_DEFAULT_PASSWORD, role: 'cashier' as UserRole }, // Anita Desai
  // Security Staff
  { username: '9876543214', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Rajesh Gupta
  { username: '9876543215', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Suresh Patel
  { username: '9876543216', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Amit Verma
  // Delivery Staff
  { username: '9876543217', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Sanjay Reddy
  { username: '9876543218', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Ravi Menon
  { username: '9876543219', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Karthik Nair
  // Workers
  { username: '9876543220', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Ramesh Yadav
  { username: '9876543221', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Mohan Lal
  { username: '9876543222', password: STAFF_DEFAULT_PASSWORD, role: 'staff' as UserRole }, // Dinesh Kumar
];

// Default store details
const defaultStoreDetails: StoreDetails = {
  storeName: 'SuperMarket',
  gstNumber: '29ABCDE1234F1Z5',
  storeAddress: '123 Main Street, City, State - 123456',
  username: 'admin',
  password: ADMIN_DEFAULT_PASSWORD,
};

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    const parsed = JSON.parse(savedUser) as Partial<User>;
    if (!parsed.username || !parsed.role) return null;
    if (!['admin', 'cashier', 'staff'].includes(parsed.role)) return null;

    return {
      username: parsed.username,
      role: parsed.role as UserRole,
    };
  } catch {
    return null;
  }
}

function getStoredStoreDetails(): StoreDetails {
  if (typeof window === 'undefined') return defaultStoreDetails;

  try {
    const savedStoreDetails = localStorage.getItem('storeDetails');
    if (!savedStoreDetails) return defaultStoreDetails;

    const parsed = JSON.parse(savedStoreDetails) as StoreDetails;

    // Keep legacy values backward-compatible with current simple defaults.
    if (parsed.username === 'admin' && parsed.password === 'Admin@2026#SM') {
      const migrated = { ...parsed, password: ADMIN_DEFAULT_PASSWORD };
      localStorage.setItem('storeDetails', JSON.stringify(migrated));
      return migrated;
    }

    return parsed;
  } catch {
    return defaultStoreDetails;
  }
}

function normalizeUsername(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function normalizePassword(value: string): string {
  return String(value || '').trim();
}

function getUsernameCandidates(value: string): string[] {
  const base = normalizeUsername(value);
  const aliased = USERNAME_ALIASES[base] ?? base;
  const digitsOnly = aliased.replace(/\D/g, '');
  const candidates = new Set<string>([aliased]);

  if (digitsOnly.length >= 10) {
    candidates.add(digitsOnly);
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      candidates.add(digitsOnly.slice(2));
    }
  }

  return [...candidates];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [storeDetails, setStoreDetails] = useState<StoreDetails>(() => getStoredStoreDetails());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Mark auth as ready after synchronous hydration has completed.
    setAuthReady(true);
  }, []);

  const login = (username: string, password: string): boolean => {
    const usernameCandidates = getUsernameCandidates(username);
    const normalizedPassword = normalizePassword(password);

    // First check predefined users (admin, cashier, staff)
    const predefinedUser = predefinedUsers.find(
      u => usernameCandidates.includes(u.username) && u.password === normalizedPassword
    );
    
    if (predefinedUser) {
      const userData = { username: predefinedUser.username, role: predefinedUser.role };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    // Fallback to custom store credentials (admin role)
    const normalizedStoreUsername = normalizeUsername(storeDetails.username);
    const normalizedStorePassword = normalizePassword(storeDetails.password);
    if (usernameCandidates.includes(normalizedStoreUsername) && normalizedPassword === normalizedStorePassword) {
      const userData = { username: normalizedStoreUsername, role: 'admin' as UserRole };
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
      const updatedUser = { username: details.username, role: user.role };
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
        authReady,
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
