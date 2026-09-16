import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Product } from '../../types';
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Upload
} from 'lucide-react';

interface DrawingViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUploadNewDrawing?: () => void;
}

export const DrawingViewerModal: React.FC<DrawingViewerModalProps> = ({
  isOpen,
  onClose,
  product,
  onUploadNewDrawing
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !product) return null;

  const isPdf = product.drawingUrl?.startsWith('data:application/pdf') || product.drawing?.toLowerCase().endsWith('.pdf');
  const isImage = product.drawingUrl?.startsWith('data:image/') || product.drawing?.match(/\.(png|jpg|jpeg|svg|webp)$/i);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    if (product.drawingUrl) {
      const link = document.createElement('a');
      link.href = product.drawingUrl;
      link.download = product.drawingFileName || product.drawing || `${product.productCode}-drawing.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a printable schematic download if no binary file attached
      const svgElement = document.getElementById('cad-blueprint-svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = svgUrl;
        link.download = `${product.productCode}-cad-blueprint.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgUrl);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Engineering Blueprint • ${product.productCode}`}
      maxWidth="980px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px', flexWrap: 'wrap' }}>
          {/* Zoom controls for images/schematics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleZoomOut}
              title="Zoom Out"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '45px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleZoomIn}
              title="Zoom In"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResetZoom}
              title="Reset Zoom (100%)"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onUploadNewDrawing && (
              <Button
                variant="secondary"
                icon={<Upload size={14} />}
                onClick={() => {
                  onClose();
                  onUploadNewDrawing();
                }}
              >
                Upload Revision
              </Button>
            )}

            <Button
              variant="secondary"
              icon={<Printer size={14} />}
              onClick={handlePrint}
            >
              Print Sheet
            </Button>

            <Button
              variant="primary"
              icon={<Download size={14} />}
              onClick={handleDownload}
            >
              Download File
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Drawing Specification Header Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #334155',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            fontSize: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Drawing Document</div>
            <div style={{ fontWeight: 600, color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={13} />
              <span>{product.drawingFileName || product.drawing}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revision Code</div>
            <div style={{ marginTop: '2px' }}>
              <span className="status-badge status-badge-info" style={{ fontSize: '10px', padding: '1px 8px' }}>
                {product.drawingRevision}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Material Specification</div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>{product.material} ({product.materialCode})</div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit Weight & Cycle</div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>
              {product.weight} {product.weightUnit} • {product.targetCycleTimeSec}s
            </div>
          </div>
        </div>

        {/* Blueprint Viewer Surface */}
        <div
          style={{
            backgroundColor: '#030712',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #1e293b',
            minHeight: '480px',
            maxHeight: '650px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '16px'
          }}
        >
          {product.drawingUrl && isPdf ? (
            /* Render Embedded PDF */
            <div style={{ width: '100%', height: '520px', display: 'flex', flexDirection: 'column' }}>
              <object
                data={product.drawingUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ borderRadius: '4px', border: 'none' }}
              >
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FileText size={48} style={{ color: '#38bdf8', marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600, color: '#f8fafc' }}>PDF Drawing Ready for Review</p>
                  <p style={{ fontSize: '12px', marginTop: '6px' }}>
                    {product.drawingFileName || product.drawing} ({product.drawingFileSize || 'Technical Doc'})
                  </p>
                  <div style={{ marginTop: '16px' }}>
                    <Button variant="primary" icon={<Download size={14} />} onClick={handleDownload}>
                      Download & Open PDF
                    </Button>
                  </div>
                </div>
              </object>
            </div>
          ) : product.drawingUrl && isImage ? (
            /* Render Attached Drawing Image with interactive zoom */
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={product.drawingUrl}
                alt={`${product.productName} Technical Drawing`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '480px',
                  borderRadius: '4px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          ) : (
            /* Render High-Precision Parametric CAD Blueprint Visualizer (SVG) */
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <svg
                id="cad-blueprint-svg"
                viewBox="0 0 800 480"
                style={{
                  width: '100%',
                  maxWidth: '760px',
                  height: 'auto',
                  backgroundColor: '#0a192f',
                  border: '2px solid #1e3a8a',
                  borderRadius: '4px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)'
                }}
              >
                {/* Blueprint Grid Lines */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#172a45" strokeWidth="0.75" />
                  </pattern>
                  <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="url(#grid)" />
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e3a8a" strokeWidth="1.25" opacity="0.6" />
                  </pattern>
                </defs>
                <rect width="800" height="480" fill="url(#grid-major)" />

                {/* Border Frame */}
                <rect x="15" y="15" width="770" height="450" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
                <rect x="20" y="20" width="760" height="440" fill="none" stroke="#38bdf8" strokeWidth="0.75" opacity="0.4" />

                {/* Engineering Title Block */}
                <g transform="translate(480, 360)">
                  <rect width="295" height="95" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="0" y1="30" x2="295" y2="30" stroke="#38bdf8" strokeWidth="0.75" />
                  <line x1="0" y1="62" x2="295" y2="62" stroke="#38bdf8" strokeWidth="0.75" />
                  <line x1="160" y1="30" x2="160" y2="95" stroke="#38bdf8" strokeWidth="0.75" />

                  <text x="10" y="18" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    DWG: {product.drawing}
                  </text>
                  <text x="10" y="46" fill="#94a3b8" fontSize="9" fontFamily="monospace">PART CODE:</text>
                  <text x="10" y="56" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">{product.productCode}</text>

                  <text x="170" y="46" fill="#94a3b8" fontSize="9" fontFamily="monospace">REVISION:</text>
                  <text x="170" y="56" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">{product.drawingRevision}</text>

                  <text x="10" y="78" fill="#94a3b8" fontSize="9" fontFamily="monospace">MATERIAL / WEIGHT:</text>
                  <text x="10" y="88" fill="#f8fafc" fontSize="9" fontFamily="monospace">{product.materialCode} ({product.weight}{product.weightUnit})</text>

                  <text x="170" y="78" fill="#94a3b8" fontSize="9" fontFamily="monospace">STATUS:</text>
                  <text x="170" y="88" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">APPROVED PROD</text>
                </g>

                {/* Center Crosshair Axis */}
                <line x1="60" y1="210" x2="440" y2="210" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="8,4,2,4" opacity="0.6" />
                <line x1="250" y1="60" x2="250" y2="360" stroke="#60a5fa" strokeWidth="0.75" strokeDasharray="8,4,2,4" opacity="0.6" />

                {/* Technical Component CAD Profile (Hex Valve/Fitting Schematic) */}
                <g stroke="#38bdf8" strokeWidth="2" fill="rgba(56, 189, 248, 0.08)" strokeLinejoin="round">
                  {/* Left Threaded Stem */}
                  <rect x="110" y="150" width="70" height="120" />
                  {/* Thread serrations */}
                  <line x1="110" y1="160" x2="180" y2="160" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="110" y1="175" x2="180" y2="175" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="110" y1="190" x2="180" y2="190" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="110" y1="230" x2="180" y2="230" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="110" y1="245" x2="180" y2="245" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="110" y1="260" x2="180" y2="260" stroke="#38bdf8" strokeWidth="1" />

                  {/* Central Hexagonal Body Collar */}
                  <path d="M 180 130 L 290 110 L 320 130 L 320 290 L 290 310 L 180 290 Z" />
                  <line x1="290" y1="110" x2="290" y2="310" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,2" />

                  {/* Internal Bore Hole */}
                  <rect x="110" y="185" width="280" height="50" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="5,3" />

                  {/* Right Flared Nipple */}
                  <path d="M 320 145 L 370 160 L 390 170 L 390 250 L 370 260 L 320 275 Z" />
                </g>

                {/* Dimension Arrows & Callouts */}
                {/* Horizontal Overall Length */}
                <g stroke="#f59e0b" strokeWidth="1" fill="#f59e0b">
                  <line x1="110" y1="90" x2="390" y2="90" />
                  <polygon points="110,90 120,87 120,93" />
                  <polygon points="390,90 380,87 380,93" />
                  <line x1="110" y1="80" x2="110" y2="145" strokeWidth="0.75" opacity="0.6" />
                  <line x1="390" y1="80" x2="390" y2="165" strokeWidth="0.75" opacity="0.6" />
                  <text x="250" y="82" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    L = 58.50 ± 0.05 mm
                  </text>
                </g>

                {/* Vertical Hex OD Dimension */}
                <g stroke="#f59e0b" strokeWidth="1" fill="#f59e0b">
                  <line x1="75" y1="110" x2="75" y2="310" />
                  <polygon points="75,110 72,120 78,120" />
                  <polygon points="75,310 72,300 78,300" />
                  <line x1="68" y1="110" x2="285" y2="110" strokeWidth="0.75" opacity="0.6" />
                  <line x1="68" y1="310" x2="285" y2="310" strokeWidth="0.75" opacity="0.6" />
                  <text x="65" y="215" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                    HEX 27.0 mm A/F
                  </text>
                </g>

                {/* Thread Tolerance Note */}
                <g transform="translate(130, 340)">
                  <line x1="0" y1="0" x2="30" y2="-40" stroke="#38bdf8" strokeWidth="1" />
                  <circle cx="30" cy="-40" r="2.5" fill="#38bdf8" />
                  <text x="0" y="16" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    1/2" BSPT Male (ISO 7-1)
                  </text>
                  <text x="0" y="28" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    Gauge Depth: 8.2mm ±0.2
                  </text>
                </g>

                {/* Surface Finish Symbol */}
                <g transform="translate(350, 115)">
                  <path d="M 0 0 L 10 16 L 20 0 Z" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="10" y1="16" x2="10" y2="28" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="25" y="12" fill="#e2e8f0" fontSize="10" fontFamily="monospace">Ra 0.8 µm</text>
                </g>

                {/* Watermark Label */}
                <text x="35" y="440" fill="#64748b" fontSize="10" fontFamily="monospace">
                  JAMNAGAR INDUSTRIAL ERP • CAD SPEC SHEET • ACCURACY CLASS DIN ISO 2768-m
                </text>
              </svg>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
