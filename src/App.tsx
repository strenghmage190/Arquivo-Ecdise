import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Investigation from './pages/Investigation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/investigation/:id" element={<Investigation />} />
      </Routes>
    </BrowserRouter>
  );
}
