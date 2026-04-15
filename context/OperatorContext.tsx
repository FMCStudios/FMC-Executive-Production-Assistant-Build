'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { operators, type Operator } from '@/lib/operators';

type OperatorContextType = {
  activeOperator: Operator;
  setOperator: (id: string) => void;
  operatorId: string;
};

const OperatorContext = createContext<OperatorContextType | undefined>(undefined);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operatorId, setOperatorId] = useState('brandon');

  useEffect(() => {
    const stored = localStorage.getItem('epa-operator');
    if (stored && operators[stored]) {
      setOperatorId(stored);
    }
  }, []);

  const setOp = (id: string) => {
    if (operators[id]) {
      setOperatorId(id);
      localStorage.setItem('epa-operator', id);
    }
  };

  const activeOperator = operators[operatorId] || operators.brandon;

  return (
    <OperatorContext.Provider value={{ activeOperator, setOperator: setOp, operatorId }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error('useOperator must be used within OperatorProvider');
  return ctx;
}
