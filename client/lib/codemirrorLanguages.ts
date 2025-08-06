import { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';

export interface LanguageOption {
  value: string;
  label: string;
  icon?: string;
  extension: () => Extension;
}

export const CODEMIRROR_LANGUAGES: LanguageOption[] = [
  { 
    value: 'javascript', 
    label: 'JavaScript', 
    icon: '🟨', 
    extension: () => javascript({ jsx: false, typescript: false })
  },
  { 
    value: 'typescript', 
    label: 'TypeScript', 
    icon: '🔷', 
    extension: () => javascript({ jsx: false, typescript: true })
  },
  { 
    value: 'jsx', 
    label: 'React JSX', 
    icon: '⚛️', 
    extension: () => javascript({ jsx: true, typescript: false })
  },
  { 
    value: 'tsx', 
    label: 'React TSX', 
    icon: '⚛️', 
    extension: () => javascript({ jsx: true, typescript: true })
  },
  { 
    value: 'python', 
    label: 'Python', 
    icon: '🐍', 
    extension: () => python()
  },
  { 
    value: 'html', 
    label: 'HTML', 
    icon: '🌐', 
    extension: () => html()
  },
  { 
    value: 'css', 
    label: 'CSS', 
    icon: '🎨', 
    extension: () => css()
  },
  { 
    value: 'json', 
    label: 'JSON', 
    icon: '📋', 
    extension: () => json()
  },
  { 
    value: 'markdown', 
    label: 'Markdown', 
    icon: '📝', 
    extension: () => markdown()
  },
  { 
    value: 'xml', 
    label: 'XML', 
    icon: '📄', 
    extension: () => xml()
  },
  { 
    value: 'plaintext', 
    label: 'Plain Text', 
    icon: '📄', 
    extension: () => []
  },
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Welcome to JavaScript
console.log('Hello, World!');

function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet('Developer');
console.log(message);`,

  typescript: `// Welcome to TypeScript
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  id: 1,
  name: 'Developer',
  email: 'dev@example.com'
};

console.log(greet(user));`,

  jsx: `// Welcome to React JSX
import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello, React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`,

  tsx: `// Welcome to React TypeScript
import React, { useState } from 'react';

interface Props {
  title: string;
}

const App: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default App;`,

  python: `# Welcome to Python
def greet(name):
    """Greet a person with their name."""
    return f"Hello, {name}!"

def main():
    name = "Developer"
    message = greet(name)
    print(message)
    
    # Example: Working with lists
    numbers = [1, 2, 3, 4, 5]
    squares = [x**2 for x in numbers]
    print(f"Numbers: {numbers}")
    print(f"Squares: {squares}")

if __name__ == "__main__":
    main()`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>Welcome to HTML development.</p>
        <button onclick="alert('Hello!')">Click me</button>
    </div>
</body>
</html>`,

  css: `/* Welcome to CSS */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}`,

  json: `{
  "name": "example-project",
  "version": "1.0.0",
  "description": "A sample JSON configuration",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^6.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^27.0.0"
  },
  "keywords": ["javascript", "node", "express"],
  "author": "Developer",
  "license": "MIT"
}`,

  markdown: `# Welcome to Markdown

This is a **comprehensive** example of Markdown syntax.

## Features

- Easy to write
- Easy to read
- *Widely supported*

### Code Examples

Here's some inline \`code\` and a code block:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Bullet point
- Another point
  - Nested point

### Links and Images

[Visit GitHub](https://github.com)

### Tables

| Feature | Support |
|---------|---------|
| Tables  | ✅ Yes  |
| Lists   | ✅ Yes  |
| Code    | ✅ Yes  |

> This is a quote block with important information.

---

**Happy writing!** 🚀`,

  xml: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
    <book id="1">
        <title>The Great Gatsby</title>
        <author>F. Scott Fitzgerald</author>
        <genre>Fiction</genre>
        <price currency="USD">12.99</price>
        <publication>
            <year>1925</year>
            <publisher>Scribner</publisher>
        </publication>
        <description>
            A classic American novel set in the Jazz Age.
        </description>
    </book>
    
    <book id="2">
        <title>To Kill a Mockingbird</title>
        <author>Harper Lee</author>
        <genre>Fiction</genre>
        <price currency="USD">13.99</price>
        <publication>
            <year>1960</year>
            <publisher>J.B. Lippincott & Co.</publisher>
        </publication>
        <description>
            A gripping tale of racial injustice and childhood innocence.
        </description>
    </book>
</catalog>`,

  plaintext: `Welcome to Plain Text

This is a simple text editor without syntax highlighting.
You can write any kind of text here:

- Notes
- Documentation
- Simple text files
- Configuration files

Feel free to start typing!`
};

export function getLanguageExtension(language: string): Extension {
  const langConfig = CODEMIRROR_LANGUAGES.find(lang => lang.value === language);
  return langConfig ? langConfig.extension() : [];
}

export function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
    xml: 'xml',
    plaintext: 'txt'
  };
  
  return extensions[language] || 'txt';
}
