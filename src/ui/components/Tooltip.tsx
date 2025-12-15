import React, { useState } from 'react';

interface TooltipProps {
  title: string;
  description: string;
  formula?: string;
  units?: string;
  relationships?: string[];
  children?: React.ReactNode;
}

export function Tooltip(props: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          border: '1.5px solid #667eea',
          background: 'white',
          color: '#667eea',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
          padding: 0,
          verticalAlign: 'middle',
        }}
      >
        ?
      </button>
      {show && (
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: -8,
            zIndex: 1000,
            background: 'white',
            border: '2px solid #667eea',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            width: 320,
            fontSize: 13,
            lineHeight: 1.5,
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <div style={{ fontWeight: 700, color: '#212529', marginBottom: 8, fontSize: 14 }}>
            {props.title}
          </div>
          
          <div style={{ color: '#495057', marginBottom: props.formula ? 8 : 0 }}>
            {props.description}
          </div>

          {props.units && (
            <div style={{ 
              color: '#6c757d', 
              fontSize: 12, 
              marginTop: 6,
              padding: 6,
              background: '#f8f9fa',
              borderRadius: 6,
              fontFamily: 'monospace'
            }}>
              <strong>Units:</strong> {props.units}
            </div>
          )}

          {props.formula && (
            <div style={{ 
              marginTop: 8, 
              padding: 10,
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e9ecef',
            }}>
              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4, fontWeight: 600 }}>
                FORMULA:
              </div>
              <code style={{ 
                fontSize: 12, 
                color: '#667eea',
                fontFamily: 'monospace',
                display: 'block',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {props.formula}
              </code>
            </div>
          )}

          {props.relationships && props.relationships.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6, fontWeight: 600 }}>
                RELATIONSHIPS:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#495057', fontSize: 12 }}>
                {props.relationships.map((rel, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{rel}</li>
                ))}
              </ul>
            </div>
          )}

          {props.children}
        </div>
      )}
    </span>
  );
}
