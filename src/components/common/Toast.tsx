import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDatabase();
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            borderLeft: `3px solid ${toast.type === 'error' ? 'var(--error)' : toast.type === 'success' ? 'var(--accent)' : 'var(--ink-muted)'}`,
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 2, display: 'flex', flexShrink: 0 }}
            aria-label="Dismiss notification"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
};
