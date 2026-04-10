const fs = require('fs');
const path = require('path');

let dbCache = null;
let mechMapCache = null;
const PRIORITY_VENDORS = ['光华', '春匯', '光華'];
const RAW_LICENSE_TYPES = ['農藥原進', '農藥原製'];

// Load DB
function getDb() {
  if (!dbCache) {
    let targetPath = path.resolve(process.cwd(), 'public/pesticide_db.json');
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve(__dirname, '../../public/pesticide_db.json');
    }
    const dataString = fs.readFileSync(targetPath, 'utf8');
    dbCache = JSON.parse(dataString);
  }
  return dbCache;
}

// Generate MechMap once
function getMechMap(db) {
  if (!mechMapCache) {
    const map = { IRAC: {}, FRAC: {}, HRAC: {} };
    for (const p of db) {
      const eng = p['英文名稱'];
      if (!eng || eng.includes('+')) continue;
      const cleanEng = eng.trim().toUpperCase();
      if (p['IRAC殺蟲劑抗藥性'] && p['IRAC殺蟲劑抗藥性'].trim()) map.IRAC[cleanEng] = p['IRAC殺蟲劑抗藥性'].trim();
      if (p['FRAC殺菌劑抗藥性'] && p['FRAC殺菌劑抗藥性'].trim()) map.FRAC[cleanEng] = p['FRAC殺菌劑抗藥性'].trim();
      if (p['HRAC除草劑抗藥性'] && p['HRAC除草劑抗藥性'].trim()) map.HRAC[cleanEng] = p['HRAC除草劑抗藥性'].trim();
    }
    mechMapCache = map;
  }
  return mechMapCache;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const db = getDb();
    const action = body.action;

    // ─── Forward Search ──────────────────────────────
    if (action === 'forward') {
      const { crop = '', pest = '' } = body;
      const searchCrop = crop.trim().toLowerCase();
      const searchPest = pest.trim().toLowerCase();
      const matchesMap = new Map();

      // 第一遍
      for (const pesticide of db) {
        if (!pesticide.usageScopes) continue;
        if (RAW_LICENSE_TYPES.includes(pesticide['許可證字'])) continue;

        const matchingScope = pesticide.usageScopes.find(scope => {
          const cName = scope['作物名稱'] || '';
          const pName = scope['病蟲害名稱'] || '';
          return cName.toLowerCase().includes(searchCrop) && pName.toLowerCase().includes(searchPest);
        });

        if (matchingScope) {
          const nameKey = pesticide['中文名稱'] || pesticide['英文名稱'] || '未知成分';
          const formulationKey = pesticide['劑型'] || '';
          const contentKey = pesticide['含量'] || '';
          const groupKey = `${nameKey}_${formulationKey}_${contentKey}`;

          if (!matchesMap.has(groupKey)) {
            matchesMap.set(groupKey, {
              id: groupKey,
              name: nameKey,
              formulation: formulationKey,
              content: contentKey,
              classification: pesticide['農藥分類中文意義'] || pesticide['農藥類別中文意義'] || '混合劑',
              matchedScope: matchingScope,
              products: []
            });
          }
          matchesMap.get(groupKey).products.push(pesticide);
        }
      }

      // 第二遍
      const addedLicenses = new Map();
      for (const [groupKey, group] of matchesMap) {
        addedLicenses.set(groupKey, new Set(group.products.map(p => p['許可證號'])));
      }

      for (const pesticide of db) {
        if (RAW_LICENSE_TYPES.includes(pesticide['許可證字'])) continue;
        const nameKey = pesticide['中文名稱'] || pesticide['英文名稱'] || '未知成分';
        const formulationKey = pesticide['劑型'] || '';
        const contentKey = pesticide['含量'] || '';
        const groupKey = `${nameKey}_${formulationKey}_${contentKey}`;

        if (matchesMap.has(groupKey)) {
          const licenseNo = pesticide['許可證號'];
          if (!addedLicenses.get(groupKey).has(licenseNo)) {
            matchesMap.get(groupKey).products.push(pesticide);
            addedLicenses.get(groupKey).add(licenseNo);
          }
        }
      }

      const sortedResults = Array.from(matchesMap.values()).sort((a, b) => {
        const aVendors = new Set(a.products.map(p => {
          const vendor = p['廠商名稱'] || '';
          return PRIORITY_VENDORS.find(v => vendor.includes(v)) || null;
        }).filter(Boolean));
        const bVendors = new Set(b.products.map(p => {
          const vendor = p['廠商名稱'] || '';
          return PRIORITY_VENDORS.find(v => vendor.includes(v)) || null;
        }).filter(Boolean));
        return bVendors.size - aVendors.size;
      });

      const mechMap = getMechMap(db);
      sortedResults.forEach(group => {
        const p = group.products[0];
        if (!p) return;
        const iracRaw = p['IRAC殺蟲劑抗藥性'];
        const fracRaw = p['FRAC殺菌劑抗藥性'];
        const hracRaw = p['HRAC除草劑抗藥性'];
        
        if (iracRaw && iracRaw.trim()) group.mechanism = `IRAC - ${iracRaw.trim()}`;
        else if (fracRaw && fracRaw.trim()) group.mechanism = `FRAC - ${fracRaw.trim()}`;
        else if (hracRaw && hracRaw.trim()) group.mechanism = `HRAC - ${hracRaw.trim()}`;
        else {
          const eng = p['英文名稱'];
          if (eng && eng.includes('+')) {
            const parts = eng.split('+').map(part => part.trim().toUpperCase());
            const iracs = [], fracs = [], hracs = [];
            parts.forEach(part => {
               if (mechMap.IRAC[part] && !iracs.includes(mechMap.IRAC[part])) iracs.push(mechMap.IRAC[part]);
               if (mechMap.FRAC[part] && !fracs.includes(mechMap.FRAC[part])) fracs.push(mechMap.FRAC[part]);
               if (mechMap.HRAC[part] && !hracs.includes(mechMap.HRAC[part])) hracs.push(mechMap.HRAC[part]);
            });
            
            let result = [];
            if (iracs.length > 0) result.push(`IRAC - ${iracs.join('/')}`);
            if (fracs.length > 0) result.push(`FRAC - ${fracs.join('/')}`);
            if (hracs.length > 0) result.push(`HRAC - ${hracs.join('/')}`);
            if (result.length > 0) group.mechanism = result.join(', ');
          }
        }
      });

      return { statusCode: 200, body: JSON.stringify(sortedResults) };
    }

    // ─── Reverse Search (Step 1) ──────────────────────
    if (action === 'reverse_search') {
      const qLower = (body.query || '').trim().toLowerCase();
      const ingredientMap = new Map();
      const singleIngredientEnglish = new Set();

      for (const p of db) {
        const cn = (p['中文名稱'] || '').toLowerCase();
        const enName = (p['英文名稱'] || '').toLowerCase();
        if (!cn.includes(qLower) && !enName.includes(qLower)) continue;

        const name = p['中文名稱'] || '';
        const code = p['農藥代號'] || '';
        const en = p['英文名稱'] || '';
        const key = `${name}_${code}`;

        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, { name, code, englishName: en, productCount: 0 });
          if (en && !en.includes('+')) {
            singleIngredientEnglish.add(en.trim().toUpperCase());
          }
        }
        ingredientMap.get(key).productCount++;
      }

      if (singleIngredientEnglish.size > 0) {
        for (const p of db) {
          const name = p['中文名稱'] || '';
          const code = p['農藥代號'] || '';
          const key = `${name}_${code}`;

          if (ingredientMap.has(key)) continue;

          const pEn = (p['英文名稱'] || '').toUpperCase();
          const matchesAny = [...singleIngredientEnglish].some(comp => pEn.includes(comp));
          if (!matchesAny) continue;

          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, { name, code, englishName: p['英文名稱'] || '', productCount: 0 });
          }
          ingredientMap.get(key).productCount++;
        }
      }

      const options = Array.from(ingredientMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
      return { statusCode: 200, body: JSON.stringify(options) };
    }

    // ─── Reverse Products (Step 2 & 3) ────────────────
    if (action === 'reverse_get_products') {
      const targetCode = body.code;
      // Get only the products matching this specific ingredient code
      const products = db.filter(p => p['農藥代號'] === targetCode);
      
      const mechMap = getMechMap(db);
      products.forEach(p => {
        const iracRaw = p['IRAC殺蟲劑抗藥性'];
        const fracRaw = p['FRAC殺菌劑抗藥性'];
        const hracRaw = p['HRAC除草劑抗藥性'];
        if (iracRaw?.trim()) p._mechanism = `IRAC - ${iracRaw.trim()}`;
        else if (fracRaw?.trim()) p._mechanism = `FRAC - ${fracRaw.trim()}`;
        else if (hracRaw?.trim()) p._mechanism = `HRAC - ${hracRaw.trim()}`;
        else {
          const eng = p['英文名稱'];
          if (eng?.includes('+')) {
            const parts = eng.split('+').map(part => part.trim().toUpperCase());
            const iracs = [], fracs = [], hracs = [];
            parts.forEach(part => {
              if (mechMap.IRAC[part] && !iracs.includes(mechMap.IRAC[part])) iracs.push(mechMap.IRAC[part]);
              if (mechMap.FRAC[part] && !fracs.includes(mechMap.FRAC[part])) fracs.push(mechMap.FRAC[part]);
              if (mechMap.HRAC[part] && !hracs.includes(mechMap.HRAC[part])) hracs.push(mechMap.HRAC[part]);
            });
            const result = [];
            if (iracs.length > 0) result.push(`IRAC - ${iracs.join('/')}`);
            if (fracs.length > 0) result.push(`FRAC - ${fracs.join('/')}`);
            if (hracs.length > 0) result.push(`HRAC - ${hracs.join('/')}`);
            if (result.length > 0) p._mechanism = result.join(', ');
          }
        }
      });
      return { statusCode: 200, body: JSON.stringify(products) };
    }

    // ─── Mechanism Init ────────────────────────────────
    if (action === 'mechanism_init') {
      const codes = { IRAC: new Set(), FRAC: new Set(), HRAC: new Set() };
      for (const p of db) {
        if (p['IRAC殺蟲劑抗藥性'] && p['IRAC殺蟲劑抗藥性'].trim()) codes.IRAC.add(p['IRAC殺蟲劑抗藥性'].trim());
        if (p['FRAC殺菌劑抗藥性'] && p['FRAC殺菌劑抗藥性'].trim()) codes.FRAC.add(p['FRAC殺菌劑抗藥性'].trim());
        if (p['HRAC除草劑抗藥性'] && p['HRAC除草劑抗藥性'].trim()) codes.HRAC.add(p['HRAC除草劑抗藥性'].trim());
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          IRAC: Array.from(codes.IRAC).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          FRAC: Array.from(codes.FRAC).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          HRAC: Array.from(codes.HRAC).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        })
      };
    }

    // ─── Mechanism Search ──────────────────────────────
    if (action === 'mechanism_search') {
      const { mechType, codeInput } = body;
      const searchCode = (codeInput || '').trim().toUpperCase();
      const mechMap = getMechMap(db);
      const matchesMap = new Map();
      const fieldMap = {
        'IRAC': 'IRAC殺蟲劑抗藥性',
        'FRAC': 'FRAC殺菌劑抗藥性',
        'HRAC': 'HRAC除草劑抗藥性'
      };
      const field = fieldMap[mechType];

      for (const pesticide of db) {
        if (RAW_LICENSE_TYPES.includes(pesticide['許可證字'])) continue;
        let matches = false;

        const val = pesticide[field];
        if (val && val.trim().toUpperCase() === searchCode) {
          matches = true;
        } else {
          const eng = pesticide['英文名稱'];
          if (eng && eng.includes('+')) {
            const parts = eng.split('+').map(p => p.trim().toUpperCase());
            matches = parts.some(part => mechMap[mechType][part]?.toUpperCase() === searchCode);
          }
        }

        if (!matches) continue;

        const nameKey = pesticide['中文名稱'] || pesticide['英文名稱'] || '未知成分';
        const formulationKey = pesticide['劑型'] || '';
        const contentKey = pesticide['含量'] || '';
        const groupKey = `${nameKey}_${formulationKey}_${contentKey}`;

        if (!matchesMap.has(groupKey)) {
          matchesMap.set(groupKey, {
            id: groupKey,
            name: nameKey,
            formulation: formulationKey,
            content: contentKey,
            classification: pesticide['農藥分類中文意義'] || pesticide['農藥類別中文意義'] || '混合劑',
            matchedScope: null,
            products: [],
          });
        }
        matchesMap.get(groupKey).products.push(pesticide);
      }

      const sortedResults = Array.from(matchesMap.values()).sort((a, b) => {
        const aHas = a.products.some(p => PRIORITY_VENDORS.some(v => (p['廠商名稱'] || '').includes(v)));
        const bHas = b.products.some(p => PRIORITY_VENDORS.some(v => (p['廠商名稱'] || '').includes(v)));
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });

      sortedResults.forEach(group => {
        const p = group.products[0];
        if (!p) return;
        const iracRaw = p['IRAC殺蟲劑抗藥性'];
        const fracRaw = p['FRAC殺菌劑抗藥性'];
        const hracRaw = p['HRAC除草劑抗藥性'];
        if (iracRaw?.trim()) group.mechanism = `IRAC - ${iracRaw.trim()}`;
        else if (fracRaw?.trim()) group.mechanism = `FRAC - ${fracRaw.trim()}`;
        else if (hracRaw?.trim()) group.mechanism = `HRAC - ${hracRaw.trim()}`;
        else {
          const eng = p['英文名稱'];
          if (eng?.includes('+')) {
            const parts = eng.split('+').map(part => part.trim().toUpperCase());
            const iracs = [], fracs = [], hracs = [];
            parts.forEach(part => {
              if (mechMap.IRAC[part] && !iracs.includes(mechMap.IRAC[part])) iracs.push(mechMap.IRAC[part]);
              if (mechMap.FRAC[part] && !fracs.includes(mechMap.FRAC[part])) fracs.push(mechMap.FRAC[part]);
              if (mechMap.HRAC[part] && !hracs.includes(mechMap.HRAC[part])) hracs.push(mechMap.HRAC[part]);
            });
            const result = [];
            if (iracs.length > 0) result.push(`IRAC - ${iracs.join('/')}`);
            if (fracs.length > 0) result.push(`FRAC - ${fracs.join('/')}`);
            if (hracs.length > 0) result.push(`HRAC - ${hracs.join('/')}`);
            if (result.length > 0) group.mechanism = result.join(', ');
          }
        }
      });

      return { statusCode: 200, body: JSON.stringify(sortedResults) };
    }

    return { statusCode: 400, body: "Invalid action" };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
