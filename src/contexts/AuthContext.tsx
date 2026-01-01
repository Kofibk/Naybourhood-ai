import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'agent' | 'broker';
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUserRole: (role: User['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for login
const demoUsers: Record<string, User> = {
  'admin@naybourhood.ai': { id: 'U001', name: 'Kofi', email: 'admin@naybourhood.ai', role: 'admin' },
  'developer@test.com': { id: 'U002', name: 'John Smith', email: 'developer@test.com', role: 'developer', company: 'Berkeley Group' },
  'agent@test.com': { id: 'U003', name: 'Michael Davies', email: 'agent@test.com', role: 'agent', company: 'JLL' },
  'broker@test.com': { id: 'U004', name: 'Lisa Green', email: 'broker@test.com', role: 'broker', company: 'Tudor Financial' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('naybourhood_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Demo login - accept any password
    const demoUser = demoUsers[email.toLowerCase()];
    if (demoUser) {
      setUser(demoUser);
      localStorage.setItem('naybourhood_user', JSON.stringify(demoUser));
      return true;
    }
    // For demo, create user from email
    const newUser: User = {
      id: 'U999',
      name: email.split('@')[0],
      email: email,
      role: 'developer',
    };
    setUser(newUser);
    localStorage.setItem('naybourhood_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('naybourhood_user');
  };

  const setUserRole = (role: User['role']) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('naybourhood_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, setUserRole }}>
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
