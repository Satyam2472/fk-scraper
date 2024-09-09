const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');  // For security headers
const bodyParser = require('body-parser');
require("dotenv").config();

// Initialize express
const app = express();
const port = process.env.PORT || 3000

// Explicitly allowing your frontend Netlify URL
const corsOptions = {
  origin: "*",
  // origin: "https://fk-product-detail-scraper.netlify.app",
  methods: "GET,POST,OPTIONS",
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200, // For older browsers
};

app.use(cors(corsOptions));
// Handle preflight (OPTIONS) requests
app.options('*', cors(corsOptions)); // Preflight handling


// Use security and caching headers
app.use(helmet({crossOriginResourcePolicy: false,}));

// Add Cache-Control and other headers
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');  // Adjust as needed
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(bodyParser.json());

// Scrape Flipkart products based on search term and number of pages
app.post('/scrape', async (req, res) => {

  const { searchTerm, numPages } = req.body;  // Get number of pages from request body
  console.log(`Scraping Flipkart for: ${searchTerm} for ${numPages} pages`);

  // Initialize Puppeteer
  // The below is for local testing
  // const browser = await puppeteer.launch({ headless: true });
  // The below is for actual deploy
  const browser = await puppeteer.launch({ headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
  });

  const page = await browser.newPage();
  
  // Load Flipkart homepage
  await page.goto('https://www.flipkart.com/', { waitUntil: 'networkidle2' });

  // Close the login popup if it appears
  try {
    await page.click('button._2KpZ6l._2doB4z');
  } catch (e) {
    console.log('No login popup found.');
  }
  
  await page.waitForSelector('input.Pke_EE', { timeout: 5000 });  // Wait for up to 5 seconds for the input to appear

  // Type in the search term
  await page.type('input.Pke_EE', searchTerm);
  
  // Click the search button
  await page.click('button[type="submit"]');
  await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for the page to load
  
  // Scraping product details
  let products = [];
  for (let i = 0; i < numPages; i++) {  // Use numPages variable
    console.log(`Scraping page ${i + 1}`);

    // Extracting the title attribute from the <a> tag
    const productTitles = await page.$$eval('.wjcEIp', elements =>
      elements.map(el => el.getAttribute('title'))
    );
    const productPrices = await page.$$eval('.Nx9bqj', elements => elements.map(el => el.textContent));
    // For MRP of the project
    const productMRPs = await page.$$eval('.yRaY8j', elements => elements.map(el => el.textContent))
    const productRatings = await page.$$eval('.XQDdHH', elements => elements.map(el => el.textContent));
    const productRatingCounts = await page.$$eval('.Wphh3N', elements => elements.map(el => el.textContent));
    const productQtys = await page.$$eval('.NqpwHC', elements => elements.map(el => el.textContent));

    // Loop through each product and store the details
    for (let j = 0; j < productTitles.length; j++) {
      products.push({
        title: productTitles[j],
        price: productPrices[j],
        // For MRP of the product
        mrp: productMRPs[j],
        rating: productRatings[j] || 'N/A',
        ratingCount: productRatingCounts[j] || 'N/A',
        quantity: productQtys[j] || 'N/A',
      });
    }

    // Check if there's a 'Next' button, and click it
    try {
      await page.click('a._9QVEpD');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log('No more pages to scrape.');
      break;
    }
  }

  // Close the browser
  await browser.close();

  // Send the scraped data back to the frontend
  res.json(products);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  // console.log('Server running on http://localhost:3000');
});
