import React, { useState, useEffect } from 'react';
import Typewriter from 'typewriter-effect';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './App.css';
import Footer from './components/Footer/Footer';
import { riddles } from './data/riddles';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'ta'
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [riddleHistory, setRiddleHistory] = useState([0]); // Track shown local riddles

  // New state for API integration
  const [apiRiddle, setApiRiddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Helper to get a random local riddle excluding history
  const getRandomLocalRiddle = (history) => {
    let nextIndex;
    // Simple logic: exclude current index, and try to exclude history if possible
    let available = riddles.map((_, i) => i).filter(i => i !== currentRiddleIndex);

    // If we haven't shown all riddles yet, filter out history too
    if (history.length < riddles.length) {
      available = available.filter(i => !history.includes(i));
    }

    if (available.length === 0) {
      // Fallback if something weird happens, just pick random
      nextIndex = Math.floor(Math.random() * riddles.length);
    } else {
      nextIndex = available[Math.floor(Math.random() * available.length)];
    }

    // Update history
    const newHistory = history.length >= riddles.length ? [nextIndex] : [...history, nextIndex];
    return { index: nextIndex, history: newHistory };
  };

  const fetchRiddle = async () => {
    if (language !== 'en') return;

    setLoading(true);
    setError(null);
    setShowAnswer(false);

    // Check if offline
    if (!navigator.onLine) {
      switchToOfflineMode();
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.api-ninjas.com/v1/riddles', {
        headers: {
          'X-Api-Key': import.meta.env.VITE_API_NINJAS_KEY
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch riddle');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setApiRiddle(data[0]);
        setIsOffline(false);
      } else {
        throw new Error('No riddle found');
      }
    } catch (err) {
      console.warn("API failed, falling back to local:", err);
      // Fallback to local on error
      switchToOfflineMode();
    } finally {
      setLoading(false);
    }
  };

  const switchToOfflineMode = () => {
    setIsOffline(true);
    const { index, history } = getRandomLocalRiddle(riddleHistory);
    setCurrentRiddleIndex(index);
    setRiddleHistory(history);
    setApiRiddle(null);
  };

  useEffect(() => {
    AOS.init({ duration: 1000 });
    // Initial load
    if (language === 'en') {
      fetchRiddle();
    } else {
      // Initialize random local riddle for Tamil
      const { index, history } = getRandomLocalRiddle([]);
      setCurrentRiddleIndex(index);
      setRiddleHistory(history);
    }
  }, []);

  // Re-fetch or reset when language changes
  useEffect(() => {
    setShowAnswer(false);
    if (language === 'en') {
      // If we don't have an API riddle AND we are not in offline mode (to prevent re-fetching if we already fell back), try fetch
      // But actually, allow re-try if user switches lang back and forth to retry connection? 
      // Let's stick to: if no apiRiddle, fetch.
      if (!apiRiddle && !isOffline) fetchRiddle();
      // If we are offline, we already have a local riddle selected via the fallback logic/initial load
    } else {
      // Ensure we have a valid local riddle index when switching back to Tamil
      // or if index is invalid
      if (currentRiddleIndex === -1 || !riddles[currentRiddleIndex]) {
        const { index, history } = getRandomLocalRiddle([]);
        setCurrentRiddleIndex(index);
        setRiddleHistory(history);
      }
    }
  }, [language]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const handleNextRiddle = () => {
    if (language === 'en' && !isOffline) {
      fetchRiddle();
    } else {
      // Local logic for Tamil OR English Offline Mode
      const { index, history } = getRandomLocalRiddle(riddleHistory);
      setCurrentRiddleIndex(index);
      setRiddleHistory(history);
      setShowAnswer(false);
    }
  };

  // Determine content based on language
  let question = '', answer = '';

  if (language === 'en') {
    if (isOffline || !apiRiddle) {
      // Fallback to local data
      const currentLocalRiddle = riddles[currentRiddleIndex];
      question = currentLocalRiddle?.questionEn || 'Loading...';
      answer = currentLocalRiddle?.answerEn || '';
    } else {
      question = apiRiddle.question;
      answer = apiRiddle.answer;
    }
  } else {
    const currentLocalRiddle = riddles[currentRiddleIndex];
    question = currentLocalRiddle?.questionTa || 'விடுகதை ஏற்றப்படுகிறது...';
    answer = currentLocalRiddle?.answerTa || '';
  }

  const getKey = () => {
    // Unique key to force typewriter reload
    if (language === 'en' && !isOffline && apiRiddle) return apiRiddle.question;
    return currentRiddleIndex + language;
  };

  return (
    <div className="app-container">
      <header className="header" data-aos="fade-down">
        <h1>Riddle App React</h1>
        <div className="controls">
          <button
            className={`control-btn language-btn ${language === 'ta' ? 'active' : ''}`}
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {language === 'en' ? 'English' : 'தமிழ்'}
            <svg viewBox="0 0 24 24" style={{ width: '1.2rem', height: '1.2rem', fill: 'currentColor' }}><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" /></svg>
          </button>

          <button
            aria-label="Toggle Dark Mode"
            onClick={() => setDarkMode(!darkMode)}
            className="control-btn theme-btn"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="riddle-card" data-aos="zoom-in">
          {/* Offline Indicator */}
          {language === 'en' && isOffline && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: '#ff9f1c',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              Offline Mode 📶
            </div>
          )}

          <div className="riddle-question">
            {loading && language === 'en' ? (
              <div className="loading-spinner">Loading Riddle...</div>
            ) : error && language === 'en' && !isOffline ? ( // Only show error if strictly not in offline mode, but we handle that via fallback
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              <Typewriter
                key={getKey()}
                options={{
                  strings: [question],
                  autoStart: true,
                  delay: 50,
                  cursor: '|',
                  deleteSpeed: 9999999, // Don't delete
                }}
              />
            )}
          </div>

          {showAnswer && !loading && (
            <div className="answer-section" data-aos="fade-up">
              {answer}
            </div>
          )}

          <div className="action-buttons">
            <button className="action-btn toggle-answer-btn" onClick={() => setShowAnswer(!showAnswer)} disabled={loading || (language === 'en' && !apiRiddle && !isOffline)}>
              {showAnswer ? (language === 'en' ? 'Hide Answer' : 'விடையை மறை') : (language === 'en' ? 'Show Answer' : 'விடை காட்டு')}
            </button>
            <button className="action-btn next-btn" onClick={handleNextRiddle} disabled={loading}>
              {language === 'en' ? 'Next Riddle' : 'அடுத்த விடுகதை'} ➡️
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
