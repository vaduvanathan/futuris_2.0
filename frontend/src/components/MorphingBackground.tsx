import React, { useEffect, useRef } from 'react';

const MorphingBackground: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -2,
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, #003B00 0%, #0D0208 100%)',
    }}>
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.4,
        }}
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00FF41', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#008F11', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <g>
            <path fill="url(#grad1)">
                <animate 
                    attributeName="d" 
                    dur="20s" 
                    repeatCount="indefinite"
                    values="
                    M800,500Q800,800,500,800Q200,800,200,500Q200,200,500,200Q800,200,800,500Z;
                    M750,550Q700,850,500,850Q250,850,250,550Q250,250,500,250Q750,250,750,550Z;
                    M850,450Q850,750,500,750Q150,750,150,450Q150,150,500,150Q850,150,850,450Z;
                    M800,500Q800,800,500,800Q200,800,200,500Q200,200,500,200Q800,200,800,500Z"
                />
            </path>
        </g>
      </svg>
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.2,
          transform: 'rotate(180deg)',
        }}
      >
         <g>
            <path fill="#008F11">
                <animate 
                    attributeName="d" 
                    dur="25s" 
                    repeatCount="indefinite"
                    values="
                    M900,500Q900,900,500,900Q100,900,100,500Q100,100,500,100Q900,100,900,500Z;
                    M850,550Q850,850,500,850Q150,850,150,550Q150,150,500,150Q850,150,850,550Z;
                    M950,450Q950,950,500,950Q50,950,50,450Q50,50,500,50Q950,50,950,450Z;
                    M900,500Q900,900,500,900Q100,900,100,500Q100,100,500,100Q900,100,900,500Z"
                />
            </path>
        </g>
      </svg>
    </div>
  );
};

export default MorphingBackground;
