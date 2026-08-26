import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  userName: string;
  userEmail: string;
  updateProfile: (name: string, email: string) => void;
}

const DEFAULT_NAME = localStorage.getItem('indycomply_user_name') || 'Ray Woo';
const DEFAULT_EMAIL = localStorage.getItem('indycomply_user_email') || 'wooray2882@gmail.com';

const UserContext = createContext<UserProfile | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string>(DEFAULT_NAME);
  const [userEmail, setUserEmail] = useState<string>(DEFAULT_EMAIL);

  const updateProfile = (name: string, email: string) => {
    const cleanName = name.trim() || 'Ray Woo';
    const cleanEmail = email.trim() || 'wooray2882@gmail.com';
    
    setUserName(cleanName);
    setUserEmail(cleanEmail);
    
    localStorage.setItem('indycomply_user_name', cleanName);
    localStorage.setItem('indycomply_user_email', cleanEmail);
  };

  return (
    <UserContext.Provider value={{ userName, userEmail, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserProfile => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
