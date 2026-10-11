import React, { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { getCurrentLang } from '../i18n/lang';

const LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'es', label: 'Español' },
  { code: 'zh-CN', label: '简体中文' },
];

const setGoogTransCookie = (value) => {
  const expires = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = window.location.hostname;
  document.cookie = `googtrans=${value}; path=/${expires}`;
  document.cookie = `googtrans=${value}; path=/; domain=${host}${expires}`;
  document.cookie = `googtrans=${value}; path=/; domain=.${host}${expires}`;
};

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(getCurrentLang);

  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'zh-TW', autoDisplay: false },
        'google_translate_element'
      );
    };
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }, []);

  const handleChange = (e) => {
    const code = e.target.value;
    setLang(code);
    // 切回中文或首次切換時，用 cookie + 重新整理最穩定
    if (code === 'zh-TW') {
      setGoogTransCookie('');
    } else {
      setGoogTransCookie(`/zh-TW/${code}`);
    }
    window.location.reload();
  };

  return (
    <div className="lang-switcher" translate="no">
      <Languages size={16} color="var(--color-brand-primary)" />
      <select value={lang} onChange={handleChange} aria-label="選擇語言 / Language">
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <div id="google_translate_element" style={{ display: 'none' }} />
    </div>
  );
}

export function TranslationNotice() {
  if (getCurrentLang() === 'zh-TW') return null;
  return (
    <div className="translation-notice">
      本翻譯為機器翻譯，內容以中文版為準。Machine translation — the Chinese version prevails.
    </div>
  );
}
