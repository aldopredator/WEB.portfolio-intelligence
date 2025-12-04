'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioContextType {
  selectedPortfolio: Portfolio | null;
  portfolios: Portfolio[];
  loading: boolean;
  selectPortfolio: (portfolio: Portfolio | null) => void;
  refreshPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      const data = await response.json();
      
      if (data.success) {
        setPortfolios(data.portfolios);
        
        // Auto-select first portfolio if none selected
        if (!selectedPortfolio && data.portfolios.length > 0) {
          const savedPortfolioId = localStorage.getItem('selectedPortfolioId');
          const portfolioToSelect = savedPortfolioId
            ? data.portfolios.find((p: Portfolio) => p.id === savedPortfolioId) || data.portfolios[0]
            : data.portfolios[0];
          setSelectedPortfolio(portfolioToSelect);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const selectPortfolio = (portfolio: Portfolio | null) => {
    setSelectedPortfolio(portfolio);
    if (portfolio) {
      localStorage.setItem('selectedPortfolioId', portfolio.id);
    } else {
      localStorage.removeItem('selectedPortfolioId');
    }
  };

  const refreshPortfolios = async () => {
    await fetchPortfolios();
  };

  return (
    <PortfolioContext.Provider
      value={{
        selectedPortfolio,
        portfolios,
        loading,
        selectPortfolio,
        refreshPortfolios
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
