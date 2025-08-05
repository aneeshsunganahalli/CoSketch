import { useState, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, THEMES } from '../../lib/editorConstants';

export const useCodeEditorSettings = () => {
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light' | 'hc-black'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [minimap, setMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState<'off' | 'on' | 'wordWrapColumn' | 'bounded'>('on');
  const [tabSize, setTabSize] = useState(2);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
  }, []);

  const handleThemeChange = useCallback((newTheme: 'vs-dark' | 'vs-light' | 'hc-black') => {
    setTheme(newTheme);
  }, []);

  const handleFontSizeChange = useCallback((newFontSize: number) => {
    setFontSize(Math.max(8, Math.min(72, newFontSize)));
  }, []);

  const handleMinimapToggle = useCallback(() => {
    setMinimap(prev => !prev);
  }, []);

  const handleWordWrapToggle = useCallback(() => {
    setWordWrap(prev => prev === 'on' ? 'off' : 'on');
  }, []);

  const handleTabSizeChange = useCallback((newTabSize: number) => {
    setTabSize(Math.max(1, Math.min(8, newTabSize)));
  }, []);

  const getLanguageInfo = useCallback(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.value === language);
  }, [language]);

  const getThemeInfo = useCallback(() => {
    return THEMES.find(t => t.value === theme);
  }, [theme]);

  return {
    // State
    language,
    theme,
    fontSize,
    minimap,
    wordWrap,
    tabSize,
    
    // Actions
    handleLanguageChange,
    handleThemeChange,
    handleFontSizeChange,
    handleMinimapToggle,
    handleWordWrapToggle,
    handleTabSizeChange,
    
    // Getters
    getLanguageInfo,
    getThemeInfo,
    
    // Constants
    supportedLanguages: SUPPORTED_LANGUAGES,
    themes: THEMES,
  };
};
