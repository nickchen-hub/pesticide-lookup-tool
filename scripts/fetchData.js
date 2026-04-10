/* global process */
import fs from 'fs/promises';
import path from 'path';

const PESTICIDE_LIST_API = 'https://data.moa.gov.tw/Service/OpenData/FromM/PesticideData.aspx';
const DB_OUTPUT_PATH = path.join(process.cwd(), 'public', 'pesticide_db.json');

// Set to 0 to process all active pesticides
const MAX_PROCESS = 0; 
const CONCURRENCY_LIMIT = 50; // Batch request amount

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

  console.log(`Found ${list.length} pesticides. ${activePesticides.length} active.`);
  
  const toProcess = MAX_PROCESS > 0 ? activePesticides.slice(0, MAX_PROCESS) : activePesticides;
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
        resultingDB.push({
          ...item,
          usageScopes: Array.isArray(scopeData) ? scopeData : []
        });
      } else {
        // 保留基本資料，就算沒有使用範圍（如農藥製廠商產品）
        resultingDB.push({ ...item, usageScopes: [] });
      }
    } catch {
      // 超時或錯誤：仍保留基本資料
      resultingDB.push({ ...item, usageScopes: [] });
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
  await fs.writeFile(DB_OUTPUT_PATH, JSON.stringify(resultingDB, null, 2), 'utf-8');
  console.log(`Successfully generated ${DB_OUTPUT_PATH} with ${resultingDB.length} valid records.`);
}

fetchData().catch(console.error);
