'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type Ctx = { isOpen: boolean; open: () => void; close: () => void };

const ProfileModalContext = createContext<Ctx>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ProfileModalContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  return useContext(ProfileModalContext);
}
