import React from 'react';

export function SelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>
        {props.label}
        {props.children}
      </div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '10px 12px', 
          borderRadius: 8, 
          border: '1px solid #dee2e6',
          fontSize: 14,
          backgroundColor: 'white',
          cursor: 'pointer',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
