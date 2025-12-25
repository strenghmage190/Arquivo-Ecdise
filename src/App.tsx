import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import InvestigationPage from './pages/Investigation';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/case/:id" element={<InvestigationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
