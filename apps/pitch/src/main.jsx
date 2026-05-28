import React from 'react';
import { createRoot } from 'react-dom/client';
import PitchApp from './PitchApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PitchApp />
  </React.StrictMode>
);
