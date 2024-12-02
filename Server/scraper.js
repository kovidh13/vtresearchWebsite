const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.research.undergraduate.vt.edu/research-and-engagement/student-research-and-engagement/research-opportunities/virginia-tech-research-opportunities.html';

async function fetchData() {
    try {
      const response = await axios.get(url);
      return response.data; // HTML content
    } catch (error) {
      console.error(`Error fetching the webpage: ${error}`);
      return null;
    }
  }

  async function scrapeOpportunities() {
    const html = await fetchData();
    if (!html) return [];
  
    const $ = cheerio.load(html);
    const opportunities = [];
    const baseUrl = 'https://www.research.undergraduate.vt.edu';
  
    // Select each opportunity item
    $('li.item.general-page').each((index, element) => {
      // Extract the title
      const title = $(element)
        .find('a.vt-list-item-title-link')
        .text()
        .trim();
  
      // Extract the relative link and construct the full URL
      const relativeLink = $(element)
        .find('a.vt-list-item-title-link')
        .attr('href');
      const link = relativeLink ? new URL(relativeLink, baseUrl).href : null;
  
      // Extract the description
      const description = $(element)
        .find('p.vt-list-description.vt-list-item-description')
        .text()
        .trim();
  
      // Add the opportunity to the array
      opportunities.push({
        title,
        description,
        link,
      });
    });
  
    return opportunities;
  }
  
  


  // Test the scraper independently
    if (require.main === module) {
    (async () => {
      try {
        const opportunities = await scrapeOpportunities();
        console.log('Scraped Opportunities:', opportunities);
      } catch (error) {
        console.error('Error testing scraper:', error);
      }
    })();
  }
  