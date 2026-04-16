import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EncodingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentEncoding: string;
  onEncodingChange: (encoding: string, withBom: boolean) => void;
}

const ENCODINGS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'GB2312', label: 'GB2312 (Chinese Simplified)' },
  { value: 'GBK', label: 'GBK' },
  { value: 'GB18030', label: 'GB18030' },
  { value: 'BIG5', label: 'BIG5 (Chinese Traditional)' },
  { value: 'SHIFT_JIS', label: 'Shift_JIS (Japanese)' },
  { value: 'EUC-JP', label: 'EUC-JP (Japanese)' },
  { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin-1)' },
  { value: 'WINDOWS-1252', label: 'Windows-1252' },
];

const EncodingDialog: React.FC<EncodingDialogProps> = ({
  isOpen,
  onClose,
  currentEncoding,
  onEncodingChange,
}) => {
  const [selectedEncoding, setSelectedEncoding] = useState(currentEncoding);
  const [withBom, setWithBom] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    onEncodingChange(selectedEncoding, withBom);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Encoding</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="dialog-body">
          <div className="form-group">
            <label>Select Encoding:</label>
            <select
              className="encoding-select"
              value={selectedEncoding}
              onChange={(e) => setSelectedEncoding(e.target.value)}
            >
              {ENCODINGS.map((enc) => (
                <option key={enc.value} value={enc.value}>
                  {enc.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={withBom}
                onChange={(e) => setWithBom(e.target.checked)}
              />
              <span>Include BOM (Byte Order Mark) - UTF-8 only</span>
            </label>
          </div>
          
          <div className="current-encoding">
            Current: <strong>{currentEncoding}</strong>
          </div>
        </div>
        
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncodingDialog;
