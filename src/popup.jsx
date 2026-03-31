import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle } from 'styled-components'
import App from './App.jsx'

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    color: #000000;
    background: #FFFFFF;
  }
  input[type="checkbox"] {
    accent-color: #000000;
  }
  :focus-visible {
    outline: 2px solid #000000;
    outline-offset: 2px;
  }
`

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>
)
