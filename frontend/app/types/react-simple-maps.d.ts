declare module 'react-simple-maps' {
  import * as React from 'react';

  // Feature GeoJSON đã được thư viện gắn rsmKey; properties lấy từ file topojson (vd world-atlas có name).
  export interface GeographyFeature {
    rsmKey: string;
    type?: string;
    id?: string | number;
    properties: { name?: string; [key: string]: unknown };
    geometry?: unknown;
  }

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
    };
    width?: number;
    height?: number;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: GeographyFeature[] }) => React.ReactNode;
    className?: string;
  }

  export interface GeographyProps extends Omit<React.SVGProps<SVGPathElement>, 'style'> {
    geography: GeographyFeature;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export const ComposableMap: React.ComponentType<ComposableMapProps>;
  export const Geographies: React.ComponentType<GeographiesProps>;
  export const Geography: React.ComponentType<GeographyProps>;
}
