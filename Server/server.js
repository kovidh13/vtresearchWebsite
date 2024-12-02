const http = require('http');
const fs = require('fs');
const path = require('path');

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
      const opportunities = [
        {
          id: 1,
          title: 'CNRE Research Support Fund-Undergraduate Research Fellowship',
          description: 'Funds are available from the College of Natural Resources and Environment to incentivize undergraduate student engagement in research.',
          deadline: '2024-05-01'
        },
        {
          id: 2,
          title: 'Data Science for the Public Good program at Virginia Tech (DSPG)',
          description: "DSPG is seeking applicants for its 2024 summer internship program. The program is part of the broader DSPG initiative offered by Virginia Tech's Agricultural and Applied Economics Department. ~~~",
          deadline: '2025-05-25'
        },
        {
          id: 3,
          title: 'F.I.R.E. Starters',
          description: 'Deadline April 15, 2024',
          deadline: '2024-04-15'
        }
      ];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(opportunities));
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