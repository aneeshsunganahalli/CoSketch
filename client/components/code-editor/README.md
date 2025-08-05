# Code Editor Component

A full-featured, modular code editor built with Monaco Editor and React. This implementation provides a professional coding experience with syntax highlighting, themes, and collaborative features.

## Features

- **Monaco Editor Integration**: Full VS Code editor experience in the browser
- **Multi-language Support**: 25+ programming languages with syntax highlighting
- **Theme Support**: Dark, Light, and High Contrast themes
- **Customizable Interface**: Configurable toolbar, status bar, and editor settings
- **Real-time Collaboration**: Built-in support for multiple collaborators
- **Code Templates**: Pre-defined templates for different languages
- **Export/Import**: Download code files and copy to clipboard
- **Responsive Design**: Works on different screen sizes

## Structure

```
components/
├── CodeEditor.tsx              # Main component
├── CodeEditorDemo.tsx          # Demo/example component
└── code-editor/
    ├── index.ts                # Exports
    ├── types.ts                # TypeScript interfaces
    ├── constants.ts            # Supported languages, themes, templates
    ├── MonacoEditorWrapper.tsx  # Monaco editor wrapper
    ├── EditorToolbar.tsx       # Top toolbar with controls
    └── EditorStatusBar.tsx     # Bottom status bar

hooks/
└── code-editor/
    ├── index.ts                # Exports
    ├── useCodeEditor.ts        # Editor instance management
    └── useCodeEditorSettings.ts # Settings state management
```

## Usage

### Basic Usage

```tsx
import { CodeEditor } from '@/components/CodeEditor';

function MyComponent() {
  const [code, setCode] = useState('');
  
  return (
    <CodeEditor
      initialLanguage="javascript"
      onChange={setCode}
      className="h-96"
    />
  );
}
```

### Advanced Usage

```tsx
import { CodeEditor } from '@/components/CodeEditor';

function AdvancedEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  
  return (
    <CodeEditor
      initialValue="// Welcome to the code editor"
      initialLanguage={language}
      initialTheme="vs-dark"
      onChange={setCode}
      onLanguageChange={setLanguage}
      showToolbar={true}
      showStatusBar={true}
      collaborators={3}
      isConnected={true}
      readOnly={false}
      className="h-screen border rounded-lg"
    />
  );
}
```

### Using Individual Components

```tsx
import { 
  MonacoEditorWrapper, 
  EditorToolbar, 
  EditorStatusBar 
} from '@/components/code-editor';

function CustomEditor() {
  // Build your own layout using individual components
  return (
    <div className="flex flex-col h-full">
      <EditorToolbar {...toolbarProps} />
      <MonacoEditorWrapper {...editorProps} />
      <EditorStatusBar {...statusProps} />
    </div>
  );
}
```

## Props

### CodeEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `string` | `''` | Initial code content |
| `initialLanguage` | `string` | `'javascript'` | Initial programming language |
| `initialTheme` | `'vs-dark' \| 'vs-light' \| 'hc-black'` | `'vs-dark'` | Initial editor theme |
| `onChange` | `(value: string) => void` | - | Called when code changes |
| `onLanguageChange` | `(language: string) => void` | - | Called when language changes |
| `className` | `string` | `''` | Additional CSS classes |
| `showToolbar` | `boolean` | `true` | Show/hide top toolbar |
| `showStatusBar` | `boolean` | `true` | Show/hide bottom status bar |
| `readOnly` | `boolean` | `false` | Make editor read-only |
| `collaborators` | `number` | `0` | Number of active collaborators |
| `isConnected` | `boolean` | `true` | Connection status indicator |

## Supported Languages

- JavaScript, TypeScript
- Python, Java, C++, C, C#
- Go, Rust, PHP, Ruby
- Swift, Kotlin, Scala
- HTML, CSS, SCSS
- JSON, XML, YAML
- Markdown, SQL, Shell
- Dockerfile, Plain Text

## Hooks

### useCodeEditor

Manages Monaco editor instance and provides methods to interact with the editor.

```tsx
const {
  editorRef,
  handleEditorDidMount,
  getValue,
  setValue,
  focus,
  formatDocument,
  getSelection,
  setSelection,
} = useCodeEditor();
```

### useCodeEditorSettings

Manages editor settings like language, theme, font size, etc.

```tsx
const {
  language,
  theme,
  fontSize,
  minimap,
  wordWrap,
  tabSize,
  handleLanguageChange,
  handleThemeChange,
  // ... other settings and handlers
} = useCodeEditorSettings();
```

## Customization

### Adding New Languages

1. Add language to `SUPPORTED_LANGUAGES` in `constants.ts`
2. Add template to `LANGUAGE_TEMPLATES`
3. Add file extension to `getFileExtension` function

### Adding New Themes

1. Add theme to `THEMES` in `constants.ts`
2. Monaco Editor supports custom theme definitions

### Styling

The component uses Tailwind CSS classes and supports dark mode. Customize by:

- Modifying CSS classes in components
- Using the `className` prop
- Overriding default styles

## Integration Tips

### With Real-time Collaboration

```tsx
// Example with WebSocket integration
function CollaborativeEditor() {
  const socket = useSocket();
  
  const handleChange = (value: string) => {
    socket.emit('code-change', { value, room: 'room-id' });
  };
  
  useEffect(() => {
    socket.on('code-update', (data) => {
      // Update editor without triggering onChange
      editorRef.current?.setValue(data.value);
    });
  }, []);
  
  return (
    <CodeEditor 
      onChange={handleChange}
      collaborators={connectedUsers.length}
      isConnected={socket.connected}
    />
  );
}
```

### With File System

```tsx
// Example with file operations
function FileEditor() {
  const [currentFile, setCurrentFile] = useState(null);
  
  const handleSave = async () => {
    await saveFile(currentFile.path, code);
  };
  
  const handleOpen = async (filePath: string) => {
    const content = await readFile(filePath);
    setCode(content);
    setCurrentFile({ path: filePath, content });
  };
  
  return (
    <CodeEditor 
      value={code}
      onChange={setCode}
      // Add custom toolbar actions for save/open
    />
  );
}
```

## Dependencies

- `@monaco-editor/react`: Monaco Editor React wrapper
- `monaco-editor`: VS Code editor core
- `lucide-react`: Icons for UI components
- `react`: React framework

## Performance Notes

- Monaco Editor is loaded lazily by default
- Large files (>1MB) may impact performance
- Consider implementing virtual scrolling for very large codebases
- Use `automaticLayout: false` if you control container sizing manually
