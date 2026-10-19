import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          bg: 'rgb(var(--color-muted-bg) / <alpha-value>)',
        },
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Fira Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
