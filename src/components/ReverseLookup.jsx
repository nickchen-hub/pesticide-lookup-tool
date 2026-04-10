import { useState, useEffect } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Leaf, Beaker, FlaskConical, List, Package } from 'lucide-react';

export default function ReverseLookup({ initialData, onClearInitialData, onGoBackToForward }) {
  // Step: 'search' | 'selectIngredient' | 'selectFormulation' | 'results'
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [cachedIngredientProducts, setCachedIngredientProducts] = useState(null);

  // Step 2: ingredient options & selection
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Step 3: formulation options & selection
  const [formulationOptions, setFormulationOptions] = useState([]);
  const [selectedFormulation, setSelectedFormulation] = useState(null);

  // Step 4: final results
  const [scopes, setScopes] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [isProductListExpanded, setIsProductListExpanded] = useState(false);

  // Track if user navigated here from forward search results
  const [cameFromForward, setCameFromForward] = useState(false);

  // ─── Handle navigation from PesticideCard (forward tab) ──
  // ─── Handle navigation from PesticideCard (forward tab) ──
  useEffect(() => {
    if (!initialData) return;

    const ingredient = {
      name: initialData.name,
      code: initialData.code,
      englishName: initialData.englishName,
    };

    const formulation = {
      formulation: initialData.formulation,
      content: initialData.content,
    };

    // Set breadcrumb state
    setSearchedQuery(initialData.name);
    setSelectedIngredient(ingredient);
    setSelectedFormulation(formulation);

    const initData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/.netlify/functions/searchPesticides', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reverse_get_products', code: ingredient.code })
        });
        const allProducts = await res.json();
        setCachedIngredientProducts(allProducts);

        // Find all products matching ingredient code + formulation + content
        const products = allProducts.filter(p =>
          p['劑型'] === formulation.formulation &&
          p['含量'] === formulation.content
        );

        // Prioritize our vendors (光華 and 春匯)
        products.sort((a, b) => {
          const aName = a['廠商名稱'] || '';
          const bName = b['廠商名稱'] || '';
          const aKHC = aName.includes('光華') || aName.includes('春匯');
          const bKHC = bName.includes('光華') || bName.includes('春匯');
          if (aKHC && !bKHC) return -1;
          if (!aKHC && bKHC) return 1;
          return aName.localeCompare(bName, 'zh-TW');
        });

        // Collect unique scopes
        const scopeMap = new Map();
        for (const p of products) {
          for (const scope of (p.usageScopes || [])) {
            const key = `${scope['作物名稱']}_${scope['病蟲害名稱']}_${scope['稀釋倍數']}_${scope['每公頃使用用藥量']}`;
            if (!scopeMap.has(key)) {
              scopeMap.set(key, scope);
            }
          }
        }

        const sortedScopes = Array.from(scopeMap.values()).sort((a, b) =>
          (a['作物名稱'] || '').localeCompare(b['作物名稱'] || '', 'zh-TW')
        );

        setScopes(sortedScopes);
        setMatchedProducts(products);
        setStep('results');
        setCameFromForward(true);

        // Clear the initialData so it doesn't re-trigger
        if (onClearInitialData) onClearInitialData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, [initialData]);

  // ─── Step 1: Search ───────────────────────────────────────
  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setSearchedQuery(q);
    setNoResults(false);
    setLoading(true);

    try {
      const res = await fetch('/.netlify/functions/searchPesticides', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reverse_search', query: q })
      });
      const options = await res.json();

      if (!options || options.length === 0) {
        setNoResults(true);
        return;
      }

      setIngredientOptions(options);
      setStep('selectIngredient');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ─── Step 2: Select Ingredient ───────────────────────────
  const handleSelectIngredient = async (ingredient) => {
    setSelectedIngredient(ingredient);
    setLoading(true);

    try {
      const res = await fetch('/.netlify/functions/searchPesticides', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reverse_get_products', code: ingredient.code })
      });
      const allProducts = await res.json();
      setCachedIngredientProducts(allProducts);

      // Find all products with this 農藥代號 that have a 劑型
      const products = allProducts.filter(p => p['劑型']);

      // Group by 劑型 + 含量
      const formulationMap = new Map();
      for (const p of products) {
        const key = `${p['劑型']}_${p['含量']}`;
        if (!formulationMap.has(key)) {
          const scopeCount = (p.usageScopes || []).length;
          formulationMap.set(key, {
            formulation: p['劑型'] || '',
            content: p['含量'] || '',
            scopeCount,
            productCount: 0,
          });
        }
        formulationMap.get(key).productCount++;
      }

      const formulations = Array.from(formulationMap.values()).sort((a, b) => {
        // Sort by formulation then content
        const fComp = a.formulation.localeCompare(b.formulation);
        if (fComp !== 0) return fComp;
        return parseFloat(a.content) - parseFloat(b.content);
      });

      setFormulationOptions(formulations);
      setStep('selectFormulation');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Select Formulation ──────────────────────────
  const handleSelectFormulation = (formulation) => {
    setSelectedFormulation(formulation);

    // Find all products matching ingredient code + formulation + content from cache
    const products = (cachedIngredientProducts || []).filter(p =>
      p['劑型'] === formulation.formulation &&
      p['含量'] === formulation.content
    );

    // Prioritize our vendors (光華 and 春匯)
    products.sort((a, b) => {
      const aName = a['廠商名稱'] || '';
      const bName = b['廠商名稱'] || '';
      const aKHC = aName.includes('光華') || aName.includes('春匯');
      const bKHC = bName.includes('光華') || bName.includes('春匯');
      if (aKHC && !bKHC) return -1;
      if (!aKHC && bKHC) return 1;
      return aName.localeCompare(bName, 'zh-TW');
    });

    // Collect unique scopes
    const scopeMap = new Map();
    for (const p of products) {
      for (const scope of (p.usageScopes || [])) {
        const key = `${scope['作物名稱']}_${scope['病蟲害名稱']}_${scope['稀釋倍數']}_${scope['每公頃使用用藥量']}`;
        if (!scopeMap.has(key)) {
          scopeMap.set(key, scope);
        }
      }
    }

    const sortedScopes = Array.from(scopeMap.values()).sort((a, b) =>
      (a['作物名稱'] || '').localeCompare(b['作物名稱'] || '', 'zh-TW')
    );

    setScopes(sortedScopes);
    setMatchedProducts(products);
    setStep('results');
  };

  // ─── Navigation ──────────────────────────────────────────
  const goToSearch = () => {
    setStep('search');
    setNoResults(false);
    setIngredientOptions([]);
    setSelectedIngredient(null);
    setFormulationOptions([]);
    setSelectedFormulation(null);
    setScopes([]);
    setMatchedProducts([]);
  };

  const goToIngredients = () => {
    setStep('selectIngredient');
    setSelectedIngredient(null);
    setFormulationOptions([]);
    setSelectedFormulation(null);
    setScopes([]);
    setMatchedProducts([]);
  };

  const goToFormulations = () => {
    setStep('selectFormulation');
    setSelectedFormulation(null);
    setScopes([]);
    setMatchedProducts([]);
  };

  // ─── Formulation display helper ──────────────────────────
  const formulationLabel = (code) => {
    const map = {
      'EC': '乳劑',
      'SC': '水懸劑',
      'WP': '可溼性粉劑',
      'WG': '水分散性粒劑',
      'SP': '可溶性粉劑',
      'SL': '溶液劑',
      'GR': '粒劑',
      'DP': '粉劑',
      'CS': '膠囊懸著劑',
      'EW': '水基乳劑',
      'SE': '懸乳劑',
      'ME': '微乳劑',
      'TC': '原體',
      'TK': '原體',
      'SG': '可溶性粒劑',
      'RB': '餌劑',
      'UL': '超低容量劑',
      'OD': '油懸劑',
      'TB': '錠劑',
      'ZC': '膠囊懸著劑',
      'DC': '可分散濃縮劑',
      'FS': '種子處理液劑',
      'AL': '其他液劑',
      'VP': '蒸氣釋放劑',
      'CB': '餌塊',
      'PA': '糊劑',
      'GE': '凝膠劑',
      'ST': '種子處理劑',
      'LS': '溶膠劑',
      'AP': '其他粉劑',
      'GS': '凝膠劑',
      'WS': '可溼性種子處理粉劑',
      'FU': '煙霧劑',
      'GD': '凝膠餌劑',
      'PB': '板片劑',
      'DT': '直接施用錠劑',
      'CP': '膠囊懸著劑',
      'BAG': '袋裝劑',
      'WPSB': '可溼性粉劑（水溶性袋）',
      'SPSB': '可溶性粉劑（水溶性袋）',
      'XXSB': '其他劑型（水溶性袋）',
      'XX': '其他劑型',
    };
    return map[code] || code;
  };

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="animate-fade-in">

      {/* ── Breadcrumb ── */}
      {step !== 'search' && (
        <div className="wizard-breadcrumb">
          {cameFromForward && step === 'results' && onGoBackToForward ? (
            <>
              <button className="breadcrumb-btn" onClick={onGoBackToForward}>
                <ArrowLeft size={14} />
                返回搜尋結果
              </button>
              <ChevronRight size={14} className="breadcrumb-sep" />
              <span className="breadcrumb-active breadcrumb-btn">
                {selectedIngredient?.name} — {formulationLabel(selectedFormulation?.formulation)} {selectedFormulation?.content}
              </span>
            </>
          ) : (
            <>
              <button className="breadcrumb-btn" onClick={goToSearch}>
                <Search size={14} />
                搜尋
              </button>
              {(step === 'selectIngredient' || step === 'selectFormulation' || step === 'results') && (
                <>
                  <ChevronRight size={14} className="breadcrumb-sep" />
                  <button
                    className={`breadcrumb-btn ${step === 'selectIngredient' ? 'breadcrumb-active' : ''}`}
                    onClick={goToIngredients}
                  >
                    「{searchedQuery}」的成分
                  </button>
                </>
              )}
              {(step === 'selectFormulation' || step === 'results') && selectedIngredient && (
                <>
                  <ChevronRight size={14} className="breadcrumb-sep" />
                  <button
                    className={`breadcrumb-btn ${step === 'selectFormulation' ? 'breadcrumb-active' : ''}`}
                    onClick={goToFormulations}
                  >
                    {selectedIngredient.name}
                  </button>
                </>
              )}
              {step === 'results' && selectedFormulation && (
                <>
                  <ChevronRight size={14} className="breadcrumb-sep" />
                  <span className="breadcrumb-active breadcrumb-btn">
                    {formulationLabel(selectedFormulation.formulation)} {selectedFormulation.content}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step Indicator ── */}
      {step !== 'search' && (
        <div className="step-indicator">
          <div className={`step-dot ${step === 'selectIngredient' ? 'active' : (step === 'selectFormulation' || step === 'results') ? 'done' : ''}`}>
            <span>1</span>
          </div>
          <div className="step-line-container">
            <div className={`step-line ${(step === 'selectFormulation' || step === 'results') ? 'done' : ''}`} />
          </div>
          <div className={`step-dot ${step === 'selectFormulation' ? 'active' : step === 'results' ? 'done' : ''}`}>
            <span>2</span>
          </div>
          <div className="step-line-container">
            <div className={`step-line ${step === 'results' ? 'done' : ''}`} />
          </div>
          <div className={`step-dot ${step === 'results' ? 'active' : ''}`}>
            <span>3</span>
          </div>
        </div>
      )}

      {/* ── Step: Search ── */}
      {step === 'search' && (
        <>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              輸入農藥名稱查詢使用範圍
            </h2>
            <div className="flex gap-3" style={{ alignItems: 'stretch' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="例：菲克利、克凡派、HEXACONAZOLE..."
                className="input-field"
                style={{ flex: 1 }}
              />
              <button onClick={handleSearch} disabled={loading} className="btn-primary" style={{ borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}>
                {loading ? <div className="loader mr-2" style={{width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div> : <Search size={16} />} {loading ? '查詢中' : '查詢'}
              </button>
            </div>
          </div>

          {noResults && (
            <div className="empty-state">
              <Leaf size={48} color="#f43f5e" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e11d48', marginTop: '1rem' }}>找不到符合的農藥</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>請確認名稱是否正確，或嘗試輸入部分名稱。</p>
            </div>
          )}

          {!noResults && (
            <div className="empty-state">
              <Leaf size={48} color="var(--color-brand-light)" className="mb-4" />
              <p style={{ color: 'var(--color-text-secondary)' }}>輸入農藥有效成分中文名稱，查詢其核准使用的作物與病蟲害。</p>
            </div>
          )}
        </>
      )}

      {/* ── Step: Select Ingredient ── */}
      {step === 'selectIngredient' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button onClick={goToSearch} className="back-btn">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                選擇有效成分
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                搜尋「{searchedQuery}」找到 {ingredientOptions.length} 種相關有效成分，請選擇：
              </p>
            </div>
          </div>

          <div className="ingredient-grid">
            {ingredientOptions.map((opt, idx) => (
              <button
                key={opt.code}
                className="ingredient-card"
                onClick={() => handleSelectIngredient(opt)}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="ingredient-card-header">
                  <FlaskConical size={18} className="ingredient-icon" />
                  <span className="ingredient-name">{opt.name}</span>
                </div>
                <div className="ingredient-card-meta">
                  <span className="ingredient-en">{opt.englishName}</span>
                  <span className="ingredient-code">{opt.code}</span>
                </div>
                <div className="ingredient-card-footer">
                  <span className="ingredient-product-count">
                    <Package size={12} /> {opt.productCount} 個登記產品
                  </span>
                  <ChevronRight size={16} className="ingredient-arrow" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step: Select Formulation ── */}
      {step === 'selectFormulation' && selectedIngredient && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button onClick={goToIngredients} className="back-btn">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                選擇劑型與含量
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {selectedIngredient.name}（{selectedIngredient.englishName}）共有 {formulationOptions.length} 種劑型含量組合
              </p>
            </div>
          </div>

          <div className="formulation-grid">
            {formulationOptions.map((opt, idx) => (
              <button
                key={`${opt.formulation}_${opt.content}`}
                className="formulation-card"
                onClick={() => handleSelectFormulation(opt)}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="formulation-card-header">
                  <Beaker size={20} className="formulation-icon" />
                  <div>
                    <span className="formulation-type">{formulationLabel(opt.formulation)}</span>
                    <span className="formulation-code">{opt.formulation}</span>
                  </div>
                </div>
                <div className="formulation-content">{opt.content}</div>
                <div className="formulation-card-footer">
                  <span className="formulation-scope-count">
                    <List size={12} /> {opt.scopeCount} 筆使用範圍
                  </span>
                  <span className="formulation-product-count">
                    <Package size={12} /> {opt.productCount} 廠牌
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step: Results ── */}
      {step === 'results' && selectedIngredient && selectedFormulation && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button onClick={cameFromForward && onGoBackToForward ? onGoBackToForward : goToFormulations} className="back-btn">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedIngredient.name} — {formulationLabel(selectedFormulation.formulation)} {selectedFormulation.content}
                </h2>
                {(() => {
                  const p = matchedProducts[0];
                  if (!p) return null;
                  // Since we already attached pre-computed mechanism in searchPesticides.js
                  let mechanism = p._mechanism || null;
                  
                  return mechanism ? <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>作用機制：{mechanism}</span> : null;
                })()}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                共 {matchedProducts.length} 個登記產品，{scopes.length} 筆核准使用範圍
              </p>
            </div>
          </div>

          {/* 產品清單 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setIsProductListExpanded(!isProductListExpanded)}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: isProductListExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600, transition: 'var(--transition-fast)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              查看 {matchedProducts.length} 種廠牌產品清單
              {isProductListExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
            </button>
            {isProductListExpanded && (
              <div className="animate-fade-in" style={{ border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                {matchedProducts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: i < matchedProducts.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {p['廠牌名稱'] || p['中文名稱'] || '-'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {p['許可證字']} {p['許可證號']}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      產品廠商：{p['廠商名稱'] || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 使用範圍表格 */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            核准使用範圍（{scopes.length} 筆）
          </h3>
          <div className="scope-table-wrapper">
            <table className="scope-table">
              <thead>
                <tr>
                  <th className="scope-th sticky-col">作物</th>
                  <th className="scope-th">病蟲害</th>
                  <th className="scope-th">每公頃每次用量</th>
                  <th className="scope-th">稀釋倍數</th>
                  <th className="scope-th">使用時期</th>
                  <th className="scope-th">施藥間隔</th>
                  <th className="scope-th">施用次數</th>
                  <th className="scope-th">安全採收期</th>
                  <th className="scope-th">施藥方法</th>
                  <th className="scope-th">注意事項</th>
                  <th className="scope-th">說明</th>
                  <th className="scope-th">核准日期</th>
                  <th className="scope-th">原始登記廠商</th>
                </tr>
              </thead>
              <tbody>
                {scopes.map((scope, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'scope-row-even' : 'scope-row-odd'}>
                    <td className="scope-td scope-crop sticky-col">{scope['作物名稱'] || '-'}</td>
                    <td className="scope-td">{scope['病蟲害名稱'] || '-'}</td>
                    <td className="scope-td">{scope['每公頃使用用藥量'] || '-'}</td>
                    <td className="scope-td scope-highlight">
                      {scope['稀釋倍數'] || '-'}
                      {scope['稀釋倍數'] && !String(scope['稀釋倍數']).includes('倍') ? ' 倍' : ''}
                    </td>
                    <td className="scope-td scope-text-small">{scope['使用時期'] || '-'}</td>
                    <td className="scope-td">{scope['施藥間隔'] || '-'}</td>
                    <td className="scope-td">{scope['施用次數'] || '-'}</td>
                    <td className="scope-td scope-highlight">
                      {scope['安全採收期'] || '-'}
                      {scope['安全採收期'] && !String(scope['安全採收期']).includes('日') && scope['安全採收期'] !== '-' ? '日' : ''}
                    </td>
                    <td className="scope-td scope-text-small">{scope['施藥方法'] || '-'}</td>
                    <td className="scope-td scope-text-small">{scope['注意事項'] || '-'}</td>
                    <td className="scope-td">
                      {scope['說明'] && (
                        <span className={`scope-badge ${scope['說明'] === '延伸使用' ? 'scope-badge-extend' : 'scope-badge-normal'}`}>
                          {scope['說明']}
                        </span>
                      )}
                      {!scope['說明'] && '-'}
                    </td>
                    <td className="scope-td scope-text-small">{scope['核准日期'] || '-'}</td>
                    <td className="scope-td scope-text-small">{scope['原始登記廠商名稱'] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
