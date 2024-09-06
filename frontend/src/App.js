import React from 'react';
import ScrapingComponent from './Components/ScrapingComponent';
import './Components/ScrapingComponent.css'; // Ensure this file exists for styling

const App = () => {
  return (
    <>
    <div className='page-title'>
      <h1>NexTen's Product Detail Scraper for Flipkart</h1>
    </div>
    <ScrapingComponent />
    </>
  );
};

export default App;
