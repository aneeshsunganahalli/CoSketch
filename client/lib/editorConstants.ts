import { LanguageOption, ThemeOption } from '../types/code.types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'c', label: 'C', icon: '🔧' },
  { value: 'csharp', label: 'C#', icon: '💜' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'swift', label: 'Swift', icon: '🐦' },
  { value: 'kotlin', label: 'Kotlin', icon: '🚀' },
  { value: 'scala', label: 'Scala', icon: '🔴' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'scss', label: 'SCSS', icon: '💅' },
  { value: 'json', label: 'JSON', icon: '📋' },
  { value: 'xml', label: 'XML', icon: '📄' },
  { value: 'yaml', label: 'YAML', icon: '⚙️' },
  { value: 'markdown', label: 'Markdown', icon: '📝' },
  { value: 'sql', label: 'SQL', icon: '🗃️' },
  { value: 'shell', label: 'Shell', icon: '🐚' },
  { value: 'dockerfile', label: 'Dockerfile', icon: '🐳' },
  { value: 'plaintext', label: 'Plain Text', icon: '📄' },
];

export const THEMES: ThemeOption[] = [
  { value: 'vs-dark', label: 'Dark' },
  { value: 'vs-light', label: 'Light' },
  { value: 'hc-black', label: 'High Contrast' },
];

export const DEFAULT_EDITOR_OPTIONS = {
  minimap: { enabled: true },
  fontSize: 14,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on' as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  folding: true,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'auto' as const,
  },
  padding: { top: 16, bottom: 16 },
};

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript Example
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
  
  typescript: `// TypeScript Example
interface User {
    name: string;
    age: number;
}

function greet(user: User): string {
    return \`Hello, \${user.name}!\`;
}

const user: User = { name: 'World', age: 25 };
console.log(greet(user));`,
  
  python: `# Python Example
def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))`,
  
  java: `// Java Example
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println(greet("World"));
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
  
  cpp: `// C++ Example
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << greet("World") << std::endl;
    return 0;
}`,
  
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,
  
  css: `/* CSS Example */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}`,
  
  json: `{
  "name": "Hello World",
  "version": "1.0.0",
  "description": "A simple example",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": ["example", "hello", "world"],
  "author": "Your Name",
  "license": "MIT"
}`,
  
  plaintext: `Hello, World!

This is a simple text example.
You can write any text here.`,
};
