import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: token('secondary'),
        ink: token('ink'),
        accent: token('accent'),
        background: token('background'),
        surface: token('surface'),
        border: token('border'),
        muted: { DEFAULT: token('muted'), bg: token('muted-bg') },
        destructive: token('destructive'),
        ring: token('ring'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(30 27 75 / 0.04), 0 10px 28px -14px rgb(79 70 229 / 0.22)',
        glow: '0 10px 24px -10px rgb(79 70 229 / 0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
