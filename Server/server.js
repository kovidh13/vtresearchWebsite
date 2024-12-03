const http = require('http');
const fs = require('fs');
const path = require('path');
const { scrapeOpportunities } = require('./scraper');

let cachedOpportunities = [];
let lastScrapedTime = 0;
const scrapeInterval = 60 * 60 * 1000;

// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Serve the index.html file
    const filePath = path.join(__dirname, '../Client', 'researchIndex.html');
    console.log(`File path: ${filePath}`);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/index_stylesheet.css') {
    // Serve the style.css file
    const filePath = path.join(__dirname, '../Client', 'index_stylesheet.css');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(data);
      }
    });
  } else if (req.url === '/api/opportunities') {
    // Handle the GET request for opportunities
    const currentTime = Date.now();
    if (currentTime - lastScrapedTime > scrapeInterval || cachedOpportunities.length === 0) {
      // Time to scrape again
      scrapeOpportunities()
        .then(opportunities => {
          cachedOpportunities = opportunities;
          lastScrapedTime = currentTime;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(opportunities));
        })
        .catch(error => {
          console.error(`Error scraping opportunities: ${error}`);
          // Serve cached data if available
          if (cachedOpportunities.length > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(cachedOpportunities));
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
          }
        });
    } else {
      // Serve cached data
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cachedOpportunities));
    }
  }
  else if (req.url === '/app.js') {
    const filePath = path.join(__dirname, '../Client', 'app.js');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(data);
      }
    });
  }
  else {
    // 404 for undefined routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404: Page Not Found');
  }
});

// Start the server
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});