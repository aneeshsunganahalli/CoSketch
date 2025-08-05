import { useEffect, useRef } from 'react';
import { useYjsProvider } from './useYjsProvider';
import type { editor } from 'monaco-editor';

interface UseYjsMonacoProps {
  roomId: string;
  monacoEditor: editor.IStandaloneCodeEditor | null;
  socketInstance?: any; // Accept shared socket instance
  onContentChange?: (content: string) => void;
}

export const useYjsMonaco = ({ roomId, monacoEditor, socketInstance, onContentChange }: UseYjsMonacoProps) => {
  const bindingRef = useRef<any | null>(null);
  const awarenessRef = useRef<any | null>(null);
  const { ydoc, ytext, isConnected } = useYjsProvider({ roomId, socketInstance });

  useEffect(() => {
    if (!monacoEditor || !ydoc || !ytext || typeof window === 'undefined') {
      return;
    }

    // Dynamic import to avoid SSR issues
    const setupBinding = async () => {
      try {
        const [{ MonacoBinding }, { Awareness }] = await Promise.all([
          import('y-monaco'),
          import('y-protocols/awareness')
        ]);

        console.log('📝 Setting up Yjs Monaco binding');

        // Create awareness
        const awareness = new Awareness(ydoc);
        awarenessRef.current = awareness;

        // Create Monaco binding
        const binding = new MonacoBinding(
          ytext,
          monacoEditor.getModel()!,
          new Set([monacoEditor]),
          awareness
        );

        bindingRef.current = binding;

        // Listen for content changes
        const contentChangeHandler = () => {
          const content = monacoEditor.getValue();
          onContentChange?.(content);
        };

        // Listen for model content changes
        const disposable = monacoEditor.onDidChangeModelContent(contentChangeHandler);

        // Store disposable for cleanup
        (binding as any)._disposable = disposable;
      } catch (error) {
        console.error('❌ Error setting up Yjs Monaco binding:', error);
      }
    };

    setupBinding();

    return () => {
      console.log('📝 Cleaning up Yjs Monaco binding');
      
      // Dispose of the content change listener
      if (bindingRef.current && (bindingRef.current as any)._disposable) {
        (bindingRef.current as any)._disposable.dispose();
      }
      
      // Destroy the binding
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      // Clean up awareness
      if (awarenessRef.current) {
        awarenessRef.current.destroy();
        awarenessRef.current = null;
      }
    };
  }, [monacoEditor, ydoc, ytext, onContentChange]);

  return {
    isConnected,
    isReady: !!bindingRef.current
  };
};
