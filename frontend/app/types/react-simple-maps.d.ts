// react-simple-maps không ship type declarations và dự án không cài @types/react-simple-maps
// → khai báo tối thiểu để import được từ file .tsx; props để any có chủ đích.
declare module 'react-simple-maps' {
  import * as React from 'react';

  export const ComposableMap: React.ComponentType<any>;
  export const Geographies: React.ComponentType<any>;
  export const Geography: React.ComponentType<any>;
}
