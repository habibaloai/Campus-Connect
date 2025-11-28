import React from 'react';
import Svg, { Rect, Polygon } from 'react-native-svg';

interface TUMLogoProps {
  size?: number;
}

export default function TUMLogo({ size = 40 }: TUMLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" preserveAspectRatio="xMidYMid meet">
      <Rect width="40" height="40" fill="#003865" />
      {/* T - Thick vertical bar with horizontal bar on top, centered */}
      <Rect x="7.5" y="10" width="2.5" height="12" fill="white" />
      <Rect x="5" y="10" width="7.5" height="2.5" fill="white" />
      {/* U - Two vertical bars connected at bottom */}
      <Rect x="12.5" y="10" width="2.5" height="10" fill="white" />
      <Rect x="20" y="10" width="2.5" height="10" fill="white" />
      <Rect x="12.5" y="17.5" width="10" height="2.5" fill="white" />
      {/* M - Two vertical pillars with inverted V connecting them at bottom */}
      <Rect x="25.5" y="10" width="2.5" height="12" fill="white" />
      <Rect x="33" y="10" width="2.5" height="12" fill="white" />
      <Polygon points="25.5,10 28.75,15 32,10" fill="white" />
      <Polygon points="28.75,15 28.75,22 25.5,22" fill="white" />
      <Polygon points="32,10 28.75,15 28.75,22 32,22" fill="white" />
    </Svg>
  );
}

