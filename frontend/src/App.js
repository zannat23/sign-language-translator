import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Detect from './pages/Detect';
import About from './pages/About';
import ASLGuide from './pages/ASLGuide';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: 'var(--bg1)' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/about" element={<About />} />
          <Route path="/guide" element={<ASLGuide />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;   