import { useState, useEffect } from 'react';
import SearchCard from './components/SearchCard';
import ResultList from './components/ResultList';
import ReverseLookup from './components/ReverseLookup';
import DilutionCalculator from './components/DilutionCalculator';
import MechanismSearch from './components/MechanismSearch';
import FeedbackModal from './components/FeedbackModal';
import LanguageSwitcher, { TranslationNotice } from './components/LanguageSwitcher';
import { Sprout } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activePage, setActivePage] = useState('forward');

  const [crop, setCrop] = useState('');
  const [pest, setPest] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);

  // For navigating from forward results to reverse lookup
  const [reverseInitialData, setReverseInitialData] = useState(null);

  // SearchCard 會把英文名稱轉成中文後傳進來
  const handleSearch = async (searchCrop = crop, searchPest = pest) => {
    if (!searchCrop || !searchPest) return;

    setHasSearched(true);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/.netlify/functions/searchPesticides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'forward', crop: searchCrop, pest: searchPest }),
      });

      if (!res.ok) {
        throw new Error('伺服器發生錯誤，請稍後再試。');
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigate from forward card to reverse lookup results
  const navigateToReverse = (groupData) => {
    setReverseInitialData({
      name: groupData.name,
      code: groupData.products[0]?.['農藥代號'] || '',
      englishName: groupData.products[0]?.['英文名稱'] || '',
      formulation: groupData.formulation,
      content: groupData.content,
    });
    setActivePage('reverse');
  };

  // Go back to forward results from reverse lookup
  const goBackToForward = () => {
    setActivePage('forward');
  };

  return (
    <>
      <header className="app-header">
        <LanguageSwitcher />
        <div className="container animate-fade-in">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div className="flex items-center gap-6">
              <a href="https://www.agridoctor.com.tw/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="光華化學" className="header-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              </a>
              <div style={{ textAlign: 'left', marginTop: '0.35rem' }}>
                <h1 className="header-title">農藥作物病蟲害查詢器</h1>
                <p className="header-subtitle">為您的農作物量身尋找精準適合的防治對策</p>
              </div>
            </div>
            {/* Tab 切換 */}
            <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'rgba(5,150,105,0.08)', padding: '0.35rem', borderRadius: '999px', border: '1px solid rgba(5,150,105,0.15)' }}>
            <button
              onClick={() => setActivePage('forward')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activePage === 'forward' ? 'white' : 'transparent',
                color: activePage === 'forward' ? 'var(--color-brand-primary)' : '#4b6358',
                boxShadow: activePage === 'forward' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              作物 + 病蟲害 → 農藥
            </button>
            <button
              onClick={() => { setActivePage('reverse'); setReverseInitialData(null); }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activePage === 'reverse' ? 'white' : 'transparent',
                color: activePage === 'reverse' ? 'var(--color-brand-primary)' : '#4b6358',
                boxShadow: activePage === 'reverse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              農藥名稱 → 使用範圍
            </button>
            <button
              onClick={() => setActivePage('mechanism')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activePage === 'mechanism' ? 'white' : 'transparent',
                color: activePage === 'mechanism' ? 'var(--color-brand-primary)' : '#4b6358',
                boxShadow: activePage === 'mechanism' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              作用機制查詢
            </button>
            <button
              onClick={() => setActivePage('calculator')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activePage === 'calculator' ? 'white' : 'transparent',
                color: activePage === 'calculator' ? 'var(--color-brand-primary)' : '#4b6358',
                boxShadow: activePage === 'calculator' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              稀釋 / 成本計算
            </button>
          </div>
          </div>
        </div>
      </header>
      <TranslationNotice />
      
      <main className="container" style={{ minHeight: '60vh', paddingBottom: '4rem', paddingTop: '3rem' }}>
        {activePage === 'forward' && (
          <SearchCard
            crop={crop}
            setCrop={setCrop}
            pest={pest}
            setPest={setPest}
            onSearch={handleSearch}
          />
        )}
        
        {loading ? (
          <div className="text-center mt-8 animate-fade-in">
            <Sprout size={48} className="mb-4" style={{ animation: 'pulse 2s infinite', opacity: 0.5, color: 'var(--color-brand-light)', margin: '0 auto' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>正在搜尋資料中，請稍候...</p>
          </div>
        ) : error ? (
          <div className="text-center mt-8 animate-fade-in text-red-500">
            <p>系統發生錯誤：{error}</p>
          </div>
        ) : activePage === 'reverse' ? (
          <ReverseLookup initialData={reverseInitialData} onClearInitialData={() => setReverseInitialData(null)} onGoBackToForward={goBackToForward} />
        ) : activePage === 'mechanism' ? (
          <MechanismSearch onNavigateToReverse={navigateToReverse} />
        ) : activePage === 'calculator' ? (
          <DilutionCalculator />
        ) : (
          <ResultList
            results={results}
            hasSearched={hasSearched}
            crop={crop}
            pest={pest}
            onNavigateToReverse={navigateToReverse}
          />
        )}
      </main>

      <footer className="text-center" style={{ padding: '2rem 0', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        <div className="container">
          <p>數據來源：農業部開放資料平臺 (data.moa.gov.tw) - 本系統僅供參考，請依照農藥標示使用。</p>
        </div>
      </footer>

      <FeedbackModal />
    </>
  );
}

export default App;
