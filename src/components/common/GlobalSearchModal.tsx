import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, User, Package, Box, Layers, ArrowRight, X } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useWorkers } from '../../context/WorkerContext';
import { useMaterials } from '../../context/MaterialsContext';
import { useProducts } from '../../context/ProductsContext';
import { useProduction } from '../../context/ProductionContext';

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, closeGlobalSearch, navigate } = useNavigation();
  const { workers } = useWorkers();
  const { materials } = useMaterials();
  const { products } = useProducts();
  const { jobs } = useProduction();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const matchedWorkers = workers.filter(
      w => w.name.toLowerCase().includes(q) || w.workerId.toLowerCase().includes(q) || w.skill.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedMaterials = materials.filter(
      m => m.materialName.toLowerCase().includes(q) || m.materialCode.toLowerCase().includes(q) || m.grade.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedProducts = products.filter(
      p => p.productName.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedJobs = jobs.filter(
      j => j.jobNumber.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q) || j.productName.toLowerCase().includes(q)
    ).slice(0, 3);

    const totalCount = matchedWorkers.length + matchedMaterials.length + matchedProducts.length + matchedJobs.length;
    return { workers: matchedWorkers, materials: matchedMaterials, products: matchedProducts, jobs: matchedJobs, totalCount };
  }, [query, workers, materials, products, jobs]);

  const handleSelect = (route: string) => {
    navigate(route);
    closeGlobalSearch();
  };

  if (!isGlobalSearchOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
      onClick={closeGlobalSearch}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--color-bg-surface)'
        }}>
          <Search size={20} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search worker, material, product, job..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-primary)'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-icon-only btn-sm"
            >
              <X size={16} />
            </button>
          )}
          <span className="kbd-shortcut">ESC</span>
        </div>

        {/* Results Container */}
        <div style={{ padding: '12px', overflowY: 'auto', maxHeight: '500px' }}>
          {!query.trim() && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <div>Type code or name to quickly jump to any record.</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <span className="mono-code">WRK-001</span>
                <span className="mono-code">MAT-BRS-ROD-25</span>
                <span className="mono-code">PRD-BRS-FIT-01</span>
                <span className="mono-code">JOB-2026-001</span>
              </div>
            </div>
          )}

          {searchResults && searchResults.totalCount === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No matches found for "<strong>{query}</strong>" across workers, materials, products, or jobs.
            </div>
          )}

          {searchResults && searchResults.totalCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Workers Result */}
              {searchResults.workers.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Workers / Karigar
                  </div>
                  {searchResults.workers.map(w => (
                    <div
                      key={w.id}
                      onClick={() => handleSelect(`/workers/${w.id}`)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={16} style={{ color: 'var(--color-brand-primary)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {w.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {w.skill} • {w.department}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mono-code">{w.workerId}</span>
                        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Materials Result */}
              {searchResults.materials.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Materials & Stock
                  </div>
                  {searchResults.materials.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(`/materials/${m.id}`)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={16} style={{ color: 'var(--color-brand-accent)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {m.materialName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Stock: {m.currentStock} {m.unit} • {m.grade}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mono-code">{m.materialCode}</span>
                        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Products Result */}
              {searchResults.products.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Finished Products
                  </div>
                  {searchResults.products.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(`/products/${p.id}`)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Box size={16} style={{ color: 'var(--color-status-purple-text)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {p.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {p.drawing} ({p.drawingRevision}) • {p.material}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mono-code">{p.productCode}</span>
                        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Production Jobs Result */}
              {searchResults.jobs.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Production Job Cards
                  </div>
                  {searchResults.jobs.map(j => (
                    <div
                      key={j.id}
                      onClick={() => handleSelect(`/production/jobs/${j.id}`)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={16} style={{ color: 'var(--color-status-warning-solid)' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {j.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Customer: {j.customer} • Worker: {j.assignedWorker}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mono-code">{j.jobNumber}</span>
                        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--color-text-muted)'
        }}>
          <div>Quick desktop offline index</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd className="kbd-shortcut">↵</kbd> Select</span>
            <span><kbd className="kbd-shortcut">ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
