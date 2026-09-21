const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetch('https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=5074');
  console.log('HTML Length:', html.length);
  const reH3 = /<h3[^>]*>(.*?)<\/h3>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = reH3.exec(html)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim();
    const content = match[2];
    console.log('\n--- TITLE:', title, '---');
    if (content.includes('<table')) {
      console.log('CONTAINS TABLE HTML:', content.substring(0, 500));
    } else {
      console.log('TEXT:', content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200));
    }
  }
}
run();
