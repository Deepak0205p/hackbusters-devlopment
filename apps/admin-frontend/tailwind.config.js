/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        geist: {
          bg: {
            100: '#ffffff',
            200: '#f8f9fa',
          },
          gray: {
            100: '#f1f3f5',
            200: '#e9ecef',
            300: '#dee2e6',
            400: '#e5e7eb',
            500: '#d1d5db',
            600: '#9ca3af',
            700: '#6b7280',
            800: '#4b5563',
            900: '#111827',
            1000: '#030712',
          },
          blue: {
            DEFAULT: '#0070f3',
            subtle: 'rgba(0, 112, 243, 0.08)',
            hover: '#0060df',
          },
          green: {
            DEFAULT: '#00e599',
            subtle: 'rgba(0, 229, 153, 0.08)',
          },
          amber: {
            DEFAULT: '#f5a623',
            subtle: 'rgba(245, 166, 35, 0.08)',
          },
          red: {
            DEFAULT: '#e5484d',
            subtle: 'rgba(229, 72, 77, 0.08)',
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        sm: '4px',
      },
      transitionTimingFunction: {
        'geist-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }
    },
  },
  plugins: [],
}
