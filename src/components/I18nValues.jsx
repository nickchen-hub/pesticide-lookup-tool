import React, { useEffect, useState } from 'react';
import { getCurrentLang } from '../i18n/lang';
import { LABELS } from '../i18n/labels';

const lang = getCurrentLang();
const isChinese = lang.startsWith('zh');

const DAY_UNITS = { en: 'days', ja: '日', ko: '일', vi: 'ngày', id: 'hari', th: 'วัน', es: 'días' };
const TIMES_UNITS = { en: 'times', ja: '倍', ko: '배', vi: 'lần', id: 'kali', th: 'เท่า', es: 'veces' };
// 用量單位改用國際通用符號，不需翻譯
const DOSE_UNITS = { 公升: 'L', 公斤: 'kg', 公克: 'g', 毫升: 'mL' };
const NUM_RANGE = String.raw`\d[\d,]*(?:\.\d+)?(?:\s*-\s*\d[\d,]*(?:\.\d+)?)?`;

// 有效成分：中文介面顯示中文名稱；外語一律顯示官方英文通用名稱（ISO），附小字中文
export function IngredientName({ zh, en }) {
  if (isChinese || !en) return <span translate="no">{zh}</span>;
  return (
    <span translate="no">
      {en}
      <span style={{ fontSize: '0.75em', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '0.4em' }}>{zh}</span>
    </span>
  );
}

// 天數（安全採收期、施藥間隔）：Google 會把「6日」誤譯成「6th」，外語時自行組數字與單位
export function DaysValue({ value, children }) {
  if (isChinese) return children;
  const v = String(value || '').trim();
  if (v === '' || v === '日' || v === '-' || v === '-日') return <span translate="no">-</span>;
  const m = v.match(/^(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)天?日?$/);
  if (!m) return children;
  return <span translate="no">{m[1]} {DAY_UNITS[lang] || 'days'}</span>;
}

// 稀釋倍數：純數字（或範圍）自行加單位；「稀釋至600公升」這類文字交給 Google 翻譯
export function DilutionValue({ value, children }) {
  if (isChinese) return children;
  const v = String(value || '').trim();
  if (v === '' || v === '-') return <span translate="no">-</span>;
  const m = v.match(new RegExp(`^(${NUM_RANGE})\\s*倍?$`));
  if (!m) return <span>{v}</span>;
  return <span translate="no">{m[1].replace(/\s+/g, '')} {TIMES_UNITS[lang] || 'times'}</span>;
}

// 每公頃用量：「0.2-0.3公升」→「0.2-0.3 L」；其他格式交給 Google 翻譯
export function DosageValue({ value, children }) {
  if (isChinese) return children;
  const v = String(value || '').trim();
  const m = v.match(new RegExp(`^(${NUM_RANGE})\\s*(公升|公斤|公克|毫升)$`));
  if (!m) return children;
  return <span translate="no">{m[1].replace(/\s+/g, '')} {DOSE_UNITS[m[2]]}</span>;
}

// 固定翻譯的短字詞（表頭、標籤）；查無翻譯時交給 Google
export function Label({ zh }) {
  const t = LABELS[zh]?.[lang];
  if (isChinese || !t) return zh;
  return <span translate="no">{t}</span>;
}

// 計算機單位
const CALC_UNITS = { 公升: 'L', 毫升: 'mL', '公克, 毫升': 'g / mL', 元: 'NT$' };
export function UnitLabel({ zh }) {
  if (isChinese) return zh;
  const t = zh === '倍' ? TIMES_UNITS[lang] : CALC_UNITS[zh];
  return t ? <span translate="no">{t}</span> : zh;
}

// 英文模式下作物／病蟲害名稱改用中英對照表，與搜尋框一致
let termsPromise;
export function TermName({ zh, kind }) {
  const [terms, setTerms] = useState(null);
  useEffect(() => {
    if (lang !== 'en') return;
    termsPromise ??= import('../i18n/terms-en.json').then(m => m.default);
    termsPromise.then(setTerms);
  }, []);
  const en = lang === 'en' && terms?.[kind]?.[zh];
  return en ? <span translate="no">{en}</span> : zh;
}
