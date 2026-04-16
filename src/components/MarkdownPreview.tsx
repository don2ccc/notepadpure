import React, { useMemo } from 'react';
import { marked } from 'marked';
import { FileText, X } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, isOpen, onClose }) => {
  const htmlContent = useMemo(() => {
    return marked.parse(content, { async: false }) as string;
  }, [content]);

  if (!isOpen) return null;

  return (
    <div className="markdown-preview-panel">
      <div className="markdown-preview-header">
        <div className="preview-title">
          <FileText size={16} />
          <span>Markdown Preview</span>
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div 
        className="markdown-preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default MarkdownPreview;
