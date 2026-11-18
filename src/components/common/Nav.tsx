import React from 'react';

interface NavItem {
  id: string;
  label: string;
}

interface NavProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
}

export const Nav: React.FC<NavProps> = ({ items, activeId, onChange, style }) => {
  return (
    <nav
      aria-label="Section navigation"
      style={{ display: 'flex', gap: 24, alignItems: 'center', ...style }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
              fontWeight: isActive ? 500 : 400,
              padding: '8px 0',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              lineHeight: 1,
              minHeight: 44,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--ink-muted)'; }}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
