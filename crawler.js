const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const [, , url, depth] = process.argv;


if (!url) {
  console.error('Please provide a URL.');
  process.exit(1);
}

const results = [];

async function crawlPage(url, currentDepth) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);


    $('img').each((index, element) => {
      const imageUrl = $(element).attr('src');
      results.push({
        imageUrl,
        sourceUrl: url,
        depth: currentDepth,
      });
    });

    if (currentDepth < depth) {
      const linkedPages = new Set();
      $('a').each((index, element) => {
        const linkedUrl = $(element).attr('href');
        if (linkedUrl && !linkedUrl.startsWith('#') && !linkedUrl.startsWith('mailto:')) {
            linkedPages.add(linkedUrl);
        }
      });

      for (const linkedUrl of linkedPages) {
        const absoluteUrl = new URL(linkedUrl, url).toString();
        await crawlPage(absoluteUrl, currentDepth + 1);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
  }
}




(async () => {
  console.log(`Crawling ${url} up to depth ${depth}`);
  await crawlPage(url, 0);

  const resultData = {
    results,
  };

  fs.writeFileSync('results.json', JSON.stringify(resultData, null, 2));
  console.log('Crawling finished. Results saved to results.json');
})();
