import React, { useState } from 'react';
import { Modal } from './Modal';
import { Product } from '../../types';
import {
  RotateCcw
} from 'lucide-react';

interface Component3DViewerModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Component3DViewerModal: React.FC<Component3DViewerModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe' | 'exploded' | 'thermal'>('solid');
  const [activeTab, setActiveTab] = useState<'specs' | 'metallurgy' | 'cnc'>('specs');

  if (!product) return null;

  const handleRotate = (delta: number) => {
    setRotationAngle(prev => (prev + delta + 360) % 360);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="3D Precision Component Hologram Inspector"
      maxWidth="860px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: 3D Holographic Stage */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '380px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.4), inset 0 0 30px rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
        >
          {/* Hologram Scanner Line */}
          <div className="hologram-scanner" />

          {/* Grid lines background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.6,
              pointerEvents: 'none'
            }}
          />

          {/* Top Stage Badges */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 5
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
              <span className="live-dot pulse" style={{ width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%' }} />
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>3D CAD MODEL: {product.productCode}</span>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 10px', borderRadius: '999px' }}>
              Angle: {rotationAngle}°
            </div>
          </div>

          {/* 3D Component Render with Simulated Rotation */}
          <div
            style={{
              position: 'relative',
              width: '240px',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1000px',
              margin: '20px 0'
            }}
          >
            <img
              src="/assets/3d/brass_valve_component_3d.jpg"
              alt={product.productName}
              style={{
                width: '220px',
                height: '220px',
                objectFit: 'contain',
                borderRadius: '16px',
                transform: `rotate(${rotationAngle}deg) scale(${viewMode === 'exploded' ? 1.08 : 1})`,
                filter:
                  viewMode === 'wireframe'
                    ? 'invert(1) hue-rotate(180deg) brightness(1.2)'
                    : viewMode === 'thermal'
                    ? 'hue-rotate(90deg) saturate(2)'
                    : 'none',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>

          {/* 3D Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 5,
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => handleRotate(-45)}
              className="btn btn-ghost btn-sm"
              style={{ color: '#e2e8f0', padding: '4px 8px' }}
              title="Rotate Left 45°"
            >
              ⟲ -45°
            </button>
            <button
              type="button"
              onClick={() => setRotationAngle(0)}
              className="btn btn-ghost btn-sm"
              style={{ color: '#38bdf8', padding: '4px 8px' }}
              title="Reset View"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleRotate(45)}
              className="btn btn-ghost btn-sm"
              style={{ color: '#e2e8f0', padding: '4px 8px' }}
              title="Rotate Right 45°"
            >
              ⟳ +45°
            </button>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['solid', 'wireframe', 'exploded', 'thermal'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === mode ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                    color: viewMode === mode ? '#ffffff' : '#94a3b8'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Engineering & Metallurgy Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {product.productName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="mono-code">{product.productCode}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Category: {product.category}</span>
            </div>
          </div>

          {/* Sub Navigation Pills */}
          <div className="glass-pill-nav" style={{ padding: '3px' }}>
            <button
              type="button"
              className={`glass-pill-tab ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
              style={{ padding: '5px 12px', fontSize: '11px' }}
            >
              Specifications
            </button>
            <button
              type="button"
              className={`glass-pill-tab ${activeTab === 'metallurgy' ? 'active' : ''}`}
              onClick={() => setActiveTab('metallurgy')}
              style={{ padding: '5px 12px', fontSize: '11px' }}
            >
              Metallurgy
            </button>
            <button
              type="button"
              className={`glass-pill-tab ${activeTab === 'cnc' ? 'active' : ''}`}
              onClick={() => setActiveTab('cnc')}
              style={{ padding: '5px 12px', fontSize: '11px' }}
            >
              CNC Routing
            </button>
          </div>

          {/* Tab 1: Specs */}
          {activeTab === 'specs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Unit Selling Price</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>₹{product.unitPrice}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Standard Weight</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{product.weight} {product.weightUnit}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Raw Material Required</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.material}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Target Cycle Time</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{product.targetCycleTimeSec} sec/pc</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.06)', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand-primary)', marginBottom: '4px' }}>
                  Dimensional Tolerance Standard
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  ISO 2768-m Precision Class • BSPT/NPT Male Thread Ground Finish • 100% Go/No-Go Gauge Verified.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Metallurgy */}
          {activeTab === 'metallurgy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Alloy Grade: CW617N / IS 319 Free Cutting Brass</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span>Copper (Cu)</span>
                      <strong>58.0% - 60.0%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                      <div style={{ width: '60%', height: '100%', background: '#d97706', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span>Zinc (Zn)</span>
                      <strong>38.0% - 40.0%</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                      <div style={{ width: '38%', height: '100%', background: '#0284c7', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span>Lead (Pb)</span>
                      <strong>1.6% - 2.5% (Free Machining)</strong>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                      <div style={{ width: '15%', height: '100%', background: '#64748b', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: CNC Routing */}
          {activeTab === 'cnc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>1. CNC Lathe Turning & Facing</span>
                <strong style={{ fontSize: '12px' }}>14.2 sec/pc</strong>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>2. Thread Rolling & Chamfering</span>
                <strong style={{ fontSize: '12px' }}>8.0 sec/pc</strong>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>3. Degreasing & Ultrasonic Wash</span>
                <strong style={{ fontSize: '12px' }}>Continuous</strong>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>4. Nickel / Chrome Electroplating</span>
                <strong style={{ fontSize: '12px' }}>Batch (40 min)</strong>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '10px' }}>
            <button
              type="button"
              className="btn-3d-action"
              onClick={onClose}
            >
              Done Inspecting
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
