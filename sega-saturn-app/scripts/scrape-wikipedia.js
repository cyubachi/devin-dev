const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeSegaSaturnGames() {
  try {
    console.log('Fetching Wikipedia page...');
    const response = await axios.get('https://ja.wikipedia.org/wiki/%E3%82%BB%E3%82%AC%E3%82%B5%E3%82%BF%E3%83%BC%E3%83%B3%E3%81%AE%E3%82%B2%E3%83%BC%E3%83%A0%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E4%B8%80%E8%A6%A7');
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    console.log('Parsing game data...');
    
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const caption = $table.find('caption').text();
      
      if (caption.includes('発売されたタイトル一覧表')) {
        console.log('Found main game table');
        
        $table.find('tbody tr').each((index, row) => {
          const cells = $(row).find('td');
          
          if (cells.length >= 5) {
            const japanDate = $(cells[0]).text().trim();
            const northAmericaDate = $(cells[1]).text().trim();
            const palDate = $(cells[2]).text().trim();
            const title = $(cells[3]).text().trim();
            const publisher = $(cells[4]).text().trim();
            const notes = cells.length > 5 ? $(cells[5]).text().trim() : '';
            const footnotes = cells.length > 6 ? $(cells[6]).text().trim() : '';
            
            if (title && title !== 'タイトル' && title !== '') {
              games.push({
                title,
                publisher,
                releaseDates: {
                  japan: japanDate !== '未発売' && japanDate !== '' ? japanDate : null,
                  northAmerica: northAmericaDate !== '未発売' && northAmericaDate !== 'N/A' && northAmericaDate !== '' ? northAmericaDate : null,
                  pal: palDate !== '未発売' && palDate !== 'N/A' && palDate !== '' ? palDate : null
                },
                notes: notes || null,
                footnotes: footnotes || null
              });
            }
          }
        });
      }
    });
    
    console.log(`Found ${games.length} games`);
    
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const outputPath = path.join(dataDir, 'sega-saturn-games.json');
    fs.writeFileSync(outputPath, JSON.stringify(games, null, 2), 'utf8');
    
    console.log(`Data saved to ${outputPath}`);
    return games;
    
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  }
}

if (require.main === module) {
  scrapeSegaSaturnGames()
    .then(games => {
      console.log('Scraping completed successfully!');
      console.log(`Total games: ${games.length}`);
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeSegaSaturnGames };
