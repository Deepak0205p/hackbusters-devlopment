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
            100: '#000000',
            200: '#0a0a0a',
          },
          gray: {
            100: '#111111',
            200: '#171717',
            300: '#1f1f1f',
            400: '#262626',
            500: '#333333',
            600: '#444444',
            700: '#888888',
            800: '#a1a1aa',
            900: '#ededed',
            1000: '#ffffff',
          },
          blue: {
            DEFAULT: '#0070f3',
            subtle: 'rgba(0, 112, 243, 0.1)',
            hover: '#0060df',
          },
          green: {
            DEFAULT: '#00e599',
            subtle: 'rgba(0, 229, 153, 0.1)',
          },
          amber: {
            DEFAULT: '#f5a623',
            subtle: 'rgba(245, 166, 35, 0.1)',
          },
          red: {
            DEFAULT: '#e5484d',
            subtle: 'rgba(229, 72, 77, 0.1)',
          }
        },
        gemini: {
          canvas: '#131314',
          sidebar: '#1e1f20',
          elevated: '#282a2c',
          border: '#3c4043',
          borderSubtle: '#2a2b2d',
          text: '#e3e3e3',
          textMuted: '#9aa0a6',
          accent: '#a8c7fa',
          accentHover: '#c2e7ff',
          accentGlow: 'rgba(168, 199, 250, 0.12)',
          userBubble: '#282a2c',
          sparkle: '#a8c7fa',
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
