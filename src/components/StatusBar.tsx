import React from 'react';

interface StatusBarProps {
  encoding: string;
  line: number;
  column: number;
  fileSize?: number;
  isModified: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ encoding, line, column, fileSize, isModified }) => {
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="status-bar">
      <div className="status-left">
        {isModified && <span className="modified-indicator">●</span>}
        <span className="status-item">{encoding}</span>
        {fileSize !== undefined && (
          <span className="status-item">{formatFileSize(fileSize)}</span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">Ln {line}, Col {column}</span>
      </div>
    </div>
  );
};

export default StatusBar;
