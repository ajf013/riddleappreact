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

  const fetchRiddle = async () => {
    if (language !== 'en') return;

    setLoading(true);
    setError(null);
    setShowAnswer(false);

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
      } else {
        throw new Error('No riddle found');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load new riddle. Try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000 });
    // Initial load
    if (language === 'en') {
      fetchRiddle();
    } else {
      // Initialize random local riddle for Tamil
      const randomIndex = Math.floor(Math.random() * riddles.length);
      setCurrentRiddleIndex(randomIndex);
      setRiddleHistory([randomIndex]);
    }
  }, []);

  // Re-fetch or reset when language changes
  useEffect(() => {
    setShowAnswer(false);
    if (language === 'en') {
      if (!apiRiddle) fetchRiddle();
    } else {
      // Ensure we have a valid local riddle index when switching back to Tamil
      if (currentRiddleIndex === -1) {
        const randomIndex = Math.floor(Math.random() * riddles.length);
        setCurrentRiddleIndex(randomIndex);
      }
    }
  }, [language]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const handleNextRiddle = () => {
    if (language === 'en') {
      fetchRiddle();
    } else {
      // Local logic for Tamil
      let nextIndex;
      if (riddleHistory.length >= riddles.length) {
        const available = riddles.map((_, i) => i).filter(i => i !== currentRiddleIndex);
        nextIndex = available[Math.floor(Math.random() * available.length)];
        setRiddleHistory([nextIndex]);
      } else {
        const available = riddles.map((_, i) => i).filter(i => !riddleHistory.includes(i));
        nextIndex = available[Math.floor(Math.random() * available.length)];
        setRiddleHistory([...riddleHistory, nextIndex]);
      }
      setCurrentRiddleIndex(nextIndex);
      setShowAnswer(false);
    }
  };

  // Determine content based on language
  let question = '', answer = '';

  if (language === 'en') {
    if (apiRiddle) {
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
    if (language === 'en') return apiRiddle ? apiRiddle.question : 'loading';
    return currentRiddleIndex + 'ta';
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
          <div className="riddle-question">
            {loading && language === 'en' ? (
              <div className="loading-spinner">Loading Riddle...</div>
            ) : error && language === 'en' ? (
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
            <button className="action-btn toggle-answer-btn" onClick={() => setShowAnswer(!showAnswer)} disabled={loading || (language === 'en' && !apiRiddle)}>
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
