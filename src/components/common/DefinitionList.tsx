import React from 'react';

interface DefinitionItem {
  term: string;
  value: React.ReactNode;
  mono?: boolean;
}

interface DefinitionListProps {
  items: DefinitionItem[];
  style?: React.CSSProperties;
}

export const DefinitionList: React.FC<DefinitionListProps> = ({ items, style }) => {
  return (
    <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 0, ...style }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            padding: '10px 0',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <dt style={{ fontSize: 13, color: 'var(--ink-muted)', flexShrink: 0 }}>
            {item.term}
          </dt>
          <dd
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--ink)',
              fontWeight: 500,
              textAlign: 'right',
              fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-sans)',
              letterSpacing: item.mono ? '0.04em' : undefined,
            }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
