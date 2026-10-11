import React, { useEffect, useRef, useState } from 'react';
import { Search, Sprout, Bug } from 'lucide-react';
import { getCurrentLang } from '../i18n/lang';

const isEnglish = getCurrentLang() === 'en';

// 換回中文：從清單點選的直接用記下的中文；英文模式再比對對照表（完全相符優先，其次是唯一的部分相符）；都沒有就原樣送出
const toChinese = (value, dict, picked) => {
  if (picked[value]) return picked[value];
  const q = value.trim().toLowerCase();
  if (!isEnglish || !dict || !q) return value;
  const entries = Object.entries(dict);
  const exact = entries.find(([, en]) => en.toLowerCase() === q);
  if (exact) return exact[0];
  const partial = entries.filter(([, en]) => en.toLowerCase().includes(q));
  return partial.length === 1 ? partial[0][0] : value;
};

function TermInput({ id, value, onChange, onPick, placeholder, dict }) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = dict
    ? Object.entries(dict).filter(([zh, en]) => zh.includes(q) || (isEnglish && en.toLowerCase().includes(q)))
    : [];

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
        required
      />
      {open && matches.length > 0 && (
        <ul className="term-suggestions">
          {matches.map(([zh, en]) => (
            <li
              key={zh}
              // 用 mouseDown 搶在 input blur 之前選取；其他語言時 textContent 是 Google 翻譯後的文字
              onMouseDown={(e) => {
                e.preventDefault();
                const label = isEnglish ? en : e.currentTarget.textContent.trim();
                onPick(label, zh);
                onChange(label);
                setOpen(false);
              }}
            >
              {isEnglish ? (
                <><span translate="no">{en}</span><span className="term-zh" translate="no">{zh}</span></>
              ) : zh}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchCard({ crop, setCrop, pest, setPest, onSearch }) {
  const [terms, setTerms] = useState(null);
  const picked = useRef({ crop: {}, pest: {} });

  useEffect(() => {
    import('../i18n/terms-en.json').then(m => setTerms(m.default));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(toChinese(crop, terms?.crops, picked.current.crop), toChinese(pest, terms?.pests, picked.current.pest));
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '800px', margin: '-2rem auto 2rem' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex" style={{ flexDirection: 'row', gap: '1.5rem', flexWrap: 'wrap' }}>

          {/* Crop Input */}
          <div className="input-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="crop" className="input-label flex items-center gap-2 mb-2">
              <Sprout size={18} color="var(--color-brand-primary)" />
              作物名稱
            </label>
            <TermInput
              id="crop"
              placeholder="例如：木瓜、柑橘、玫瑰"
              value={crop}
              onChange={setCrop}
              onPick={(label, zh) => { picked.current.crop[label] = zh; }}
              dict={terms?.crops}
            />
          </div>

          {/* Pest Input */}
          <div className="input-group" style={{ flex: '1 1 300px' }}>
            <label htmlFor="pest" className="input-label flex items-center gap-2 mb-2">
              <Bug size={18} color="var(--color-brand-primary)" />
              防治對象（病蟲害）
            </label>
            <TermInput
              id="pest"
              placeholder="例如：白粉病、葉蟎"
              value={pest}
              onChange={setPest}
              onPick={(label, zh) => { picked.current.pest[label] = zh; }}
              dict={terms?.pests}
            />
          </div>

        </div>

        <div className="flex justify-center mt-4 mb-2">
          <button type="submit" className="btn-primary flex items-center">
            <Search size={20} />
            尋找適用農藥
          </button>
        </div>
      </form>
    </div>
  );
}
