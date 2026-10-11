// Google Translate 以 cookie「googtrans=/zh-TW/en」記住目前語言
export const getCurrentLang = () => {
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : 'zh-TW';
};
