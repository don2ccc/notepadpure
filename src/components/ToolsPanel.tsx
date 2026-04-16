import React, { useState, useCallback, useEffect, useRef, RefObject } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Wrench, Copy, Check, X } from 'lucide-react';

interface ToolsPanelProps {
  selectedText: string;
  fullContent: string;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

type ToolTab = 'base64' | 'hash' | 'stats';

const ToolsPanel: React.FC<ToolsPanelProps> = ({ selectedText, fullContent, onClose, anchorRef }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('base64');
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [hashOutput, setHashOutput] = useState({ md5: '', sha1: '', sha256: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  // Position popup below the anchor button — computed once on mount, no flash
  const popupStyle = React.useMemo<React.CSSProperties>(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      return {
        position: 'fixed',
        top: rect.bottom + 6,
        left: Math.max(8, rect.left - 260 + rect.width),
        zIndex: 2000,
      };
    }
    // Hidden off-screen until anchor is available (should not happen)
    return { position: 'fixed', top: -9999, left: -9999, zIndex: 2000 };
  }, [anchorRef]);

  const handleBase64Encode = useCallback(async () => {
    const text = selectedText || base64Input;
    if (!text) return;
    try {
      const result = await invoke<string>('base64_encode', { text });
      setBase64Output(result);
    } catch (err) {
      setBase64Output('Error: ' + String(err));
    }
  }, [selectedText, base64Input]);

  const handleBase64Decode = useCallback(async () => {
    const text = selectedText || base64Input;
    if (!text) return;
    try {
      const result = await invoke<string>('base64_decode', { text });
      setBase64Output(result);
    } catch (err) {
      setBase64Output('Error: Invalid Base64 string');
    }
  }, [selectedText, base64Input]);

  const handleCalculateHash = useCallback(async () => {
    const text = selectedText || fullContent;
    if (!text) return;
    try {
      const [md5, sha1, sha256] = await Promise.all([
        invoke<string>('calculate_md5', { text }),
        invoke<string>('calculate_sha1', { text }),
        invoke<string>('calculate_sha256', { text }),
      ]);
      setHashOutput({ md5, sha1, sha256 });
    } catch (err) {
      console.error('Hash calculation error:', err);
    }
  }, [selectedText, fullContent]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const getStats = () => {
    const text = fullContent || '';
    const selected = selectedText || '';
    return {
      chars: text.length,
      lines: text.split('\n').length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      selectedChars: selected.length,
      selectedWords: selected.trim() ? selected.trim().split(/\s+/).length : 0,
    };
  };

  const stats = getStats();

  return (
    <div className="tools-popup" ref={panelRef} style={popupStyle}>
      {/* Header */}
      <div className="tools-popup-header">
        <div className="tools-popup-title">
          <Wrench size={14} />
          <span>Tools</span>
        </div>
        <button className="icon-button close-button" onClick={onClose} title="Close">
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="tools-popup-tabs">
        {(['base64', 'hash', 'stats'] as ToolTab[]).map(tab => (
          <button
            key={tab}
            className={`tools-popup-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'base64' ? 'Base64' : tab === 'hash' ? 'Hash' : 'Stats'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="tools-popup-content">
        {activeTab === 'base64' && (
          <div className="tool-section">
            <div className="tool-description">
              {selectedText ? 'Using selected text' : 'Enter text to encode / decode'}
            </div>
            {!selectedText && (
              <textarea
                className="tool-input"
                placeholder="Enter text..."
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                rows={3}
              />
            )}
            <div className="tool-buttons">
              <button className="btn btn-small btn-primary" onClick={handleBase64Encode}>Encode</button>
              <button className="btn btn-small btn-secondary" onClick={handleBase64Decode}>Decode</button>
            </div>
            {base64Output && (
              <div className="tool-output">
                <pre>{base64Output}</pre>
                <button className="copy-btn" onClick={() => copyToClipboard(base64Output, 'base64')} title="Copy">
                  {copied === 'base64' ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hash' && (
          <div className="tool-section">
            <div className="tool-description">
              {selectedText ? 'Hash of selected text' : 'Hash of entire document'}
            </div>
            <button className="btn btn-primary" onClick={handleCalculateHash}>Calculate Hash</button>
            {hashOutput.md5 && (
              <div className="hash-results">
                {[
                  { label: 'MD5', value: hashOutput.md5, key: 'md5' },
                  { label: 'SHA1', value: hashOutput.sha1, key: 'sha1' },
                  { label: 'SHA256', value: hashOutput.sha256, key: 'sha256' },
                ].map(({ label, value, key }) => (
                  <div className="hash-item" key={key}>
                    <span className="hash-label">{label}</span>
                    <code className="hash-value">{value}</code>
                    <button className="copy-btn" onClick={() => copyToClipboard(value, key)} title="Copy">
                      {copied === key ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="tool-section">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Characters</span>
                <span className="stat-value">{stats.chars.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lines</span>
                <span className="stat-value">{stats.lines.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Words</span>
                <span className="stat-value">{stats.words.toLocaleString()}</span>
              </div>
              {stats.selectedChars > 0 && (
                <>
                  <div className="stat-item selected">
                    <span className="stat-label">Sel. Chars</span>
                    <span className="stat-value">{stats.selectedChars.toLocaleString()}</span>
                  </div>
                  <div className="stat-item selected">
                    <span className="stat-label">Sel. Words</span>
                    <span className="stat-value">{stats.selectedWords.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPanel;
