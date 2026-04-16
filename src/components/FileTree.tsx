import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';

interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  is_file: boolean;
}

interface FileTreeProps {
  path: string;
  onFileSelect: (path: string, name: string) => void;
  level?: number;
}

const FileTreeItem: React.FC<{
  item: FileInfo;
  level: number;
  onFileSelect: (path: string, name: string) => void;
}> = ({ item, level, onFileSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileInfo[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const toggleExpand = useCallback(async () => {
    if (item.is_dir) {
      if (!hasLoaded) {
        try {
          const files = await invoke<FileInfo[]>('read_directory', { path: item.path });
          setChildren(files);
          setHasLoaded(true);
        } catch (err) {
          console.error('Failed to read directory:', err);
        }
      }
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(item.path, item.name);
    }
  }, [item, isExpanded, hasLoaded, onFileSelect]);

  const paddingLeft = level * 16 + 8;

  return (
    <div className="file-tree-item">
      <div
        className={`file-tree-node ${item.is_file ? 'file' : 'folder'}`}
        style={{ paddingLeft }}
        onClick={toggleExpand}
      >
        {item.is_dir && (
          <span className="expand-icon">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <span className="file-icon">
          {item.is_dir ? (
            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <File size={16} />
          )}
        </span>
        <span className="file-name" title={item.name}>{item.name}</span>
      </div>
      {item.is_dir && isExpanded && (
        <div className="file-tree-children">
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ path, onFileSelect, level = 0 }) => {
  const [items, setItems] = useState<FileInfo[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  React.useEffect(() => {
    const loadDirectory = async () => {
      try {
        const files = await invoke<FileInfo[]>('read_directory', { path });
        setItems(files);
        setHasLoaded(true);
      } catch (err) {
        console.error('Failed to load directory:', err);
      }
    };
    loadDirectory();
  }, [path]);

  if (!hasLoaded) {
    return <div className="file-tree-loading">Loading...</div>;
  }

  return (
    <div className="file-tree">
      {items.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          level={level}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
};

export default FileTree;
