const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize express
const app = express();
const port = process.env.PORT || 3000

// Use middleware
app.use(cors());
app.use(bodyParser.json());

// Scrape Flipkart products based on search term and number of pages
app.post('/scrape', async (req, res) => {
  const { searchTerm, numPages } = req.body;  // Get number of pages from request body
  console.log(`Scraping Flipkart for: ${searchTerm} for ${numPages} pages`);

  // Initialize Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Load Flipkart homepage
  await page.goto('https://www.flipkart.com/', { waitUntil: 'networkidle2' });
  
  // Close the login popup if it appears
  try {
    await page.click('button._2KpZ6l._2doB4z');
  } catch (e) {
    console.log('No login popup found.');
  }
  
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
  console.log('Server running on http://localhost:3000');
  // console.log('Server running on http://localhost:3000');
});
