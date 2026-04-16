import React, { useState, useCallback, useEffect } from 'react';
import { Search, Replace, X } from 'lucide-react';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (newContent: string) => void;
}

const FindReplace: React.FC<FindReplaceProps> = ({ isOpen, onClose, content, onContentChange }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    
    const countMatches = () => {
      if (!findText) {
        setMatchCount(0);
        return;
      }
      
      try {
        let regex: RegExp;
        if (useRegex) {
          regex = new RegExp(findText, caseSensitive ? 'g' : 'gi');
        } else {
          const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
        }
        const matches = content.match(regex);
        setMatchCount(matches ? matches.length : 0);
      } catch {
        setMatchCount(0);
      }
    };
    
    countMatches();
  }, [findText, content, useRegex, caseSensitive, isOpen]);

  const handleReplace = useCallback(() => {
    if (!findText) return;
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(findText, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }
      
      // Process replacement text: convert \n to actual newlines when regex is enabled
      let processedReplaceText = replaceText;
      if (useRegex) {
        processedReplaceText = replaceText
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
      }
      
      const newContent = content.replace(regex, processedReplaceText);
      onContentChange(newContent);
    } catch (err) {
      console.error('Replace error:', err);
    }
  }, [findText, replaceText, content, useRegex, caseSensitive, onContentChange]);

  const handleReplaceAll = useCallback(() => {
    handleReplace();
  }, [handleReplace]);

  if (!isOpen) return null;

  return (
    <div className="find-replace-panel">
      <div className="find-replace-header">
        <span 
          className="find-replace-title" 
          onDoubleClick={() => setShowReplace(!showReplace)}
          title="Double-click to toggle Find / Find and Replace"
        >
          {showReplace ? 'Find and Replace' : 'Find'}
        </span>
        <button className="icon-button close-button" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      
      <div className="find-replace-body">
        <div className="input-row">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="find-input"
            placeholder="Find..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            autoFocus
          />
          {findText && (
            <span className="match-count">{matchCount} matches</span>
          )}
        </div>
        
        {showReplace && (
          <div className="input-row">
            <Replace size={16} className="input-icon" />
            <input
              type="text"
              className="replace-input"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
          </div>
        )}
        
        <div className="options-row">
          <label className="option-checkbox" title="Use regular expressions">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
            />
            <span>.*</span>
          </label>
          <label className="option-checkbox" title="Match case">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            <span>Aa</span>
          </label>
        </div>
        
        {showReplace && (
          <div className="button-row">
            <button className="btn btn-secondary" onClick={handleReplace} disabled={!findText}>
              Replace
            </button>
            <button className="btn btn-primary" onClick={handleReplaceAll} disabled={!findText}>
              Replace All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindReplace;
