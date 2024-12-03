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
    const baseUrl = 'https://research.undergraduate.vt.edu';
  
    // Select the main <ul> element
    const mainList = $('ul.vt-subnav-droplist#vt_sub_pages');
  
    // Find the active <li> element that contains the opportunities
    const activeItem = mainList.find('li.vt-subnav-droplist-item.active');
    const opportunitiesList = activeItem.find('ul.vt-subnav-children');
  
    // Iterate over each opportunity item
    opportunitiesList.find('li.vt-subnav-droplist-item').each((index, element) => {
      const titleElement = $(element).find('a.vt-subnav-droplist-item');
      const title = titleElement.text().trim();
      const relativeLink = titleElement.attr('href');
      const link = relativeLink ? new URL(relativeLink, baseUrl).href : null;
  
      opportunities.push({
        title,
        link,
      });
    });
  
    return opportunities;
  }
  
  module.exports = { scrapeOpportunities };
  
  
  


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
  