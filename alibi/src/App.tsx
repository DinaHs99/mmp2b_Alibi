import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Room from './pages/Room.tsx'
import HowToPlay from './pages/HowToPlay.tsx'
import CreateName from './pages/create/CreateName.tsx'
import CreatePlayers from './pages/create/CreatePlayers.tsx'
import CreateScenario from './pages/create/CreateScenario.tsx'
import RoleReveal from './pages/RoleReveal.tsx'
import Discussion from './pages/Discussion.tsx'
import Voting from './pages/Voting.tsx'
import VotingReveal from './pages/VotingReveal.tsx'
import GameOver from './pages/GameOver.tsx'
import NightPhase from './pages/NightPhase.tsx'
import { isSoundMuted, playSound, toggleSoundMuted } from './utils/sound'

import JoinCode from './pages/join/JoinCode.tsx'
import JoinName from './pages/join/JoinName.tsx'

function App() {
  const [soundMuted, setSoundMuted] = useState(() => isSoundMuted())

  useEffect(() => {
    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button') as HTMLButtonElement | null

      if (!button || button.disabled || button.dataset.sound === 'off') return

      playSound('ui')
    }

    document.addEventListener('click', handleButtonClick)
    return () => document.removeEventListener('click', handleButtonClick)
  }, [])
  const handleToggleSound = () => {
    setSoundMuted(toggleSoundMuted())
  }

  return (
    <BrowserRouter>
      <button
        type="button"
        data-sound="off"
        onClick={handleToggleSound}
        aria-label={soundMuted ? 'Turn sound on' : 'Turn sound off'}
        className={`fixed right-4 top-16 z-50 h-9 min-w-24 rounded-full border px-3 font-mono text-[9px] uppercase tracking-widest transition sm:right-20 sm:top-3 sm:h-11 sm:min-w-28 sm:px-4 sm:text-[10px] ${
          soundMuted
            ? 'border-alibi-cream/20 bg-black/70 text-alibi-cream/50'
            : 'border-alibi-gold/50 bg-black/70 text-alibi-gold'
        }`}
      >
        {soundMuted ? 'Sound Off' : 'Sound On'}
      </button>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/how-to-play"  element={<HowToPlay />} />
        <Route path="/room/:code"   element={<Room />} />
        <Route path="/create/name"     element={<CreateName />} />
        <Route path="/create/players"  element={<CreatePlayers />} />
        <Route path="/create/scenario" element={<CreateScenario />} />
        <Route path="/room/:code/role-reveal"     element={<RoleReveal />} />
        <Route path="/room/:code/discussion"       element={<Discussion />} />
        <Route path="/room/:code/voting"           element={<Voting />} />
        <Route path="/room/:code/voting-reveal"    element={<VotingReveal />} />
        <Route path="/room/:code/night"            element={<NightPhase />} />
        <Route path="/room/:code/gameover"        element={<GameOver />} />
        
        <Route path="/join/name"  element={<JoinName />} />
        <Route path="/join/code"  element={<JoinCode />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
