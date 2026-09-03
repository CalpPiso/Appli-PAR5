import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import { App } from './App'
import { appliquerTheme, lireTheme } from './data/theme'

/* Le thème est posé AVANT le premier rendu : sinon l'app clignote en sombre
   une fraction de seconde avant de passer en clair. */
appliquerTheme(lireTheme())

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
