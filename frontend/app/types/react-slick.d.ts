// react-slick không ship type declarations và dự án không cài @types/react-slick
// → khai báo tối thiểu để import được từ file .tsx; props để any có chủ đích.
declare module 'react-slick' {
  import * as React from 'react';

  const Slider: React.ComponentType<any>;
  export default Slider;
}
