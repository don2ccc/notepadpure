import React, { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save, ask } from '@tauri-apps/plugin-dialog';
import { 
  FolderOpen, 
  Save, 
  SaveAll,
  Search, 
  Eye, 
  EyeOff,
  FileCode,
  Settings,
  Wrench,
  Moon,
  Sun,
  FilePlus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import FileTree from './components/FileTree';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import FindReplace from './components/FindReplace';
import ToolsPanel from './components/ToolsPanel';
import EncodingDialog from './components/EncodingDialog';
import MarkdownPreview from './components/MarkdownPreview';

import './App.css';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  encoding: string;
  withBom: boolean;
}

function App() {
  // State
  const [rootPath, setRootPath] = useState<string>('');
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [showEncodingDialog, setShowEncodingDialog] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [selectedText] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Get active file
  const activeFile = activeFileIndex >= 0 ? openFiles[activeFileIndex] : null;

  // New file
  const handleNewFile = useCallback(() => {
    const newFile: OpenFile = {
      path: '',
      name: 'Untitled',
      content: '',
      originalContent: '',
      encoding: 'UTF-8',
      withBom: false,
    };
    setOpenFiles(prev => {
      const newFiles = [...prev, newFile];
      setActiveFileIndex(newFiles.length - 1);
      return newFiles;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleNewFile();
            break;
          case 'o':
            e.preventDefault();
            handleOpenFolder();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handleSaveAs();
            } else {
              handleSave();
            }
            break;
          case 'f':
            e.preventDefault();
            setShowFindReplace(true);
            break;
          case 'h':
            e.preventDefault();
            setShowFindReplace(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, openFiles, handleNewFile]);

  // Open folder
  const handleOpenFolder = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      setRootPath(selected);
    }
  }, []);

  // Open file
  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'json', 'xml', 'yaml', 'yml'] },
        { name: 'Code Files', extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'rs', 'go'] },
      ],
    });
    if (selected && typeof selected === 'string') {
      await loadFile(selected);
    }
  }, []);

  // Load file from path
  const loadFile = useCallback(async (filePath: string) => {
    try {
      const result = await invoke<{ content: string; encoding: string }>('read_file_with_encoding', {
        path: filePath,
      });
      
      const fileName = filePath.split(/[\\/]/).pop() || 'Untitled';
      
      // Check if file is already open
      const existingIndex = openFiles.findIndex(f => f.path === filePath);
      if (existingIndex >= 0) {
        setActiveFileIndex(existingIndex);
        return;
      }
      
      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: result.content,
        originalContent: result.content,
        encoding: result.encoding,
        withBom: false,
      };
      
      setOpenFiles(prev => {
        const newFiles = [...prev, newFile];
        setActiveFileIndex(newFiles.length - 1);
        return newFiles;
      });
    } catch (err) {
      console.error('Failed to load file:', err);
      alert('Failed to open file: ' + String(err));
    }
  }, [openFiles]);

  // Handle file select from tree
  const handleFileSelect = useCallback(async (path: string, _name: string) => {
    await loadFile(path);
  }, [loadFile]);

  // Save file
  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    
    // New file with no path: trigger Save As dialog
    if (!activeFile.path) {
      const savePath = await save({
        defaultPath: activeFile.name || 'Untitled.txt',
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text Files', extensions: ['txt', 'md', 'json', 'yaml', 'xml'] },
        ],
      });
      if (!savePath) return;
      try {
        await invoke('save_file_with_encoding', {
          path: savePath,
          content: activeFile.content,
          encodingName: activeFile.encoding,
          withBom: activeFile.withBom,
        });
        const newName = savePath.split(/[\\/]/).pop() || 'Untitled';
        setOpenFiles(prev => prev.map((f, i) =>
          i === activeFileIndex
            ? { ...f, path: savePath, name: newName, originalContent: f.content }
            : f
        ));
      } catch (err) {
        alert('Failed to save file: ' + String(err));
      }
      return;
    }

    try {
      await invoke('save_file_with_encoding', {
        path: activeFile.path,
        content: activeFile.content,
        encodingName: activeFile.encoding,
        withBom: activeFile.withBom,
      });
      
      setOpenFiles(prev => prev.map((f, i) => 
        i === activeFileIndex 
          ? { ...f, originalContent: f.content }
          : f
      ));
    } catch (err) {
      console.error('Failed to save file:', err);
      alert('Failed to save file: ' + String(err));
    }
  }, [activeFile, activeFileIndex]);

  // Save as
  const handleSaveAs = useCallback(async () => {
    if (!activeFile) return;
    
    const savePath = await save({
      defaultPath: activeFile.name,
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt'] },
      ],
    });
    
    if (savePath) {
      try {
        await invoke('save_file_with_encoding', {
          path: savePath,
          content: activeFile.content,
          encodingName: activeFile.encoding,
          withBom: activeFile.withBom,
        });
        
        const newName = savePath.split(/[\\/]/).pop() || 'Untitled';
        setOpenFiles(prev => prev.map((f, i) => 
          i === activeFileIndex 
            ? { ...f, path: savePath, name: newName, originalContent: f.content }
            : f
        ));
      } catch (err) {
        console.error('Failed to save file:', err);
        alert('Failed to save file: ' + String(err));
      }
    }
  }, [activeFile, activeFileIndex]);

  // Close file
  const handleCloseFile = useCallback(async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const file = openFiles[index];
    if (file.content !== file.originalContent) {
      const confirmed = await ask('You have unsaved changes. Close anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning',
      });
      if (!confirmed) return;
    }
    
    setOpenFiles(prev => prev.filter((_, i) => i !== index));
    if (activeFileIndex === index) {
      setActiveFileIndex(Math.min(index, openFiles.length - 2));
    } else if (activeFileIndex > index) {
      setActiveFileIndex(prev => prev - 1);
    }
  }, [openFiles, activeFileIndex]);

  // Update file content
  const handleContentChange = useCallback((value: string) => {
    if (activeFileIndex < 0) return;
    
    setOpenFiles(prev => prev.map((f, i) => 
      i === activeFileIndex 
        ? { ...f, content: value }
        : f
    ));
  }, [activeFileIndex]);

  // Handle encoding change
  const handleEncodingChange = useCallback((encoding: string, withBom: boolean) => {
    if (activeFileIndex < 0) return;
    
    setOpenFiles(prev => prev.map((f, i) => 
      i === activeFileIndex 
        ? { ...f, encoding, withBom }
        : f
    ));
  }, [activeFileIndex]);

  // Handle find/replace content change
  const handleFindReplaceContentChange = useCallback((newContent: string) => {
    handleContentChange(newContent);
  }, [handleContentChange]);

  return (
    <div className={`app ${isDarkTheme ? '' : 'light-theme'}`}>
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-section">
          <button className="menu-button" onClick={handleNewFile} title="New File (Ctrl+N)">
            <FilePlus size={18} />
          </button>
          <button className="menu-button" onClick={handleOpenFolder} title="Open Folder (Ctrl+O)">
            <FolderOpen size={18} />
          </button>
          <button className="menu-button" onClick={handleOpenFile} title="Open File">
            <FileCode size={18} />
          </button>
          <div className="menu-divider" />
          <button 
            className="menu-button" 
            onClick={handleSave} 
            disabled={!activeFile}
            title="Save (Ctrl+S)"
          >
            <Save size={18} />
          </button>
          <button 
            className="menu-button" 
            onClick={handleSaveAs} 
            disabled={!activeFile}
            title="Save As (Ctrl+Shift+S)"
          >
            <SaveAll size={18} />
          </button>
          <div className="menu-divider" />
          <button 
            className={`menu-button ${showFindReplace ? 'active' : ''}`}
            onClick={() => setShowFindReplace(!showFindReplace)}
            title="Find/Replace (Ctrl+F)"
          >
            <Search size={18} />
          </button>
          <button 
            className={`menu-button ${showWhitespace ? 'active' : ''}`}
            onClick={() => setShowWhitespace(!showWhitespace)}
            title="Toggle Whitespace"
          >
            {showWhitespace ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          {activeFile?.name.endsWith('.md') && (
            <button 
              className={`menu-button ${showMarkdownPreview ? 'active' : ''}`}
              onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
              title="Markdown Preview"
            >
              <FileCode size={18} />
            </button>
          )}
          <div className="menu-divider" />
          <button 
            ref={toolsButtonRef}
            className={`menu-button ${showToolsPopup ? 'active' : ''}`}
            onClick={() => setShowToolsPopup(!showToolsPopup)}
            title="Tools"
          >
            <Wrench size={18} />
          </button>
          <button 
            className="menu-button"
            onClick={() => setShowEncodingDialog(true)}
            title="Encoding"
          >
            <Settings size={18} />
          </button>
          <div className="menu-divider" />
          <button 
            className="menu-button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Show Explorer' : 'Hide Explorer'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button 
            className="menu-button"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            title="Toggle Theme"
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="app-title" onClick={() => setShowAbout(true)} style={{ cursor: 'pointer' }}>NotepadPure</div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        {rootPath && !sidebarCollapsed && (
          <div className="sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Explorer</span>
            </div>
            <div className="sidebar-content">
              <FileTree path={rootPath} onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="editor-area">
          {/* Tabs */}
          {openFiles.length > 0 && (
            <div className="tabs">
              {openFiles.map((file, index) => (
                <div
                  key={file.path}
                  className={`tab ${index === activeFileIndex ? 'active' : ''} ${file.content !== file.originalContent ? 'modified' : ''}`}
                  onClick={() => setActiveFileIndex(index)}
                >
                  <span className="tab-name">{file.name}</span>
                  <button 
                    className="tab-close"
                    onClick={(e) => handleCloseFile(index, e)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          <div className="editor-wrapper">
            {activeFile ? (
              <>
                <Editor
                  content={activeFile.content}
                  onChange={handleContentChange}
                  onCursorPositionChange={(line, col) => {
                    setCursorLine(line);
                    setCursorColumn(col);
                  }}
                  showWhitespace={showWhitespace}
                  theme={isDarkTheme ? 'vs-dark' : 'light'}
                />
                <FindReplace
                  isOpen={showFindReplace}
                  onClose={() => setShowFindReplace(false)}
                  content={activeFile.content}
                  onContentChange={handleFindReplaceContentChange}
                />
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  <h2>NotepadPure</h2>
                  <p>A lightweight text editor for developers</p>
                  <div className="shortcuts">
                    <div className="shortcut">
                      <kbd>Ctrl+O</kbd>
                      <span>Open Folder</span>
                    </div>
                    <div className="shortcut">
                      <kbd>Ctrl+S</kbd>
                      <span>Save</span>
                    </div>
                    <div className="shortcut">
                      <kbd>Ctrl+F</kbd>
                      <span>Find</span>
                    </div>
                    <div className="shortcut">
                      <kbd>Ctrl+H</kbd>
                      <span>Replace</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          {activeFile && (
            <StatusBar
              encoding={activeFile.encoding}
              line={cursorLine}
              column={cursorColumn}
              isModified={activeFile.content !== activeFile.originalContent}
            />
          )}
        </div>

        {/* Tools Panel */}
        {showToolsPopup && (
          <ToolsPanel
            selectedText={selectedText}
            fullContent={activeFile?.content || ''}
            onClose={() => setShowToolsPopup(false)}
            anchorRef={toolsButtonRef}
          />
        )}

        {/* Markdown Preview */}
        {activeFile?.name.endsWith('.md') && (
          <MarkdownPreview
            content={activeFile.content}
            isOpen={showMarkdownPreview}
            onClose={() => setShowMarkdownPreview(false)}
          />
        )}
      </div>

      {/* Encoding Dialog */}
      <EncodingDialog
        isOpen={showEncodingDialog}
        onClose={() => setShowEncodingDialog(false)}
        currentEncoding={activeFile?.encoding || 'UTF-8'}
        onEncodingChange={handleEncodingChange}
      />

      {/* About Dialog */}
      {showAbout && (
        <div className="dialog-overlay" onClick={() => setShowAbout(false)}>
          <div className="dialog about-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>About NotepadPure</h3>
            </div>
            <div className="dialog-body">
              <p className="about-quote">"We only need a simple notepad, literally, then I made this with AI vibe coding. 
                if you are interested, please check out at <a href="https://github.com/DonnieG/notepad-pure">Github: Notepad Pure</a>"</p>
              <p className="about-copyright">Powered by Donnie G.</p>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-primary" onClick={() => setShowAbout(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
