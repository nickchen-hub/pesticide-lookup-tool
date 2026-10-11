import { useState, useCallback } from 'react';
import { Droplets, FlaskConical, Coins, Calculator } from 'lucide-react';
import { UnitLabel } from './I18nValues';

const TABS = [
  { id: 'water', label: '水量計算', icon: Droplets, color: '#0ea5e9' },
  { id: 'dosage', label: '藥量計算', icon: FlaskConical, color: '#8b5cf6' },
  { id: 'cost', label: '成本計算', icon: Coins, color: '#f59e0b' },
];

function NumberInput({ id, label, unit, value, onChange, placeholder }) {
  return (
    <div className="calc-input-group">
      <label className="calc-input-label" htmlFor={id}>{label}</label>
      <div className="calc-input-row">
        <input
          id={id}
          type="number"
          className="calc-input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '請輸入數值'}
          min="0"
          step="any"
        />
        <span className="calc-input-unit"><UnitLabel zh={unit} /></span>
      </div>
    </div>
  );
}

function ResultDisplay({ label, value, unit, accentColor }) {
  const displayValue = value !== null && value !== undefined && !isNaN(value)
    ? Number(value).toFixed(1)
    : '—';

  return (
    <div className="calc-result-box" style={{ '--accent': accentColor }}>
      <span className="calc-result-label">{label}</span>
      <div className="calc-result-value-row">
        <span className="calc-result-value">{displayValue}</span>
        <span className="calc-result-unit"><UnitLabel zh={unit} /></span>
      </div>
    </div>
  );
}

export default function DilutionCalculator() {
  const [activeTab, setActiveTab] = useState('water');

  // Tab 1: 水量計算
  const [t1Ratio, setT1Ratio] = useState('');
  const [t1Dosage, setT1Dosage] = useState('');

  // Tab 2: 藥量計算
  const [t2Ratio, setT2Ratio] = useState('');
  const [t2Water, setT2Water] = useState('');

  // Tab 3: 成本計算
  const [t3Price, setT3Price] = useState('');
  const [t3Volume, setT3Volume] = useState('');
  const [t3Dosage, setT3Dosage] = useState('');

  const isNum = (v) => v !== '' && !isNaN(Number(v)) && Number(v) >= 0;

  // 水量 = 藥量(g,ml) × 稀釋倍數 / 1000
  const waterResult = isNum(t1Ratio) && isNum(t1Dosage)
    ? (Number(t1Dosage) * Number(t1Ratio)) / 1000
    : null;

  // 藥量 = 水量(公升) × 1000 / 稀釋倍數
  // Original formula: (water / ratio) * 1000
  const dosageResult = isNum(t2Ratio) && isNum(t2Water) && Number(t2Ratio) > 0
    ? (Number(t2Water) / Number(t2Ratio)) * 1000
    : null;

  // 成本 = 產品價格 / 產品容量 × 用藥量
  const costResult = isNum(t3Price) && isNum(t3Volume) && isNum(t3Dosage) && Number(t3Volume) > 0
    ? (Number(t3Price) / Number(t3Volume)) * Number(t3Dosage)
    : null;

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="calc-container animate-fade-in">
      <div className="calc-header">
        <div className="calc-header-icon">
          <Calculator size={24} />
        </div>
        <div>
          <h2 className="calc-title">農藥稀釋倍數與成本計算</h2>
          <p className="calc-subtitle">快速計算稀釋水量、用藥量與使用成本</p>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="calc-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`calc-tab ${isActive ? 'calc-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? { '--tab-color': tab.color } : {}}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 水量計算 */}
      {activeTab === 'water' && (
        <div className="calc-body animate-fade-in">
          <div className="calc-inputs-card">
            <NumberInput
              id="t1-ratio"
              label="稀釋倍數"
              unit="倍"
              value={t1Ratio}
              onChange={setT1Ratio}
              placeholder="例：1000"
            />
            <NumberInput
              id="t1-dosage"
              label="藥量"
              unit="公克, 毫升"
              value={t1Dosage}
              onChange={setT1Dosage}
              placeholder="例：20"
            />
          </div>
          <ResultDisplay
            label="水量"
            value={waterResult}
            unit="公升"
            accentColor="#0ea5e9"
          />
        </div>
      )}

      {/* Tab 2: 藥量計算 */}
      {activeTab === 'dosage' && (
        <div className="calc-body animate-fade-in">
          <div className="calc-inputs-card">
            <NumberInput
              id="t2-ratio"
              label="稀釋倍數"
              unit="倍"
              value={t2Ratio}
              onChange={setT2Ratio}
              placeholder="例：1000"
            />
            <NumberInput
              id="t2-water"
              label="水量"
              unit="公升"
              value={t2Water}
              onChange={setT2Water}
              placeholder="例：20"
            />
          </div>
          <ResultDisplay
            label="藥量"
            value={dosageResult}
            unit="公克, 毫升"
            accentColor="#8b5cf6"
          />
        </div>
      )}

      {/* Tab 3: 成本計算 */}
      {activeTab === 'cost' && (
        <div className="calc-body animate-fade-in">
          <div className="calc-inputs-card">
            <NumberInput
              id="t3-price"
              label="產品價格"
              unit="元"
              value={t3Price}
              onChange={setT3Price}
              placeholder="例：400"
            />
            <NumberInput
              id="t3-volume"
              label="產品容量"
              unit="毫升"
              value={t3Volume}
              onChange={setT3Volume}
              placeholder="例：1000"
            />
            <NumberInput
              id="t3-dosage"
              label="用藥量"
              unit="毫升"
              value={t3Dosage}
              onChange={setT3Dosage}
              placeholder="例：20"
            />
          </div>
          <ResultDisplay
            label="成本"
            value={costResult}
            unit="元"
            accentColor="#f59e0b"
          />
        </div>
      )}

      <p className="calc-footnote">
        💡 提示：輸入數值後即時計算結果，無需按下按鈕。
      </p>
    </div>
  );
}
