import {useEffect, useState} from 'react';

// Trả về giá trị trễ `delay` ms so với `value`.
// Dùng cho search server-side để không bắn API mỗi lần gõ phím.
export default function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
