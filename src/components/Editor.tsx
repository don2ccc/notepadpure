import React, { useRef, useCallback, useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface EditorProps {
  content: string;
  language?: string;
  onChange: (value: string) => void;
  onCursorPositionChange?: (line: number, column: number) => void;
  showWhitespace?: boolean;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
}

const Editor: React.FC<EditorProps> = ({
  content,
  language = 'plaintext',
  onChange,
  onCursorPositionChange,
  showWhitespace = false,
  readOnly = false,
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsReady(true);

    // Update cursor position on selection change
    editor.onDidChangeCursorPosition((e) => {
      onCursorPositionChange?.(e.position.lineNumber, e.position.column);
    });

    // Initial position
    const position = editor.getPosition();
    if (position) {
      onCursorPositionChange?.(position.lineNumber, position.column);
    }
  }, [onCursorPositionChange]);

  // Update whitespace rendering
  useEffect(() => {
    if (editorRef.current && isReady) {
      editorRef.current.updateOptions({
        renderWhitespace: showWhitespace ? 'all' : 'none',
      });
    }
  }, [showWhitespace, isReady]);

  // Get language from file extension
  const getLanguage = (filename?: string): string => {
    if (!filename) return language;
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescriptreact',
      'jsx': 'javascriptreact',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'md': 'markdown',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
    };
    return langMap[ext || ''] || language;
  };

  return (
    <div className="editor-container">
      <MonacoEditor
        height="100%"
        language={getLanguage()}
        value={content}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          renderWhitespace: showWhitespace ? 'all' : 'none',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'always',
          matchBrackets: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          trimAutoWhitespace: true,
        }}
        theme={theme}
      />
    </div>
  );
};

export default Editor;
