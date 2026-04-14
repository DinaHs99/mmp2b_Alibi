import { createRoot } from 'react-dom/client'
import { GameProvider } from './context/GameContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  
    <GameProvider>
      <App />
    </GameProvider>
  
)
