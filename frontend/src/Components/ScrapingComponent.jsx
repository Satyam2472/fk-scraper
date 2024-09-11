
import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ScrapingComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [numPages, setNumPages] = useState(1); // Default 1 page
  const [scrapingData, setScrapingData] = useState(null);
  const [isScraping, setIsScraping] = useState(false);  // New state to track if scraping is in progress

  const handleScrape = async () => {
    setIsScraping(true); // Show the loading message when scraping starts
    try {
      // Send the search term and number of pages to scrape to the backend
      const response = await axios.post('https://fk-scraper.vercel.app/scrape', { searchTerm, numPages });
      setScrapingData(response.data);  // Set the scraped data to display
    } catch (error) {
      console.error('Error scraping data:', error);
    } finally {
      setIsScraping(false);  // Hide the loading message when scraping is done
    }
  };

  const handleDownload = () => {
    if (scrapingData) {
      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(scrapingData);

      // Create a new workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ScrapedData');

      // Create a downloadable Excel file
      XLSX.writeFile(wb, 'ScrapedData.xlsx');
    } else {
      alert('No data available to download!');
    }
  };

  return (
    <div className='scraped_data'>
      <div>
        <input
          type="text"
          className='search_term'
          placeholder="Enter search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="number"
          className='num_of_page'
          min="1"
          placeholder="Number of pages"
          value={numPages}
          onChange={(e) => setNumPages(e.target.value)}
        />
        <button onClick={handleScrape} className='scrape_button'>Scrape</button>

        {/* Show message while scraping is in progress */}
        {isScraping && <p className='scraping_message'>Product Detail Scraping...</p>}

        {/* Display scraped data */}
        {scrapingData && !isScraping && (
          <>
            <table border="1" className='scraped_table'>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>MRP</th>
                  <th>Quantity</th>
                  <th>Rating</th>
                  <th>Rating Count</th>
                </tr>
              </thead>
              <tbody>
                {scrapingData.map((item, index) => (
                  <tr key={index}>
                    <td className='table_data'>{item.title}</td>
                    <td className='table_data'>{item.price}</td>
                    <td className='table_data'>{item.mrp}</td>
                    <td className='table_data'>{item.quantity}</td>
                    <td className='table_data'>{item.rating}</td>
                    <td className='table_data'>{item.ratingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Button to download data */}
            <button onClick={handleDownload} className='download_button'>Download Excel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScrapingComponent;
