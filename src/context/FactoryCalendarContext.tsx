import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  FactoryCalendarEntry,
  FactoryDayStatus,
  HolidayCategory,
  PlantOperationalConfig
} from '../types';

export interface MonthOperationalSummary {
  totalDays: number;
  openDays: number;
  closedDays: number;
  weeklyOffs: number;
  holidays: number;
  specialWorkingDays: number;
}

export interface FactoryCalendarContextType {
  entries: FactoryCalendarEntry[];
  config: PlantOperationalConfig;
  getFactoryDay: (date: string) => FactoryCalendarEntry;
  setFactoryDayStatus: (
    date: string,
    status: FactoryDayStatus,
    title: string,
    category: HolidayCategory,
    notes?: string
  ) => void;
  declareFactoryClosed: (
    date: string,
    title: string,
    category: HolidayCategory,
    notes?: string
  ) => void;
  declareFactoryOpen: (
    date: string,
    title?: string,
    notes?: string
  ) => void;
  deleteDayOverride: (date: string) => void;
  resetToDefaultHolidays: () => void;
  updateConfig: (newConfig: Partial<PlantOperationalConfig>) => void;
  getMonthSummary: (year: number, month: number) => MonthOperationalSummary;
  getAllHolidaysForYear: (year: number) => FactoryCalendarEntry[];
  refreshCalendar?: () => Promise<void>;
}

const FACTORY_CALENDAR_STORAGE_KEY = 'jamnagar_erp_factory_calendar_v1';
const PLANT_CONFIG_STORAGE_KEY = 'jamnagar_erp_plant_config_v1';

export const DEFAULT_PLANT_CONFIG: PlantOperationalConfig = {
  defaultWeeklyOffDay: 5, // 5 = Friday (Standard for Jamnagar Brass & Engineering Sector)
  weeklyOffTitle: 'Friday Factory Weekly Off',
  standardShiftTimings: 'Day Shift: 8:00 AM - 8:00 PM (12h)'
};

// Gujarat & National Industrial Plant Holidays for 2026
export const DEFAULT_FACTORY_HOLIDAYS_2026: FactoryCalendarEntry[] = [
  {
    id: 'HOL-2026-01-14',
    date: '2026-01-14',
    status: 'Closed',
    title: 'Makar Sankranti / Uttarayan',
    category: 'Festival',
    notes: 'Gujarat state kite festival — factory completely closed',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-01-26',
    date: '2026-01-26',
    status: 'Closed',
    title: 'Republic Day',
    category: 'National Holiday',
    notes: 'National Flag hoisting in morning, plant operations closed',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-03-04',
    date: '2026-03-04',
    status: 'Closed',
    title: 'Holi (Dhuleti)',
    category: 'Festival',
    notes: 'Festival of colors factory holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-05-01',
    date: '2026-05-01',
    status: 'Closed',
    title: 'Gujarat Gaurav Din / Labour Day',
    category: 'National Holiday',
    notes: 'Official state formation & workers day',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-08-15',
    date: '2026-08-15',
    status: 'Closed',
    title: 'Independence Day',
    category: 'National Holiday',
    notes: '79th Independence Day national holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-09-04',
    date: '2026-09-04',
    status: 'Closed',
    title: 'Janmashtami (Lord Krishna Birth)',
    category: 'Festival',
    notes: 'Major Saurashtra cultural festival — brass foundry shutdown',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-10-02',
    date: '2026-10-02',
    status: 'Closed',
    title: 'Mahatma Gandhi Jayanti',
    category: 'National Holiday',
    notes: 'Porbandar / Gujarat national remembrance day',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-10-20',
    date: '2026-10-20',
    status: 'Closed',
    title: 'Dussehra / Vijaya Dashami (Shastra Puja)',
    category: 'Festival',
    notes: 'Plant machinery & tools Puja at 10:00 AM, production off',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-08',
    date: '2026-11-08',
    status: 'Closed',
    title: 'Diwali (Deepavali Plant Shutdown)',
    category: 'Festival',
    notes: 'Diwali foundry maintenance & vacation shutdown',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-09',
    date: '2026-11-09',
    status: 'Closed',
    title: 'Nutan Varsh (Gujarati New Year)',
    category: 'Festival',
    notes: 'Bestu Varas annual new year',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-10',
    date: '2026-11-10',
    status: 'Closed',
    title: 'Bhai Dooj (Bhai Bij)',
    category: 'Festival',
    notes: 'Post-Diwali holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  }
];

const FactoryCalendarContext = createContext<FactoryCalendarContextType | undefined>(undefined);

export const FactoryCalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<FactoryCalendarEntry[]>(() => {
    try {
      const saved = localStorage.getItem(FACTORY_CALENDAR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_FACTORY_HOLIDAYS_2026;
  });

  const [config, setConfig] = useState<PlantOperationalConfig>(() => {
    try {
      const saved = localStorage.getItem(PLANT_CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_PLANT_CONFIG;
  });

  const fetchCalendar = useCallback(async () => {
    try {
      const [entriesRes, configRes] = await Promise.all([
        fetch('/api/calendar/entries', { credentials: 'include' }),
        fetch('/api/calendar/config', { credentials: 'include' })
      ]);

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        if (Array.isArray(entriesData)) {
          setEntries(entriesData);
          try {
            localStorage.setItem(FACTORY_CALENDAR_STORAGE_KEY, JSON.stringify(entriesData));
          } catch {}
        }
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData && configData.defaultWeeklyOffDay !== undefined) {
          setConfig(configData);
          try {
            localStorage.setItem(PLANT_CONFIG_STORAGE_KEY, JSON.stringify(configData));
          } catch {}
        }
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const updateConfig = useCallback((newConfig: Partial<PlantOperationalConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...newConfig };
      try {
        localStorage.setItem(PLANT_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch('/api/calendar/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newConfig)
    }).catch(err => console.error('Failed to sync calendar config to backend:', err));
  }, []);

  const resetToDefaultHolidays = useCallback(() => {
    setEntries(DEFAULT_FACTORY_HOLIDAYS_2026);
    try {
      localStorage.setItem(FACTORY_CALENDAR_STORAGE_KEY, JSON.stringify(DEFAULT_FACTORY_HOLIDAYS_2026));
    } catch {}

    fetch('/api/calendar/reset-holidays', {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync holiday reset to backend:', err));
  }, []);

  const getFactoryDay = useCallback(
    (date: string): FactoryCalendarEntry => {
      const explicit = entries.find(e => e.date === date);
      if (explicit) {
        return explicit;
      }

      const parts = date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        const dayOfWeek = dateObj.getDay();

        if (dayOfWeek === config.defaultWeeklyOffDay) {
          return {
            id: `CAL-WEEKLY-${date}`,
            date,
            status: 'Closed',
            title: config.weeklyOffTitle || 'Friday Factory Weekly Off',
            category: 'Weekly Off',
            shiftTimings: 'Plant Closed (Weekly Off)',
            notes: 'Standard plant weekly maintenance & rest day',
            isCustomOverride: false
          };
        }
      }

      return {
        id: `CAL-OPEN-${date}`,
        date,
        status: 'Open',
        title: 'Regular Plant Operations',
        category: 'Special Working Day',
        shiftTimings: config.standardShiftTimings,
        isCustomOverride: false
      };
    },
    [entries, config]
  );

  const setFactoryDayStatus = useCallback(
    (
      date: string,
      status: FactoryDayStatus,
      title: string,
      category: HolidayCategory,
      notes?: string
    ) => {
      const entryId = `CAL-CUSTOM-${date}`;
      const newEntry: FactoryCalendarEntry = {
        id: entryId,
        date,
        status,
        title,
        category,
        shiftTimings: status === 'Open' ? config.standardShiftTimings : 'Plant Closed',
        notes,
        isCustomOverride: true,
        declaredBy: 'Plant Manager'
      };

      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== date);
        const next = [...filtered, newEntry];
        try {
          localStorage.setItem(FACTORY_CALENDAR_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      fetch('/api/calendar/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEntry)
      }).catch(err => console.error('Failed to sync calendar override to backend:', err));
    },
    [config.standardShiftTimings]
  );

  const declareFactoryClosed = useCallback(
    (date: string, title: string, category: HolidayCategory, notes?: string) => {
      setFactoryDayStatus(date, 'Closed', title, category, notes);
    },
    [setFactoryDayStatus]
  );

  const declareFactoryOpen = useCallback(
    (date: string, title?: string, notes?: string) => {
      setFactoryDayStatus(
        date,
        'Open',
        title || 'Special Working Day (Production Active)',
        'Special Working Day',
        notes
      );
    },
    [setFactoryDayStatus]
  );

  const deleteDayOverride = useCallback((date: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.date !== date);
      try {
        localStorage.setItem(FACTORY_CALENDAR_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/calendar/override/${date}`, {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync delete override to backend:', err));
  }, []);

  const getMonthSummary = useCallback(
    (year: number, month: number): MonthOperationalSummary => {
      const daysInMonth = new Date(year, month, 0).getDate();
      let openDays = 0;
      let closedDays = 0;
      let weeklyOffs = 0;
      let holidays = 0;
      let specialWorkingDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayInfo = getFactoryDay(dateStr);

        if (dayInfo.status === 'Open') {
          openDays++;
          if (dayInfo.isCustomOverride) {
            specialWorkingDays++;
          }
        } else {
          closedDays++;
          if (dayInfo.category === 'Weekly Off') {
            weeklyOffs++;
          } else {
            holidays++;
          }
        }
      }

      return {
        totalDays: daysInMonth,
        openDays,
        closedDays,
        weeklyOffs,
        holidays,
        specialWorkingDays
      };
    },
    [getFactoryDay]
  );

  const getAllHolidaysForYear = useCallback(
    (year: number): FactoryCalendarEntry[] => {
      const yearStr = String(year);
      return entries
        .filter(e => e.date.startsWith(yearStr) && e.status === 'Closed')
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [entries]
  );

  return (
    <FactoryCalendarContext.Provider
      value={{
        entries,
        config,
        getFactoryDay,
        setFactoryDayStatus,
        declareFactoryClosed,
        declareFactoryOpen,
        deleteDayOverride,
        resetToDefaultHolidays,
        updateConfig,
        getMonthSummary,
        getAllHolidaysForYear,
        refreshCalendar: fetchCalendar
      }}
    >
      {children}
    </FactoryCalendarContext.Provider>
  );
};

export const useFactoryCalendar = (): FactoryCalendarContextType => {
  const context = useContext(FactoryCalendarContext);
  if (!context) {
    throw new Error('useFactoryCalendar must be used within a FactoryCalendarProvider');
  }
  return context;
};
