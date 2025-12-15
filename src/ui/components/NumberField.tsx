import React from 'react';

export function NumberField(props: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>
        {props.label}
        {props.children}
      </div>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        step={props.step ?? 1}
        min={props.min}
        max={props.max}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        style={{ 
          width: '100%', 
          padding: '10px 12px', 
          borderRadius: 8, 
          border: '1px solid #dee2e6',
          fontSize: 14,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          outline: 'none'
        }}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
      />
    </label>
  );
}
