'use client';

import React from 'react';
import { 
  Play, 
  Download, 
  Copy, 
  Settings, 
  Type, 
  Palette, 
  Map, 
  WrapText,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';

interface EditorToolbarProps {
  language: string;
  theme: string;
  fontSize: number;
  minimap: boolean;
  wordWrap: boolean;
  supportedLanguages: Array<{ value: string; label: string; icon?: string }>;
  themes: Array<{ value: string; label: string }>;
  onLanguageChange: (language: string) => void;
  onThemeChange: (theme: any) => void;
  onFontSizeChange: (fontSize: number) => void;
  onMinimapToggle: () => void;
  onWordWrapToggle: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  onRun?: () => void;
  onReset?: () => void;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  theme,
  fontSize,
  minimap,
  wordWrap,
  supportedLanguages,
  themes,
  onLanguageChange,
  onThemeChange,
  onFontSizeChange,
  onMinimapToggle,
  onWordWrapToggle,
  onCopy,
  onDownload,
  onRun,
  onReset,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Left side - Language and Theme */}
      <div className="flex items-center space-x-3">
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center - Editor Settings */}
      <div className="flex items-center space-x-3">
        {/* Font Size */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onFontSizeChange(fontSize - 1)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Decrease font size"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-mono min-w-[2rem] text-center">{fontSize}</span>
          <button
            onClick={() => onFontSizeChange(fontSize + 1)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Increase font size"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Minimap Toggle */}
        <button
          onClick={onMinimapToggle}
          className={`p-2 rounded ${
            minimap 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle minimap"
        >
          <Map className="w-4 h-4" />
        </button>

        {/* Word Wrap Toggle */}
        <button
          onClick={onWordWrapToggle}
          className={`p-2 rounded ${
            wordWrap 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle word wrap"
        >
          <WrapText className="w-4 h-4" />
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {onReset && (
          <button
            onClick={onReset}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Reset to template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Copy code"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}

        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {onRun && (
          <button
            onClick={onRun}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center space-x-1"
            title="Run code"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Run</span>
          </button>
        )}
      </div>
    </div>
  );
};
