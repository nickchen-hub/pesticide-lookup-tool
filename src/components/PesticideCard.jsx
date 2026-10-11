import React, { useState } from 'react';
import { Target, Droplet, Clock, ChevronDown, ChevronUp, ExternalLink, Scale } from 'lucide-react';
import { IngredientName, DaysValue, DilutionValue, DosageValue } from './I18nValues';

const PRIORITY_VENDORS = ['光華', '春匯'];

export default function PesticideCard({ groupData, onNavigateToReverse }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const matchedScope = groupData.matchedScope;
  const mechanism = groupData.mechanism;

  const RAW_LICENSE_TYPES = ['農藥原進', '農藥原製'];

  // Sorting logic based on priority vendors
  const sortedProducts = [...groupData.products].filter(p => !RAW_LICENSE_TYPES.includes(p['許可證字'])).sort((a, b) => {
    const aCurrent = a['廠商名稱'] || '';
    const bCurrent = b['廠商名稱'] || '';
    const isAPriority = PRIORITY_VENDORS.some(v => aCurrent.includes(v));
    const isBPriority = PRIORITY_VENDORS.some(v => bCurrent.includes(v));

    if (isAPriority && !isBPriority) return -1;
    if (!isAPriority && isBPriority) return 1;
    return aCurrent.localeCompare(bCurrent, 'zh-TW'); // fallback to regular sorting
  });

  return (
    <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                <IngredientName zh={groupData.name} en={groupData.products.find(p => p['英文名稱'])?.['英文名稱']} />
              </h3>
              {mechanism && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>
                  作用機制：{mechanism}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--color-brand-primary)', fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: 700 }}>
              {groupData.formulation} {groupData.content}
            </p>
          </div>
          <span className="badge">
            {groupData.classification}
          </span>
        </div>

        {/* Aggregated Usage Scope Info */}
        {matchedScope && (
          <div style={{ backgroundColor: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} /> 使用方式
            </h4>
            <div className="flex justify-between mb-2" style={{ fontSize: '0.875rem' }}>
              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}><Droplet size={14} /> 稀釋倍數:</span>
              <span style={{ fontWeight: 600 }}><DilutionValue value={matchedScope['稀釋倍數']}><span translate="no">{matchedScope['稀釋倍數']}</span> {matchedScope['稀釋倍數'].includes('倍') ? '' : '倍'}</DilutionValue></span>
            </div>
            <div className="flex justify-between mb-2" style={{ fontSize: '0.875rem' }}>
              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}><Scale size={14} /> 每公頃每次用量:</span>
              <span style={{ fontWeight: 600 }}><DosageValue value={matchedScope['每公頃使用用藥量']}>{matchedScope['每公頃使用用藥量'] || '-'}</DosageValue></span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.875rem' }}>
              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}><Clock size={14} /> 安全採收期:</span>
              <span style={{ fontWeight: 600 }}><DaysValue value={matchedScope['安全採收期']}>{matchedScope['安全採收期']} {matchedScope['安全採收期'] && (matchedScope['安全採收期'].includes('日') || matchedScope['安全採收期'] === '-') ? '' : '日'}</DaysValue></span>
            </div>
            <div className="flex flex-col mt-3" style={{ fontSize: '0.875rem', padding: '0.75rem 0 0', borderTop: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>使用時期:</span>
              <span style={{ lineHeight: 1.4 }}>{matchedScope['使用時期'] || '-'}</span>
            </div>
          </div>
        )}

        {/* Link to full use range */}
        {onNavigateToReverse && (
          <button
            onClick={() => onNavigateToReverse(groupData)}
            style={{
              width: '100%',
              padding: '0.6rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'var(--transition-normal)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <ExternalLink size={14} /> 查看完整使用範圍
          </button>
        )}
      </div>

      <div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600, transition: 'var(--transition-fast)' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          查看 {sortedProducts.length} 種廠牌產品清單
          {isExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
        </button>

        {isExpanded && (
          <div className="animate-fade-in" style={{ marginTop: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {sortedProducts.map((p, idx) => {
              const vendor = p['廠商名稱'] || '';
              const isPriority = PRIORITY_VENDORS.some(v => vendor.includes(v));
              return (
                <div
                  key={p['許可證號'] + idx}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx < sortedProducts.length - 1 ? '1px solid var(--color-border)' : 'none',
                    backgroundColor: isPriority ? 'rgba(5, 150, 105, 0.04)' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <span translate="no" style={{ fontWeight: isPriority ? 700 : 600, fontSize: '0.9rem', color: isPriority ? 'var(--color-brand-dark)' : 'var(--color-text-primary)' }}>
                      {p['廠牌名稱'] || p['中文名稱'] || '-'}
                    </span>
                    <span translate="no" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      {p['許可證字']} {p['許可證號']}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    產品廠商：<span translate="no">{vendor || '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
