import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import { Video } from './services/api';
import './App.css';

function AppContent() {
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const location = useLocation();

  const handleSearchResults = (results: Video[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setIsSearchMode(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setIsSearchMode(false);
  };

  const handleVideoSelect = (video: Video) => {
    // This will be handled by individual pages
    console.log('Video selected:', video);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <a href="/" onClick={() => window.location.reload()}>
            <h1>Netflix Clone</h1>
          </a>
        </div>
        <div className="nav-center">
          <SearchBar 
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>
      
      {isSearchMode && location.pathname === '/' ? (
        <div className="container">
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onVideoSelect={handleVideoSelect}
            onClearSearch={handleClearSearch}
          />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<UploadPage />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
