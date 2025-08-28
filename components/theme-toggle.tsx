'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="rounded-2xl px-3 py-2 border"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
