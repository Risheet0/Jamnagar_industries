import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { DrawingUploader, UploadedDrawingData } from '../components/common/DrawingUploader';
import { DrawingViewerModal } from '../components/common/DrawingViewerModal';
import { useNavigation } from '../context/NavigationContext';
import { useProducts } from '../context/ProductsContext';
import { useProduction } from '../context/ProductionContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Cpu,
  FileText,
  Clock,
  IndianRupee,
  Layers,
  Factory,
  Eye,
  Upload,
  Download,
  CheckCircle,
  FileCode
} from 'lucide-react';

interface ProductDetailPageProps {
  id?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ id }) => {
  const { currentPath, navigate, openQuickAdd } = useNavigation();
  const { getProduct, products, updateProduct } = useProducts();
  const { jobs } = useProduction();
  const { showToast } = useToast();

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload modal state
  const [pendingDrawing, setPendingDrawing] = useState<{
    drawingUrl?: string;
    drawingFileName?: string;
    drawingFileSize?: string;
    drawingUploadDate?: string;
    drawingRevision?: string;
  }>({});

  const pathParts = currentPath.split('/');
  const productId = id || pathParts[2] || (products[0]?.id ?? 'PRD-001');

  const product = getProduct(productId) || products[0];

  if (!product) {
    return (
      <div style={{ padding: '20px' }}>
        <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate('/products')}>
          Back to Products
        </Button>
        <p style={{ marginTop: '20px' }}>Product record not found.</p>
      </div>
    );
  }

  const linkedJobs = jobs.filter(
    j => j.productCode === product.productCode || j.productName === product.productName
  );

  const handleOpenUploadModal = () => {
    setPendingDrawing({
      drawingUrl: product.drawingUrl,
      drawingFileName: product.drawingFileName || product.drawing,
      drawingFileSize: product.drawingFileSize,
      drawingUploadDate: product.drawingUploadDate,
      drawingRevision: product.drawingRevision
    });
    setIsUploadModalOpen(true);
  };

  const handleSaveUploadedDrawing = () => {
    if (!product) return;

    updateProduct(product.id, {
      drawing: pendingDrawing.drawingFileName || product.drawing,
      drawingUrl: pendingDrawing.drawingUrl || product.drawingUrl,
      drawingFileName: pendingDrawing.drawingFileName || product.drawingFileName,
      drawingFileSize: pendingDrawing.drawingFileSize || product.drawingFileSize,
      drawingUploadDate: pendingDrawing.drawingUploadDate || new Date().toISOString().split('T')[0],
      drawingRevision: pendingDrawing.drawingRevision || product.drawingRevision
    });

    showToast({
      title: 'Engineering Drawing Updated',
      message: `${product.productCode} drawing updated to ${pendingDrawing.drawingRevision || product.drawingRevision}.`,
      type: 'success'
    });

    setIsUploadModalOpen(false);
  };

  const handleDownloadDrawing = () => {
    if (product.drawingUrl) {
      const link = document.createElement('a');
      link.href = product.drawingUrl;
      link.download = product.drawingFileName || product.drawing || `${product.productCode}-drawing.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setIsViewerOpen(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={product.productName}
        description={`Component Engineering Record • Code: ${product.productCode} • Category: ${product.category}`}
        breadcrumbs={[
          { label: 'Products', path: '/products' },
          { label: product.productCode }
        ]}
        badge={<StatusBadge status={product.status} />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/products')}
            >
              Back to Products
            </Button>
            <Button
              variant="secondary"
              icon={<Upload size={14} />}
              onClick={handleOpenUploadModal}
            >
              Upload Drawing Revision
            </Button>
            <Button
              variant="primary"
              icon={<Layers size={14} />}
              onClick={() => openQuickAdd('job')}
            >
              Issue Production Job
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        {/* Left Column: Technical Specifications & Engineering Blueprint Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Engineering CAD Blueprint Card */}
          <div className="card" style={{ borderColor: 'var(--color-brand-primary)' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="card-title">
                <FileCode size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Engineering Drawing Master</span>
              </div>
              <span className="status-badge status-badge-info" style={{ fontSize: '11px', fontWeight: 600 }}>
                {product.drawingRevision}
              </span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Blueprint Interactive Preview Surface */}
              <div
                onClick={() => setIsViewerOpen(true)}
                style={{
                  height: '180px',
                  backgroundColor: '#0a192f',
                  border: '1px solid #1e3a8a',
                  borderRadius: 'var(--radius-md)',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e3a8a'}
              >
                {product.drawingUrl && (product.drawingUrl.startsWith('data:image/') || product.drawing?.match(/\.(png|jpg|jpeg|svg|webp)$/i)) ? (
                  <img
                    src={product.drawingUrl}
                    alt="Drawing Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                  />
                ) : (
                  /* Mini Technical Schematic */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                        {product.drawingFileName || product.drawing}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        Click to Open Fullscreen CAD Blueprint
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#38bdf8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid #334155'
                  }}
                >
                  <Eye size={12} />
                  <span>View Drawing</span>
                </div>
              </div>

              {/* Drawing Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', backgroundColor: 'var(--color-bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>File Reference</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={product.drawingFileName || product.drawing}>
                    {product.drawingFileName || product.drawing}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Revision Level</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    {product.drawingRevision}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>File Size</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {product.drawingFileSize || 'Technical Doc'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Upload Status</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-status-success-solid)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    <span>Active Master</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '2px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Eye size={13} />}
                  onClick={() => setIsViewerOpen(true)}
                  style={{ justifyContent: 'center' }}
                >
                  View CAD
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={13} />}
                  onClick={handleOpenUploadModal}
                  style={{ justifyContent: 'center' }}
                >
                  Upload New
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={handleDownloadDrawing}
                  style={{ justifyContent: 'center' }}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Cpu size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Technical Specifications</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Product Code</div>
                <div style={{ marginTop: '2px' }}><span className="mono-code">{product.productCode}</span></div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Raw Material (BOM)</div>
                <div style={{ marginTop: '2px', fontWeight: 500 }}>{product.material}</div>
                {product.materialCode && (
                  <div className="mono-code" style={{ fontSize: '11px', marginTop: '2px' }}>{product.materialCode}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Finished Unit Weight</div>
                <div style={{ marginTop: '2px', fontWeight: 600 }}>{product.weight} {product.weightUnit}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Machining Cycle Time</div>
                <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} style={{ color: 'var(--color-brand-accent)' }} />
                  <span>{product.targetCycleTimeSec} seconds / unit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial & Production History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IndianRupee size={16} style={{ color: 'var(--color-status-success-solid)' }} />
                <span>Commercial & Pricing</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Finished Unit Price</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    ₹{product.unitPrice}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Output / Hour</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
                    {product.targetCycleTimeSec > 0 ? Math.round(3600 / product.targetCycleTimeSec) : 0} pcs/hr
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Standard Unit</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{product.unit}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Production Job Batches */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Factory size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Production Job Cards ({linkedJobs.length})</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {linkedJobs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Job #</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Produced / Required</th>
                      <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedJobs.map(j => (
                      <tr
                        key={j.id}
                        onClick={() => navigate(`/production/jobs/${j.id}`)}
                        style={{ borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '8px 14px' }}><span className="mono-code">{j.jobNumber}</span></td>
                        <td style={{ padding: '8px 14px', fontWeight: 500 }}>{j.customer}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }} className="tabular-nums">{j.producedQuantity} / {j.requiredQuantity} pcs</td>
                        <td style={{ padding: '8px 14px', textAlign: 'center' }}><StatusBadge status={j.status} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No production jobs issued for this component yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Drawing Viewer Modal */}
      {isViewerOpen && (
        <DrawingViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          product={product}
          onUploadNewDrawing={handleOpenUploadModal}
        />
      )}

      {/* Upload / Replace Drawing Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title={`Upload Engineering Drawing • ${product.productCode}`}
          maxWidth="580px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" icon={<Upload size={14} />} onClick={handleSaveUploadedDrawing}>
                Save Drawing Revision
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Attach a CAD PDF blueprint, technical specification sheet, or 2D image diagram for <strong>{product.productName}</strong>.
            </p>

            <DrawingUploader
              currentDrawingUrl={pendingDrawing.drawingUrl}
              currentDrawingFileName={pendingDrawing.drawingFileName}
              currentDrawingFileSize={pendingDrawing.drawingFileSize}
              onDrawingUploaded={(data: UploadedDrawingData) => {
                setPendingDrawing(prev => ({
                  ...prev,
                  drawingUrl: data.drawingUrl,
                  drawingFileName: data.drawingFileName,
                  drawingFileSize: data.drawingFileSize,
                  drawingUploadDate: data.drawingUploadDate
                }));
              }}
              onDrawingRemoved={() => {
                setPendingDrawing(prev => ({
                  ...prev,
                  drawingUrl: undefined,
                  drawingFileName: undefined,
                  drawingFileSize: undefined,
                  drawingUploadDate: undefined
                }));
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <FormField
                label="Drawing Reference Number"
                value={pendingDrawing.drawingFileName || ''}
                onChange={e => setPendingDrawing({ ...pendingDrawing, drawingFileName: e.target.value })}
                placeholder="e.g. DWG-2026-VALVE-01.pdf"
              />
              <FormField
                label="New Revision Code"
                value={pendingDrawing.drawingRevision || ''}
                onChange={e => setPendingDrawing({ ...pendingDrawing, drawingRevision: e.target.value })}
                placeholder="e.g. Rev 3.3"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
