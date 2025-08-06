// Language configurations for CodeMirror
export const CODEMIRROR_LANGUAGES = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  markdown: 'Markdown',
  yaml: 'YAML',
  xml: 'XML',
  sql: 'SQL',
  shell: 'Shell',
};

// Array version for components that expect an array format
export const CODEMIRROR_LANGUAGES_ARRAY = Object.entries(CODEMIRROR_LANGUAGES).map(([value, label]) => ({
  value,
  label
}));

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Welcome to the JavaScript Editor
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

greet("Developer");`,
  
  typescript: `// Welcome to the TypeScript Editor
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "Developer",
  age: 25
};

console.log(\`Hello, \${user.name}!\`);`,
  
  python: `# Welcome to the Python Editor
def greet(name):
    return f"Hello, {name}!"

def main():
    print(greet("Developer"))
    print("Welcome to CoSketch!")

if __name__ == "__main__":
    main()`,
  
  java: `// Welcome to the Java Editor
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to CoSketch!");
    }
}`,
  
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoSketch</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to CoSketch collaborative editor!</p>
</body>
</html>`,
  
  css: `/* Welcome to the CSS Editor */
body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #2563eb;
    text-align: center;
}`,
  
  json: `{
  "name": "CoSketch Project",
  "version": "1.0.0",
  "description": "Collaborative whiteboard and code editor",
  "features": [
    "Real-time collaboration",
    "Multiple programming languages",
    "Whiteboard drawing",
    "Code persistence"
  ],
  "author": "CoSketch Team"
}`,
  
  markdown: `# Welcome to CoSketch!

CoSketch is a **collaborative platform** that combines:

## Features

- 🎨 **Whiteboard**: Draw and sketch together
- 💻 **Code Editor**: Write code collaboratively
- 🔄 **Real-time Sync**: See changes instantly
- 💾 **Auto-save**: Never lose your work

## Getting Started

1. Create or join a room
2. Choose between whiteboard or code editor
3. Start collaborating!

> **Tip**: Your work is automatically saved and will persist across browser refreshes.

\`\`\`javascript
// Try editing this code!
console.log("Hello, CoSketch!");
\`\`\``,
  
  default: `// Welcome to CoSketch Code Editor
// Your code will be automatically saved and synchronized across all collaborators
// Choose a language from the toolbar above to get started!

console.log("Start coding...");`
};

export function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    markdown: 'md',
    yaml: 'yml',
    xml: 'xml',
    sql: 'sql',
    shell: 'sh',
  };
  
  return extensions[language] || 'txt';
}