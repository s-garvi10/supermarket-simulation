import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { LogOut, RotateCcw, Smartphone, Monitor, Database } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, isMobileFrame, setIsMobileFrame } = useAuth();
  const { resetDemoData, backendStatus } = useDatabase();

  const isDev = import.meta.env.DEV;

  const handleReset = () => {
    if (window.confirm('Reset demo data to initial state?')) resetDemoData();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
      <header style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1072, margin: '0 auto',
          padding: '0 24px',
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Wordmark and DB Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              FreshMart
            </span>
            <div
              title={backendStatus.connected ? `Connected to ${backendStatus.engine.toUpperCase()} database` : 'Backend disconnected, running local mode'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: backendStatus.connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                color: backendStatus.connected ? '#15803d' : '#a16207',
                border: `1px solid ${backendStatus.connected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: backendStatus.connected ? '#22c55e' : '#eab308',
                }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Database size={10} />
                {backendStatus.connected ? backendStatus.engine.toUpperCase() : 'Offline'}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentUser && (
              <>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{currentUser.name}</span>

                {isDev && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', opacity: 0.6 }}>dev</span>
                    {currentUser.role === 'customer' && (
                      <button
                        onClick={() => setIsMobileFrame(!isMobileFrame)}
                        title="Toggle phone frame"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4, display: 'flex' }}
                      >
                        {isMobileFrame ? <Monitor size={14} strokeWidth={1.5} /> : <Smartphone size={14} strokeWidth={1.5} />}
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      title="Reset demo data"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4, display: 'flex' }}
                    >
                      <RotateCcw size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                )}

                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--ink-muted)',
                    padding: '4px 0',
                    transition: 'color var(--transition-fast)',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};
