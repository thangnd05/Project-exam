// Flat config — Next 16 đã bỏ lệnh `next lint`, nay chạy thẳng ESLint CLI (`pnpm lint`).
// eslint-config-next 16 yêu cầu eslint 9 (eslint-plugin-react 7.x chưa chạy được trên eslint 10).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // ---- Nợ kỹ thuật từ đợt migrate JS→TS + React 19: hạ xuống warn để `pnpm lint`
      // còn đọc được, dọn dần rồi nâng lại thành 'error'. Số liệu lần đo đầu (15/08/2026).
      '@typescript-eslint/no-explicit-any': 'warn', // 328 chỗ
      'react-hooks/set-state-in-effect': 'warn', // 68 chỗ — setState trong effect
      'react-hooks/refs': 'warn', // 5 chỗ — đọc ref lúc render
      'react-hooks/immutability': 'warn', // 4 chỗ — dùng biến trước khi khai báo
      'react-hooks/static-components': 'warn', // 2 chỗ — định nghĩa component trong render
      'react-hooks/preserve-manual-memoization': 'warn', // 1 chỗ

      // Copy tiếng Việt đầy nháy đơn/kép, rule này chỉ tạo nhiễu chứ không bắt được lỗi thật.
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
