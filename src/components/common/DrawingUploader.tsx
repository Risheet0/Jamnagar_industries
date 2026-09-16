import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, Eye, AlertCircle } from 'lucide-react';

export interface UploadedDrawingData {
  drawingUrl: string;
  drawingFileName: string;
  drawingFileSize: string;
  drawingUploadDate: string;
  suggestedDrawingNumber?: string;
}

interface DrawingUploaderProps {
  currentDrawingUrl?: string;
  currentDrawingFileName?: string;
  currentDrawingFileSize?: string;
  onDrawingUploaded: (data: UploadedDrawingData) => void;
  onDrawingRemoved?: () => void;
  onPreviewClick?: () => void;
  compact?: boolean;
}

export const DrawingUploader: React.FC<DrawingUploaderProps> = ({
  currentDrawingUrl,
  currentDrawingFileName,
  currentDrawingFileSize,
  onDrawingUploaded,
  onDrawingRemoved,
  onPreviewClick,
  compact = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    setUploadError(null);

    // Limit to 25MB for browser local storage & base64 encoding
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds 25MB limit. Please upload an optimized PDF or image.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const todayStr = new Date().toISOString().split('T')[0];
      const cleanFileName = file.name;
      const sizeStr = formatFileSize(file.size);

      // Auto-extract suggested drawing number from filename (e.g. DWG-2026-VALVE.pdf -> DWG-2026-VALVE.pdf)
      const suggestedDwg = cleanFileName;

      onDrawingUploaded({
        drawingUrl: dataUrl,
        drawingFileName: cleanFileName,
        drawingFileSize: sizeStr,
        drawingUploadDate: todayStr,
        suggestedDrawingNumber: suggestedDwg
      });

      setIsProcessing(false);
    };

    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const isImage = currentDrawingUrl?.startsWith('data:image/') ||
    currentDrawingFileName?.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i);

  const isPdf = currentDrawingUrl?.startsWith('data:application/pdf') ||
    currentDrawingFileName?.match(/\.pdf$/i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.dwg,.dxf,.step,.stp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {currentDrawingUrl || currentDrawingFileName ? (
        /* Display Attached Drawing Card */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: compact ? '8px 12px' : '12px 16px',
            backgroundColor: 'rgba(2, 132, 199, 0.05)',
            border: '1px solid var(--color-brand-primary)',
            borderRadius: 'var(--radius-md)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {/* Thumbnail or Icon */}
            {isImage && currentDrawingUrl ? (
              <div
                style={{
                  width: compact ? '36px' : '44px',
                  height: compact ? '36px' : '44px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <img
                  src={currentDrawingUrl}
                  alt="Drawing Thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: compact ? '36px' : '44px',
                  height: compact ? '36px' : '44px',
                  borderRadius: '6px',
                  backgroundColor: isPdf ? 'rgba(220, 38, 38, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                  color: isPdf ? '#dc2626' : 'var(--color-brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isPdf ? <FileText size={compact ? 18 : 22} /> : <ImageIcon size={compact ? 18 : 22} />}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                  title={currentDrawingFileName || 'Attached Engineering Drawing'}
                >
                  {currentDrawingFileName || 'Engineering Drawing Attached'}
                </span>
                <span className="status-badge status-badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                  Ready
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {isPdf ? 'PDF Technical Blueprint' : isImage ? 'Image CAD Drawing' : 'CAD Engineering Document'}
                {currentDrawingFileSize ? ` • ${currentDrawingFileSize}` : ''}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {onPreviewClick && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onPreviewClick}
                title="View Drawing Blueprint"
                style={{ gap: '4px', fontSize: '12px' }}
              >
                <Eye size={13} />
                <span>Preview</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Replace Drawing"
              style={{ fontSize: '12px', color: 'var(--color-brand-primary)' }}
            >
              Replace
            </button>

            {onDrawingRemoved && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon-only"
                onClick={onDrawingRemoved}
                title="Remove Attached Drawing"
                style={{ color: 'var(--color-status-danger-text)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Trigger Area */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: compact ? '14px 16px' : '22px 20px',
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(2, 132, 199, 0.05)' : 'var(--color-bg-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
          onMouseLeave={e => {
            if (!isDragging) e.currentTarget.style.borderColor = 'var(--color-border-default)';
          }}
        >
          <div
            style={{
              width: compact ? '32px' : '40px',
              height: compact ? '32px' : '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UploadCloud size={compact ? 18 : 22} />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {isProcessing ? 'Processing Drawing File...' : 'Click to Upload CAD / PDF Drawing'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Supports PDF, PNG, JPG, SVG, CAD Blueprints (Max 25MB)
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-status-danger-text)', fontSize: '12px' }}>
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
