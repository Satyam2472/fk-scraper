const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');  // For security headers
const bodyParser = require('body-parser');
require("dotenv").config();

// Initialize express
const app = express();
const port = process.env.PORT || 3000

// Explicitly allow your frontend URL
const corsOptions = {
  origin: "https://fk-scraper-1.onrender.com",  // Frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
// Handle preflight (OPTIONS) requests
app.options('*', cors(corsOptions)); // Preflight handling


// Use security and caching headers
app.use(helmet({crossOriginResourcePolicy: true,}));

app.use(bodyParser.json());

// Scrape Flipkart products based on search term and number of pages
app.post('/scrape', async (req, res) => {
  const { searchTerm, numPages } = req.body;
  console.log(`Scraping Flipkart for: ${searchTerm} for ${numPages} pages`);

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
  await page.goto('https://www.flipkart.com/', { waitUntil: 'networkidle2' });

  try {
    await page.click('button._2KpZ6l._2doB4z');
  } catch (e) {
    console.log('No login popup found.');
  }
  
  await page.waitForSelector('input.Pke_EE', { timeout: 5000 });
  await page.type('input.Pke_EE', searchTerm);
  await page.click('button[type="submit"]');
  await new Promise(resolve => setTimeout(resolve, 1000));

  let products = [];
  for (let i = 0; i < numPages; i++) {
    console.log(`Scraping page ${i + 1}`);
    const productTitles = await page.$$eval('.wjcEIp', elements =>
      elements.map(el => el.getAttribute('title'))
    );
    const productPrices = await page.$$eval('.Nx9bqj', elements => elements.map(el => el.textContent));
    const productMRPs = await page.$$eval('.yRaY8j', elements => elements.map(el => el.textContent));
    const productRatings = await page.$$eval('.XQDdHH', elements => elements.map(el => el.textContent));
    const productRatingCounts = await page.$$eval('.Wphh3N', elements => elements.map(el => el.textContent));
    const productQtys = await page.$$eval('.NqpwHC', elements => elements.map(el => el.textContent));

    for (let j = 0; j < productTitles.length; j++) {
      products.push({
        title: productTitles[j],
        price: productPrices[j],
        mrp: productMRPs[j],
        rating: productRatings[j] || 'N/A',
        ratingCount: productRatingCounts[j] || 'N/A',
        quantity: productQtys[j] || 'N/A',
      });
    }

    try {
      await page.click('a._9QVEpD');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log('No more pages to scrape.');
      break;
    }
  }

  await browser.close();
  res.json(products);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
