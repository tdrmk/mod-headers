import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle } from 'styled-components'
import App from './App.jsx'
import { colors, typography } from './theme.js'

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${typography.fontFamily};
    font-size: ${typography.scale400};
    color: ${colors.contentPrimary};
    background: ${colors.backgroundPrimary};
  }
  input[type="checkbox"] {
    accent-color: ${colors.primary};
  }
  :focus-visible {
    outline: 2px solid ${colors.borderSelected};
    outline-offset: 2px;
  }
  select:focus-visible {
    outline: none;
  }
`

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>
)
