import React from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled with the game (no CDN): Fredoka for headings,
// Nunito for reading, Patrick Hand for the chalkboard.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/patrick-hand/latin-400.css';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
