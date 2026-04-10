import React from 'react';
import PesticideCard from './PesticideCard';
import { Leaf } from 'lucide-react';

export default function ResultList({ results, hasSearched, crop, pest, onNavigateToReverse }) {
  if (!hasSearched) {
    return (
      <div className="empty-state animate-fade-in">
        <Leaf size={48} color="var(--color-brand-light)" className="mb-4" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>準備好尋找最適合的農藥了嗎？</h2>
        <p className="mt-2">請在上方輸入您種植的「作物」以及想防治的「病蟲害」，系統會即刻為您篩選出可用的農藥產品！</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div style={{ padding: '2rem', backgroundColor: '#fff1f2', borderRadius: '50%', marginBottom: '1rem' }}>
          <Leaf size={48} color="#f43f5e" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#e11d48' }}>找不到相符合的農藥</h2>
        <p className="mt-2 text-center" style={{ maxWidth: '500px' }}>
          目前沒有查詢到同時適用於「<strong>{crop}</strong>」並能防治「<strong>{pest}</strong>」的農藥。
          <br /><br />
          <span style={{ fontSize: '0.875rem' }}>建議您檢查關鍵字是否有錯別字，或者嘗試使用更廣泛的名詞進行搜尋。</span>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          找到 {results.length} 種適用農藥成分
        </h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          搜尋條件: {crop} + {pest}
        </span>
      </div>
      
      <div className="results-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {results.map((group) => (
          <PesticideCard key={group.id} groupData={group} onNavigateToReverse={onNavigateToReverse} />
        ))}
      </div>
    </div>
  );
}
