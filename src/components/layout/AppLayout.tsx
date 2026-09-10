import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { QuickAddModal } from '../common/QuickAddModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--color-bg-base)'
    }}>
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Container Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Fixed Top Header */}
        <Header />

        {/* Scrollable Page Body */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <GlobalSearchModal />
      <QuickAddModal />
    </div>
  );
};
