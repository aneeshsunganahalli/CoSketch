import { useEffect, useRef, useState } from 'react';
import { Extension } from '@codemirror/state';
import { useYjsCodeMirror } from './useYjsCodeMirror';

interface UseCollaborativeCodeMirrorProps {
  roomId: string;
  socketInstance?: any;
}

interface CollaborativeCodeMirrorResult {
  ydoc: any;
  ytext: any;
  isConnected: boolean;
  userCount: number;
  collabExtension: Extension[];
  isReady: boolean;
}

export const useCollaborativeCodeMirror = ({ 
  roomId, 
  socketInstance
}: UseCollaborativeCodeMirrorProps): CollaborativeCodeMirrorResult => {
  const [collabExtension, setCollabExtension] = useState<Extension[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { ydoc, ytext, isConnected, userCount } = useYjsCodeMirror({ roomId, socketInstance });

  useEffect(() => {
    if (!ydoc || !ytext || typeof window === 'undefined') {
      setCollabExtension([]);
      setIsReady(false);
      return;
    }

    // Dynamic import to avoid SSR issues
    const setupExtension = async () => {
      try {
        const { yCollab } = await import('y-codemirror.next');
        
        console.log('📝 Creating Yjs CodeMirror collaborative extension');

        // Create the collaborative extension
        const extension = yCollab(ytext, undefined, {
          undoManager: false // We'll handle undo/redo ourselves if needed
        });

        // Ensure we return an array of extensions
        const extensions = Array.isArray(extension) ? extension : [extension];
        setCollabExtension(extensions);
        setIsReady(true);
        console.log('✅ CodeMirror collaborative extension created');
        
      } catch (error) {
        console.error('❌ Error creating Yjs CodeMirror extension:', error);
        setCollabExtension([]);
        setIsReady(false);
      }
    };

    setupExtension();

    return () => {
      console.log('📝 Cleaning up collaborative extension');
      setCollabExtension([]);
      setIsReady(false);
    };
  }, [ydoc, ytext]);

  return {
    ydoc,
    ytext,
    isConnected,
    userCount,
    collabExtension,
    isReady
  };
};
