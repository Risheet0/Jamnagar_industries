import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NavigationContextType {
  currentPath: string;
  navigate: (path: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openQuickAdd: (defaultType?: string) => void;
  isQuickAddOpen: boolean;
  quickAddType: string | null;
  closeQuickAdd: () => void;
  openGlobalSearch: () => void;
  isGlobalSearchOpen: boolean;
  closeGlobalSearch: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial path from hash or default to /dashboard
  const getInitialPath = () => {
    const hash = window.location.hash.slice(1);
    return hash && hash.startsWith('/') ? hash : '/dashboard';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddType, setQuickAddType] = useState<string | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Sync state with hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const path = hash && hash.startsWith('/') ? hash : '/dashboard';
      setCurrentPath(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = '/dashboard';
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const openQuickAdd = useCallback((defaultType?: string) => {
    setQuickAddType(defaultType || null);
    setIsQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
    setQuickAddType(null);
  }, []);

  const openGlobalSearch = useCallback(() => {
    setIsGlobalSearchOpen(true);
  }, []);

  const closeGlobalSearch = useCallback(() => {
    setIsGlobalSearchOpen(false);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        navigate,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        openQuickAdd,
        isQuickAddOpen,
        quickAddType,
        closeQuickAdd,
        openGlobalSearch,
        isGlobalSearchOpen,
        closeGlobalSearch,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
