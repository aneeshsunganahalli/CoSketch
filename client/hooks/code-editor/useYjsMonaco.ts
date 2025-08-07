import { useEffect, useRef } from 'react';
import { useYjsProvider } from './useYjsProvider';
import { socketService } from '@/lib/socket';

interface UseYjsMonacoProps {
  roomId: string;
  monacoEditor: any;
  socketInstance?: any;
  onContentChange?: (content: string) => void;
}

export const useYjsMonaco = ({ roomId, monacoEditor, socketInstance, onContentChange }: UseYjsMonacoProps) => {
  const bindingRef = useRef<any>(null);
  const awarenessRef = useRef<any>(null);
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

        // Create awareness with user info
        const awareness = new Awareness(ydoc);
        awarenessRef.current = awareness;

        // Set local user info
        awareness.setLocalStateField('user', {
          name: `User-${Math.random().toString(36).substr(2, 9)}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          colorLight: `#${Math.floor(Math.random()*16777215).toString(16)}80`
        });

        // Get socket for awareness updates
        const socket = socketInstance || socketService.connect();

        // Create Monaco binding with proper undo/redo handling
        const binding = new MonacoBinding(
          ytext,
          monacoEditor.getModel()!,
          new Set([monacoEditor]),
          awareness
        );

        bindingRef.current = binding;

        // Send awareness updates to server
        const sendAwarenessUpdate = () => {
          const localState = awareness.getLocalState();
          if (localState) {
            socket.emit('yjs-awareness-update', {
              roomId,
              awarenessState: localState
            });
          }
        };

        // Listen for awareness changes and send to server
        awareness.on('update', sendAwarenessUpdate);

        // Store the awareness update function for cleanup
        (binding as any)._sendAwarenessUpdate = sendAwarenessUpdate;

        // Override the default setValue behavior to preserve undo stack
        const originalSetValue = monacoEditor.setValue.bind(monacoEditor);
        monacoEditor.setValue = (newValue: string) => {
          const model = monacoEditor.getModel();
          if (model) {
            const fullRange = model.getFullModelRange();
            const currentValue = model.getValue();
            
            // Only proceed if the value actually changed
            if (currentValue !== newValue) {
              // Push an undo stop before making the change
              monacoEditor.pushUndoStop();
              
              // Use executeEdits instead of setValue to preserve undo stack
              monacoEditor.executeEdits('yjs-update', [{
                range: fullRange,
                text: newValue
              }]);
              
              // Push an undo stop after the change
              monacoEditor.pushUndoStop();
            }
          }
        };

        // Store original setValue for cleanup
        (binding as any)._originalSetValue = originalSetValue;

        // Listen for content changes
        const contentChangeHandler = () => {
          const content = monacoEditor.getValue();
          onContentChange?.(content);
        };

        // Listen for model content changes
        const disposable = monacoEditor.onDidChangeModelContent(contentChangeHandler);

        // Store disposable for cleanup
        (binding as any)._disposable = disposable;

        console.log('✅ Yjs Monaco binding setup complete');
      } catch (error) {
        console.error('❌ Error setting up Yjs Monaco binding:', error);
      }
    };

    setupBinding();

    return () => {
      console.log('📝 Cleaning up Yjs Monaco binding');
      
      // Clean up awareness listener
      if (awarenessRef.current && bindingRef.current && (bindingRef.current as any)._sendAwarenessUpdate) {
        awarenessRef.current.off('update', (bindingRef.current as any)._sendAwarenessUpdate);
      }
      
      // Restore original setValue method
      if (bindingRef.current && (bindingRef.current as any)._originalSetValue) {
        monacoEditor.setValue = (bindingRef.current as any)._originalSetValue;
      }
      
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
    isReady: !!bindingRef.current,
    awareness: awarenessRef.current,
    ydoc,
    ytext,
    // Utility methods for safe content manipulation
    safeSetValue: (newValue: string) => {
      if (monacoEditor && bindingRef.current) {
        const model = monacoEditor.getModel();
        if (model) {
          const currentValue = model.getValue();
          if (currentValue !== newValue) {
            monacoEditor.pushUndoStop();
            monacoEditor.executeEdits('collaborative-update', [{
              range: model.getFullModelRange(),
              text: newValue
            }]);
            monacoEditor.pushUndoStop();
          }
        }
      }
    },
    safeInsertText: (text: string, position?: any) => {
      if (monacoEditor && bindingRef.current) {
        const model = monacoEditor.getModel();
        if (model) {
          const pos = position || monacoEditor.getPosition();
          monacoEditor.pushUndoStop();
          monacoEditor.executeEdits('collaborative-insert', [{
            range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
            text: text
          }]);
          monacoEditor.pushUndoStop();
        }
      }
    },
    safeClearContent: () => {
      if (monacoEditor && bindingRef.current) {
        const model = monacoEditor.getModel();
        if (model) {
          monacoEditor.pushUndoStop();
          monacoEditor.executeEdits('collaborative-clear', [{
            range: model.getFullModelRange(),
            text: ''
          }]);
          monacoEditor.pushUndoStop();
        }
      }
    }
  };
};
