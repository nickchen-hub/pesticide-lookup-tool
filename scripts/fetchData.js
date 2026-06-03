/* global process */
import fs from 'fs/promises';
import path from 'path';

const PESTICIDE_LIST_API = 'https://data.moa.gov.tw/Service/OpenData/FromM/PesticideData.aspx';
const DB_OUTPUT_PATH = path.join(process.cwd(), 'public', 'pesticide_db.json');

// Set to 0 to process all active pesticides
const MAX_PROCESS = 0;
const CONCURRENCY_LIMIT = 50; // Batch request amount

// 只保留前端實際使用的欄位，邊抓邊精簡，避免產生超過 Node 字串上限 (~512MB) 的中間檔
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

function slimRecord(item, usageScopes) {
  const out = {};
  for (const key of KEEP_FIELDS) {
    if (key === 'usageScopes') continue;
    if (item[key] !== undefined) out[key] = item[key];
  }
  const seenScopes = new Set();
  out.usageScopes = (Array.isArray(usageScopes) ? usageScopes : []).reduce((acc, scope) => {
    const s = {};
    for (const sk of KEEP_SCOPE_FIELDS) {
      if (scope[sk] !== undefined) s[sk] = scope[sk];
    }
    const sig = JSON.stringify(s);
    if (!seenScopes.has(sig)) {
      seenScopes.add(sig);
      acc.push(s);
    }
    return acc;
  }, []);
  return out;
}

async function fetchAllPages() {
  const PAGE_SIZE = 9999;
  let skip = 0;
  let all = [];

  while (true) {
    const url = `${PESTICIDE_LIST_API}?$top=${PAGE_SIZE}&$skip=${skip}`;
    console.log(`Fetching page (skip=${skip})...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch main API: ${res.statusText}`);
    const page = await res.json();
    if (!page.length) break;
    all = all.concat(page);
    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchData() {
  console.log('Fetching pesticide list (all pages)...');
  const list = await fetchAllPages();

  // Filter out revoked pesticides
  const activePesticides = list.filter(p => !p['撤銷類別'] || p['撤銷類別'] === '');

  // 來源 API 會把同一產品依成分/分頁吐出多筆完全相同的列，先去重以免容量倍增、也省下重複的明細請求
  const seenKeys = new Set();
  const uniquePesticides = activePesticides.filter(p => {
    const k = `${p['許可證字'] || ''}-${p['許可證號'] || ''}-${p['農藥代號'] || ''}-${p['中文名稱'] || ''}`;
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    return true;
  });

  console.log(`Found ${list.length} pesticides. ${activePesticides.length} active, ${uniquePesticides.length} unique after dedup.`);
  
  const toProcess = MAX_PROCESS > 0 ? uniquePesticides.slice(0, MAX_PROCESS) : uniquePesticides;
  console.log(`Processing ${toProcess.length} pesticide details with concurrency matching (${CONCURRENCY_LIMIT} per batch)...`);

  const resultingDB = [];
  let processedCount = 0;

  async function processItem(item) {
    const url = item['農藥使用範圍'];
    if (!url) return;

    try {
      const scopeRes = await fetch(url.replace('http://', 'https://'), { signal: AbortSignal.timeout(10000) });
      if (scopeRes.ok) {
        const scopeData = await scopeRes.json();
        resultingDB.push(slimRecord(item, scopeData));
      } else {
        // 保留基本資料，就算沒有使用範圍（如農藥製廠商產品）
        resultingDB.push(slimRecord(item, []));
      }
    } catch {
      // 超時或錯誤：仍保留基本資料
      resultingDB.push(slimRecord(item, []));
    } finally {
      processedCount++;
      if (processedCount % 200 === 0 || processedCount === toProcess.length) {
        console.log(`Processed ${processedCount}/${toProcess.length}`);
      }
    }
  }

  // Process in chunks
  for (let i = 0; i < toProcess.length; i += CONCURRENCY_LIMIT) {
    const chunk = toProcess.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.allSettled(chunk.map(item => processItem(item)));
  }

  await fs.mkdir(path.dirname(DB_OUTPUT_PATH), { recursive: true });
  await fs.writeFile(DB_OUTPUT_PATH, JSON.stringify(resultingDB), 'utf-8');
  console.log(`Successfully generated ${DB_OUTPUT_PATH} with ${resultingDB.length} valid records.`);
}

fetchData().catch(console.error);
