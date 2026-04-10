import { useState, useEffect } from 'react';
import { Search, Leaf } from 'lucide-react';
import PesticideCard from './PesticideCard';

const MECHANISM_TYPES = [
  { id: 'IRAC', label: 'IRAC 殺蟲劑' },
  { id: 'FRAC', label: 'FRAC 殺菌劑' },
  { id: 'HRAC', label: 'HRAC 除草劑' },
];

export default function MechanismSearch({ onNavigateToReverse }) {
  const [mechType, setMechType] = useState('IRAC');
  const [codeInput, setCodeInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMechanisms, setAllMechanisms] = useState(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await fetch('/.netlify/functions/searchPesticides', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mechanism_init' })
        });
        const data = await res.json();
        setAllMechanisms(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCodes();
  }, []);

  const currentType = MECHANISM_TYPES.find(t => t.id === mechType);
  const availableCodes = allMechanisms ? allMechanisms[mechType] : [];

  const handleSearch = async () => {
    if (!codeInput.trim()) return;
    setHasSearched(true);
    setLoading(true);

    try {
      const res = await fetch('/.netlify/functions/searchPesticides', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mechanism_search', mechType, codeInput })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search card */}
      <div className="card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
          選擇作用機制類別
        </h2>

        {/* Type buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {MECHANISM_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setMechType(t.id); setCodeInput(''); setHasSearched(false); setResults([]); }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: `2px solid ${mechType === t.id ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                background: mechType === t.id ? 'var(--color-brand-primary)' : 'white',
                color: mechType === t.id ? 'white' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code input with datalist dropdown */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={codeInput}
            onChange={e => setCodeInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              fontSize: '1rem',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="">— 請選擇 {mechType} 代碼 —</option>
            {availableCodes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <div className="loader" style={{width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div> : <Search size={16} />} {loading ? '查詢中' : '查詢'}
          </button>
        </div>
      </div>

      {/* Results */}
      {!hasSearched ? (
        <div className="empty-state animate-fade-in">
          <Leaf size={48} color="var(--color-brand-light)" className="mb-4" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            查詢具有特定作用機制的藥劑
          </h2>
          <p className="mt-2">選擇 IRAC / FRAC / HRAC 類別後，從下拉選單選擇代碼，即可列出所有符合的藥劑。</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <div style={{ padding: '2rem', backgroundColor: '#fff1f2', borderRadius: '50%', marginBottom: '1rem' }}>
            <Leaf size={48} color="#f43f5e" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#e11d48' }}>找不到相符合的農藥</h2>
          <p className="mt-2 text-center" style={{ maxWidth: '500px' }}>
            沒有找到 <strong>{mechType} - {codeInput}</strong> 的相關藥劑。<br />
            <span style={{ fontSize: '0.875rem' }}>請確認代碼是否正確，或嘗試從下拉選單選擇。</span>
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              找到 {results.length} 種符合的農藥成分
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {mechType} - {codeInput}
            </span>
          </div>
          <div className="results-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {results.map(group => (
              <PesticideCard key={group.id} groupData={group} onNavigateToReverse={onNavigateToReverse} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
