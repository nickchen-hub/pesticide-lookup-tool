import fs from 'fs/promises';

async function check() {
  const data = JSON.parse(await fs.readFile('./public/pesticide_db.json', 'utf8'));
  const g = data.filter(p => p['廠商名稱'] && p['廠商名稱'].includes('光華化學'));
  
  console.log('光華化學 所有農藥記錄:', g.map(p => ({
    name: p['中文名稱'],
    type: p['許可證字'],
    no: p['許可證號'],
    scopes: p.usageScopes ? p.usageScopes.length : 0,
    hasStrawberry: p.usageScopes?.some(s => s['作物名稱'].includes('草莓'))
  })));
}

check().catch(console.error);
