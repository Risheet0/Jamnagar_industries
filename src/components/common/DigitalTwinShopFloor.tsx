import React, { useState } from 'react';
import {
  Boxes,
  Cpu,
  Truck,
  Activity,
  Maximize2,
  X
} from 'lucide-react';
import { useProduction } from '../../context/ProductionContext';

interface Hotspot {
  id: string;
  name: string;
  type: 'cnc' | 'vmc' | 'rack' | 'qc' | 'truck';
  x: number; // percentage
  y: number; // percentage
  status: 'Running' | 'Idle' | 'Maintenance' | 'Loading';
  oee: number;
  temperature?: string;
  rpm?: number;
  toolWear?: number;
  operator?: string;
  activeJob?: string;
  details: string;
}

export const DigitalTwinShopFloor: React.FC = () => {
  const { jobs } = useProduction();

  const [activeTab, setActiveTab] = useState<'floor' | 'racks' | 'dispatch' | 'analytics'>('floor');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRackCell, setSelectedRackCell] = useState<{ rack: string; slot: string; item: string; stock: string } | null>(null);

  const hotspots: Hotspot[] = [
    {
      id: 'cnc-01',
      name: 'CNC Turning Bay 01 (Doosan Lynx)',
      type: 'cnc',
      x: 18,
      y: 62,
      status: 'Running',
      oee: 94.2,
      temperature: '48.5°C',
      rpm: 3200,
      toolWear: 18,
      operator: 'Rajeshbhai Panchal',
      activeJob: jobs[0]?.jobNumber || 'JOB-2026-001',
      details: 'High-speed precision turning on CW614N brass flare tube fittings. Tolerance: ±0.015mm.'
    },
    {
      id: 'vmc-02',
      name: 'VMC 4-Axis Center (BFW Chakra)',
      type: 'vmc',
      x: 32,
      y: 54,
      status: 'Running',
      oee: 91.8,
      temperature: '52.1°C',
      rpm: 4800,
      toolWear: 24,
      operator: 'Hareshbhai Vaghela',
      activeJob: jobs[1]?.jobNumber || 'JOB-2026-002',
      details: 'Milling high-pressure SS 304 valve stems. Carbide endmill cycle active.'
    },
    {
      id: 'conveyor-01',
      name: 'Automated Brass Conveyor Line',
      type: 'cnc',
      x: 46,
      y: 74,
      status: 'Running',
      oee: 98.0,
      details: 'Continuous pneumatic transfer of finished brass turned parts to wash and degreasing cell.'
    },
    {
      id: 'rack-storage',
      name: 'High-Bay Automated Racks A1-A4',
      type: 'rack',
      x: 68,
      y: 28,
      status: 'Running',
      oee: 96.5,
      details: 'Primary raw material bar stock storage. 48 slots capacity for Brass CW614N, SS 304, and Copper rods.'
    },
    {
      id: 'qc-station',
      name: 'Laser Optical CMM Inspection Cell',
      type: 'qc',
      x: 42,
      y: 44,
      status: 'Running',
      oee: 99.1,
      details: 'First-piece and in-process laser non-contact dimensional inspection. Pass rate: 99.4%.'
    },
    {
      id: 'dispatch-bay',
      name: 'Outward Logistics Dock #01',
      type: 'truck',
      x: 84,
      y: 64,
      status: 'Loading',
      oee: 88.0,
      details: 'Direct plant loading dock for container truck (GJ-10-TX-4421). Outward export shipment.'
    }
  ];

  // 4x6 Warehouse Matrix (A12051, A12063, A12045, A12146) matching reference UI
  const rackColumns = [
    { code: 'A12051', label: 'Rack A1', item: 'CW614N Brass Rod Ø25mm', stock: '1.2K / 1.5K kg', fillRate: 80 },
    { code: 'A12063', label: 'Rack A2', item: 'SS 304 Hex Bar 19mm', stock: '1.8K / 2.0K kg', fillRate: 90 },
    { code: 'A12045', label: 'Rack A3', item: 'EN8 Carbon Steel Bar 32mm', stock: '950 / 1.2K kg', fillRate: 75 },
    { code: 'A12146', label: 'Rack A4', item: 'Copper Electrolytic Rod 16mm', stock: '620 / 800 kg', fillRate: 77 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Top Floating Capsule Navbar (Exact Reference Style) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="glass-pill-nav">
          <button
            className={`glass-pill-tab ${activeTab === 'floor' ? 'active' : ''}`}
            onClick={() => setActiveTab('floor')}
          >
            <Cpu size={14} />
            <span>3D Digital Twin Floor</span>
          </button>
          <button
            className={`glass-pill-tab ${activeTab === 'racks' ? 'active-orange' : ''}`}
            onClick={() => setActiveTab('racks')}
          >
            <Boxes size={14} />
            <span>Warehouse Racks (A1-A4)</span>
          </button>
          <button
            className={`glass-pill-tab ${activeTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatch')}
          >
            <Truck size={14} />
            <span>Outward Logistics & Fleet</span>
          </button>
          <button
            className={`glass-pill-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={14} />
            <span>Machine Telemetry</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.7)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.9)' }}>
            <span className="hotspot-pulse-green" style={{ width: '8px', height: '8px' }} />
            <span>Digital Twin Synced (5ms)</span>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '7px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}
          >
            <Maximize2 size={13} />
            <span>{isFullscreen ? 'Compact View' : 'Focus 3D'}</span>
          </button>
        </div>
      </div>

      {/* ── Main 3D Digital Twin Hero Scene (Floor Tab) ── */}
      {activeTab === 'floor' && (
        <div
          className="card"
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)',
            minHeight: isFullscreen ? '700px' : '480px',
            transition: 'all 0.3s ease'
          }}
        >
          {/* 3D Render Background */}
          <img
            src="/assets/3d/smart_factory_3d.jpg"
            alt="3D Digital Twin Factory Floor"
            style={{
              width: '100%',
              height: isFullscreen ? '700px' : '480px',
              objectFit: 'cover',
              display: 'block',
              filter: 'contrast(1.02) saturate(1.05)'
            }}
          />

          {/* Interactive Floating 3D Hotspots */}
          {hotspots.map(spot => {
            const isSelected = selectedHotspot?.id === spot.id;
            const pulseClass =
              spot.type === 'truck'
                ? 'hotspot-pulse-orange'
                : spot.type === 'rack'
                ? 'hotspot-pulse-orange'
                : 'hotspot-pulse';

            return (
              <div
                key={spot.id}
                onClick={() => setSelectedHotspot(spot)}
                style={{
                  position: 'absolute',
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 20
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isSelected
                      ? 'linear-gradient(135deg, #0284c7, #1e3a8a)'
                      : 'rgba(255, 255, 255, 0.92)',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    padding: '6px 12px',
                    borderRadius: '24px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    fontSize: '11px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                  }}
                >
                  <span className={pulseClass} />
                  <span>{spot.name.split(' (')[0]}</span>
                </div>
              </div>
            );
          })}

          {/* Top Left Floating Digital Twin KPI Glass Card (Reference Style) */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.1)',
              maxWidth: '280px',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Plant Floor Output
              </div>
              <span className="status-badge status-badge-success" style={{ fontSize: '10px' }}>
                Active Run
              </span>
            </div>

            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontFamily: 'monospace' }}>
              12,321 <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>pcs/shift</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>OEE Efficiency</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>94.6%</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Cycle Pace</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>42 sec/pc</div>
              </div>
            </div>
          </div>

          {/* Top Right Floating Logistics Truck Status Card (Exact Reference UI) */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.1)',
              minWidth: '260px',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Truck size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Vadilal Outward Express</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>TRK-GJ10-2026-0442</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
              <span>Loading Progress</span>
              <strong style={{ color: '#ea580c' }}>72% (3,600 / 5,000 pcs)</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg, #ea580c, #f97316)', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '8px' }}>
              <span>Dock #01 (Bay 2)</span>
              <span>Departing: 18:30 IST</span>
            </div>
          </div>

          {/* Hotspot Inspection Popup Modal HUD */}
          {selectedHotspot && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                padding: '18px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 1)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
                width: '90%',
                maxWidth: '620px',
                zIndex: 30,
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedHotspot.name}</h3>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Status: <strong style={{ color: '#059669' }}>{selectedHotspot.status}</strong> • OEE: <strong>{selectedHotspot.oee}%</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: 1.4 }}>
                {selectedHotspot.details}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Spindle RPM</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedHotspot.rpm ? `${selectedHotspot.rpm} RPM` : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Spindle Temp</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>{selectedHotspot.temperature || 'Ambient'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Tool Insert Wear</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{selectedHotspot.toolWear ? `${selectedHotspot.toolWear}%` : 'Optimal'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Assigned Karigar</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedHotspot.operator || 'Automatic'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3D Warehouse Rack Matrix & Heatmap (Matching Reference UI Grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '16px' }}>
        {/* Left: High-Bay Rack Slot Matrix Grid */}
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Warehouse High-Bay Racking Matrix (A12051 - A12146)
                </h3>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Live slot allocation across automated vertical storage aisles
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', background: '#f97316', borderRadius: '2px' }} />
                <span>Occupied (85%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', background: '#ffffff', border: '1px dashed #94a3b8', borderRadius: '2px' }} />
                <span>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }} />
                <span>Full / Locked</span>
              </div>
            </div>
          </div>

          {/* Matrix Columns (A12051, A12063, A12045, A12146) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {rackColumns.map(col => (
              <div key={col.code} style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{col.code}</span>
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>{col.fillRate}%</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {col.label}: {col.item.split(' ')[0]}
                </div>

                {/* 6 Tier Slot Grid (L1 to L6) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(slotIdx => {
                    const isOccupied = (slotIdx * 7) % 10 < 8;
                    const isFull = slotIdx === 5 || slotIdx === 14;
                    const slotClass = isFull ? 'rack-slot-full' : isOccupied ? 'rack-slot-occupied' : 'rack-slot-empty';

                    return (
                      <div
                        key={slotIdx}
                        className={`rack-slot ${slotClass}`}
                        title={`${col.code}-S${slotIdx}: ${isOccupied ? col.item : 'Empty Slot'}`}
                        onClick={() => setSelectedRackCell({
                          rack: col.code,
                          slot: `S${slotIdx}`,
                          item: isOccupied ? col.item : 'Empty Slot (Available)',
                          stock: isOccupied ? `${Math.round(col.fillRate * 15)} kg in rack` : '0 kg'
                        })}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedRackCell && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                Selected Cell: <strong style={{ color: '#ea580c', fontFamily: 'monospace' }}>{selectedRackCell.rack}-{selectedRackCell.slot}</strong> • <strong>{selectedRackCell.item}</strong> ({selectedRackCell.stock})
              </div>
              <button
                onClick={() => setSelectedRackCell(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontWeight: 600 }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Right: 3D Render Machine & Rack Showcase Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* CNC Machine 3D Card */}
          <div
            className="card card-3d-hover"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 255, 0.85))'
            }}
          >
            <img
              src="/assets/3d/cnc_machine_3d.jpg"
              alt="CNC Machine 3D"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                objectFit: 'cover',
                boxShadow: '0 8px 16px rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.9)'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>CNC Cell Alpha</span>
                <span className="status-badge status-badge-success" style={{ fontSize: '10px' }}>Active 94%</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Dual-Spindle Turning Center (Doosan Lynx)
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
                Current Batch: 1/2" Male Hex Flare Fittings
              </div>
            </div>
          </div>

          {/* Automated High-Bay Rack 3D Card */}
          <div
            className="card card-3d-hover"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 247, 237, 0.85))'
            }}
          >
            <img
              src="/assets/3d/warehouse_racks_3d.jpg"
              alt="Warehouse Racks 3D"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                objectFit: 'cover',
                boxShadow: '0 8px 16px rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.9)'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Aisle 12 Raw Storage</span>
                <span className="status-badge status-badge-warning" style={{ fontSize: '10px' }}>85% Full</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Automated Crane & Forklift Lane B1-B4
              </div>
              <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, marginTop: '4px' }}>
                Brass CW614N Stock: 2,450 kg Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
