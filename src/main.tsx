import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';
import './index.css'
import './common/i18n/index.ts'

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
