import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Wrench, Copy, Check } from 'lucide-react';

interface ToolsPanelProps {
  selectedText: string;
  fullContent: string;
}

type ToolTab = 'base64' | 'hash' | 'stats';

const ToolsPanel: React.FC<ToolsPanelProps> = ({ selectedText, fullContent }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('base64');
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [hashOutput, setHashOutput] = useState({ md5: '', sha1: '', sha256: '' });
  const [copied, setCopied] = useState<string | null>(null);

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
    <div className="tools-panel">
      <div className="tools-header">
        <Wrench size={16} />
        <span>Tools</span>
      </div>
      
      <div className="tools-tabs">
        <button
          className={`tab ${activeTab === 'base64' ? 'active' : ''}`}
          onClick={() => setActiveTab('base64')}
        >
          Base64
        </button>
        <button
          className={`tab ${activeTab === 'hash' ? 'active' : ''}`}
          onClick={() => setActiveTab('hash')}
        >
          Hash
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
      </div>
      
      <div className="tools-content">
        {activeTab === 'base64' && (
          <div className="tool-section">
            <div className="tool-description">
              {selectedText ? 'Using selected text' : 'Enter text to encode/decode'}
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
              <button className="btn btn-small" onClick={handleBase64Encode}>
                Encode
              </button>
              <button className="btn btn-small" onClick={handleBase64Decode}>
                Decode
              </button>
            </div>
            {base64Output && (
              <div className="tool-output">
                <pre>{base64Output}</pre>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(base64Output, 'base64')}
                >
                  {copied === 'base64' ? <Check size={14} /> : <Copy size={14} />}
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
            <button className="btn btn-primary" onClick={handleCalculateHash}>
              Calculate Hash
            </button>
            {hashOutput.md5 && (
              <div className="hash-results">
                <div className="hash-item">
                  <span className="hash-label">MD5:</span>
                  <code className="hash-value">{hashOutput.md5}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(hashOutput.md5, 'md5')}
                  >
                    {copied === 'md5' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="hash-item">
                  <span className="hash-label">SHA1:</span>
                  <code className="hash-value">{hashOutput.sha1}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(hashOutput.sha1, 'sha1')}
                  >
                    {copied === 'sha1' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="hash-item">
                  <span className="hash-label">SHA256:</span>
                  <code className="hash-value">{hashOutput.sha256}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(hashOutput.sha256, 'sha256')}
                  >
                    {copied === 'sha256' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
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
                    <span className="stat-label">Selected Chars</span>
                    <span className="stat-value">{stats.selectedChars.toLocaleString()}</span>
                  </div>
                  <div className="stat-item selected">
                    <span className="stat-label">Selected Words</span>
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
