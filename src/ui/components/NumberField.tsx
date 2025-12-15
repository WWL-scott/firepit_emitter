import React from 'react';

export function NumberField(props: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: '#555' }}>{props.label}</div>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        step={props.step ?? 1}
        min={props.min}
        max={props.max}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
      />
    </label>
  );
}
