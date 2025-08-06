import { useState, useCallback } from 'react';
import { CODEMIRROR_LANGUAGES } from '../../lib/codemirrorLanguages';

export const useCodeEditorSettings = () => {
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [fontSize, setFontSize] = useState(14);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
  }, []);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  }, []);

  const handleFontSizeChange = useCallback((newFontSize: number) => {
    setFontSize(Math.max(8, Math.min(72, newFontSize)));
  }, []);

  const getLanguageInfo = useCallback(() => {
    return CODEMIRROR_LANGUAGES.find(lang => lang.value === language);
  }, [language]);

  const themes = [
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' }
  ];

  return {
    // State
    language,
    theme,
    fontSize,
    
    // Actions
    handleLanguageChange,
    handleThemeChange,
    handleFontSizeChange,
    
    // Helpers
    getLanguageInfo,
    
    // Constants
    supportedLanguages: CODEMIRROR_LANGUAGES,
    themes,
  };
};
