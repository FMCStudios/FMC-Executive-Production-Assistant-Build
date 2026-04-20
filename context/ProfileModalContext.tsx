'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type Ctx = {
  isOpen: boolean;
  editingEmail: string | null;
  open: (email?: string) => void;
  close: () => void;
};

const ProfileModalContext = createContext<Ctx>({
  isOpen: false,
  editingEmail: null,
  open: () => {},
  close: () => {},
});

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  return (
    <ProfileModalContext.Provider
      value={{
        isOpen,
        editingEmail,
        open: (email?: string) => {
          setEditingEmail(email?.trim() ? email.trim() : null);
          setIsOpen(true);
        },
        close: () => {
          setIsOpen(false);
          setEditingEmail(null);
        },
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  return useContext(ProfileModalContext);
}
