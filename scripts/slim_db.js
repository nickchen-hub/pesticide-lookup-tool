// 只保留前端實際使用的欄位，大幅縮小 pesticide_db.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT = path.join(__dirname, '../public/pesticide_db.json');
const OUTPUT = path.join(__dirname, '../public/pesticide_db.json');

const KEEP_FIELDS = new Set([
  '中文名稱', '英文名稱', '農藥代號', '許可證字', '許可證號',
  '廠牌名稱', '廠商名稱', '劑型', '含量',
  '農藥分類中文意義', '農藥類別中文意義',
  'IRAC殺蟲劑抗藥性', 'FRAC殺菌劑抗藥性', 'HRAC除草劑抗藥性',
  'usageScopes',
]);

const KEEP_SCOPE_FIELDS = new Set([
  '作物名稱', '病蟲害名稱', '稀釋倍數', '每公頃使用用藥量',
  '施藥方法', '施用次數', '施藥間隔', '安全採收期',
  '使用時期', '延伸使用', '注意事項', '說明', '原始登記廠商名稱',
]);

console.log('讀取資料庫...');
const raw = fs.readFileSync(INPUT, 'utf8');
console.log(`原始大小：${(raw.length / 1024 / 1024).toFixed(1)} MB`);

const data = JSON.parse(raw);
console.log(`共 ${data.length} 筆資料，開始精簡...`);

const slimmed = data.map(item => {
  const out = {};
  for (const key of KEEP_FIELDS) {
    if (item[key] !== undefined) {
      if (key === 'usageScopes' && Array.isArray(item[key])) {
        out[key] = item[key].map(scope => {
          const s = {};
          for (const sk of KEEP_SCOPE_FIELDS) {
            if (scope[sk] !== undefined) s[sk] = scope[sk];
          }
          return s;
        });
      } else {
        out[key] = item[key];
      }
    }
  }
  return out;
});

const output = JSON.stringify(slimmed);
console.log(`精簡後大小：${(output.length / 1024 / 1024).toFixed(1)} MB`);
fs.writeFileSync(OUTPUT, output);
console.log('完成！');
