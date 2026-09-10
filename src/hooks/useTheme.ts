import { useEffect, useState } from 'react';

/**
 * Tema claro/escuro do app: estado + persistência em localStorage +
 * aplicação da classe `dark` no elemento raiz. Extraído de App.tsx —
 * totalmente independente do resto do estado do app.
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ms-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ms-theme', theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
