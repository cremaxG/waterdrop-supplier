import React, { createContext, useContext, useState } from 'react';

interface LoaderContextType {
  loading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

// External Controller
export const loader = {
  showLoader: () => {},
  hideLoader: () => {},
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeRequests, setActiveRequests] = useState(0);

  const showLoader = () => {
    setActiveRequests(prev => prev + 1);
  };

  const hideLoader = () => {
    setActiveRequests(prev => Math.max(prev - 1, 0)); // Never below 0
  };

  const loading = activeRequests > 0;

  // Attach external control
  loader.showLoader = showLoader;
  loader.hideLoader = hideLoader;

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = (): LoaderContextType => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};
