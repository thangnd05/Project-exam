declare module 'react-slick' {
  import * as React from 'react';

  // Chỉ khai báo các tuỳ chọn app đang dùng (xem PostDetail); bổ sung khi cần.
  export interface Settings {
    dots?: boolean;
    infinite?: boolean;
    speed?: number;
    slidesToShow?: number;
    slidesToScroll?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    arrows?: boolean;
    className?: string;
    responsive?: Array<{ breakpoint: number; settings: 'unslick' | Settings }>;
    children?: React.ReactNode;
  }

  const Slider: React.ComponentType<Settings>;
  export default Slider;
}
