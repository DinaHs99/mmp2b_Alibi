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

import JoinCode from './pages/join/JoinCode.tsx'
import JoinName from './pages/join/JoinName.tsx'

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/room/:code/gameover"        element={<GameOver />} />
        
        <Route path="/join/name"  element={<JoinName />} />
        <Route path="/join/code"  element={<JoinCode />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App