import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompanyProfile } from '../types';
import { mockCompanyProfile } from '../mock/companyData';

interface CompanyContextType {
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<boolean>;
  refreshCompanyProfile: () => Promise<void>;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const COMPANY_STORAGE_KEY = 'jamnagar_erp_company_profile_v1';

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return {
            ...mockCompanyProfile,
            ...parsed,
            currentUser: {
              ...mockCompanyProfile.currentUser,
              ...(parsed.currentUser || {})
            },
            shiftTiming: {
              ...mockCompanyProfile.shiftTiming,
              ...(parsed.shiftTiming || {})
            }
          };
        }
      }
    } catch {
      // fallback to mockCompanyProfile
    }
    return mockCompanyProfile;
  });

  const [isLoading, setIsLoading] = useState(false);

  const refreshCompanyProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings/company-profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setCompanyProfile(prev => {
            const updated: CompanyProfile = {
              ...prev,
              ...data,
              currentUser: {
                ...prev.currentUser,
                ...(data.currentUser || {})
              },
              shiftTiming: {
                ...prev.shiftTiming,
                ...(data.shiftTiming || {})
              }
            };
            try {
              localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    } catch {
      // offline / standalone mode fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCompanyProfile();
  }, [refreshCompanyProfile]);

  useEffect(() => {
    if (companyProfile.name) {
      document.title = `${companyProfile.name} — Industrial ERP`;
    }
  }, [companyProfile.name]);

  const updateCompanyProfile = useCallback(async (updatedFields: Partial<CompanyProfile>): Promise<boolean> => {
    let newProfile: CompanyProfile = mockCompanyProfile;

    setCompanyProfile(prev => {
      newProfile = {
        ...prev,
        ...updatedFields,
        currentUser: {
          ...prev.currentUser,
          ...(updatedFields.currentUser || {})
        },
        shiftTiming: {
          ...prev.shiftTiming,
          ...(updatedFields.shiftTiming || {})
        }
      };
      try {
        localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(newProfile));
      } catch {}
      return newProfile;
    });

    if (updatedFields.name) {
      document.title = `${updatedFields.name} — Industrial ERP`;
    }

    try {
      const res = await fetch('/api/settings/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProfile.name,
          location: newProfile.location,
          plantAddress: newProfile.plantAddress,
          gstNumber: newProfile.gstNumber,
          phone: newProfile.phone,
          email: newProfile.email,
          currentUser: newProfile.currentUser,
          shiftTiming: newProfile.shiftTiming
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setCompanyProfile(prev => {
            const updated: CompanyProfile = {
              ...prev,
              ...data,
              currentUser: {
                ...prev.currentUser,
                ...(data.currentUser || {})
              },
              shiftTiming: {
                ...prev.shiftTiming,
                ...(data.shiftTiming || {})
              }
            };
            try {
              localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('Backend server not reachable, saved company profile locally:', err);
    }

    return true;
  }, []);

  return (
    <CompanyContext.Provider value={{ companyProfile, updateCompanyProfile, refreshCompanyProfile, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
