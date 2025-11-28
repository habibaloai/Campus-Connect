import React from 'react';

interface TUMLogoProps {
  size?: number;
  className?: string;
}

export default function TUMLogo({ size = 36, className = '' }: TUMLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="40" height="40" fill="#003865"/>
      {/* T - Thick vertical bar with horizontal bar on top, centered */}
      <rect x="7.5" y="10" width="2.5" height="12" fill="white"/>
      <rect x="5" y="10" width="7.5" height="2.5" fill="white"/>
      {/* U - Two vertical bars connected at bottom */}
      <rect x="12.5" y="10" width="2.5" height="10" fill="white"/>
      <rect x="20" y="10" width="2.5" height="10" fill="white"/>
      <rect x="12.5" y="17.5" width="10" height="2.5" fill="white"/>
      {/* M - Two vertical pillars with inverted V connecting them at bottom */}
      <rect x="25.5" y="10" width="2.5" height="12" fill="white"/>
      <rect x="33" y="10" width="2.5" height="12" fill="white"/>
      <polygon points="25.5,10 28.75,15 32,10" fill="white"/>
      <polygon points="28.75,15 28.75,22 25.5,22" fill="white"/>
      <polygon points="32,10 28.75,15 28.75,22 32,22" fill="white"/>
    </svg>
  );
}

