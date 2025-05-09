const puppeteer = require('puppeteer');
const fs = require('fs');

fs.writeFileSync('./data.json', '');

// Read and normalize the connect codes
function loadConnectCodes() {
  const raw = JSON.parse(fs.readFileSync('./connectcode.json', 'utf-8'));
  return raw.map(code =>
    code
      .replace(/＃/g, '-') // Replace full-width pound sign with half-width
      .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // Full-width to half-width
      .replace(/#/g, '-') // Ensure ASCII '#' is also replaced with '-'
      .toLowerCase()
  );
}

// Extract percentages and clean up character names
function sendPercentages(arr, arr2) {
  for (let i = 0; i < arr.length; i++) {
    const tempArr = arr[i].split(" ");
    arr[i] = tempArr[0]; // Just the character name

    if (tempArr[1]) {
      const cleaned = tempArr[1].replace(/[\(\)%]/g, ''); // Remove (),%
      arr2.push(cleaned);
    }
  }
}

(async () => {
  const connectCodes = loadConnectCodes();
  const browser = await puppeteer.launch({ headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const results = [];

  for (const code of connectCodes) {
    const page = await browser.newPage();
    const url = `https://slippi.gg/user/${code}`;
    console.log(`Scraping: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

      const data = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.content'), (e) => ({
          name: e.querySelector('p.css-dshe97')?.innerText || null,
          tag: e.querySelector('p.css-k11z2a')?.innerText || null,
          rank: e.querySelector('p.css-jh714q')?.innerText || null,
          rating: e.querySelector('p.css-1rxv754')?.innerText || null,
          characters: (() => {
            const imgs = e.querySelectorAll('.jss27.container img');
            const chars = [];
            for (const img of imgs) {
              const label = img.getAttribute('aria-label');
              if (label === null) break;
              chars.push(label);
            }
            return chars;
          })(),
          percentages: [],
          wins: e.querySelector('p.css-1i7pcxu')?.innerText || null,
          loses: e.querySelector('p.css-2bid3n')?.innerText || null,
        }))
      );

      if (data.length && data[0].characters) {
        sendPercentages(data[0].characters, data[0].percentages);
      }

      if (data.length && data[0].tag) {
        const entry = data[0];
        const formatted = {
          [entry.tag]: {
            name: entry.name,
            tag: entry.tag,
            rank: entry.rank,
            rating: parseFloat(entry.rating?.replace(/[^\d.]/g, '') || '0'),
            characters: entry.characters,
            percentages: entry.percentages,
            wins: parseInt(entry.wins || '0'),
            losses: parseInt(entry.loses || '0')
          }
        };
        results.push(formatted);
      }

    } catch (error) {
      console.error(`Failed to scrape ${url}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const merged = Object.assign({}, ...results);
  fs.writeFileSync('./data.json', JSON.stringify(merged, null, 2));
  console.log('✅ Data saved to data.json');
})();


