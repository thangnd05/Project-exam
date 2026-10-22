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
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Link/useRouter/usePathname phải lấy bản giữ ngôn ngữ ở app/i18n/navigation, nếu không link sẽ rơi mất /en.
    // Các file bỏ qua cố ý dùng bản gốc (nút đổi ngôn ngữ, trang 404 nằm ngoài provider của next-intl).
    ignores: [
      'app/i18n/**',
      'app/not-found.tsx',
      'app/components/layouts/Footer/**',
      'app/components/layouts/Header/ThemeToggle/AppearanceMenu.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/link', message: "Dùng Link từ '@/app/i18n/navigation'." },
            {
              name: 'next/navigation',
              importNames: ['useRouter', 'usePathname'],
              message: "Dùng useRouter/usePathname từ '@/app/i18n/navigation'.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
