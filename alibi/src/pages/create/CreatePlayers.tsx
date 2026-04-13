import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../context/GameContext'
import PageLayout from '../../components/ui/PageLayout'
import logo from '../../assets/logo1.png'

export default function CreatePlayers() {
  const navigate = useNavigate()
  const { playerCount, setPlayerCount } = useGame()
  const [selected, setSelected] = useState(playerCount)

  const counts = [5, 6, 7, 8]

  const handleNext = () => {
    setPlayerCount(selected)
    navigate('/create/scenario')
  }

  return (
    <PageLayout showBackButton backTo="/create/name">
      <div className="flex flex-col items-center text-center">

        {/* Big Logo */}
        <img src={logo} alt="Alibi" className="w-48 mb-8" />

        {/* Title */}
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Create Room
        </h2>
        <p className="font-body text-alibi-cream text-sm mb-8 opacity-70">
          Step 2 of 3 — How many players?
        </p>

        {/* Player Count Selector */}
        <div className="flex gap-4 mb-8">
          {counts.map(count => (
            <button
              key={count}
              onClick={() => setSelected(count)}
              className={`w-16 h-16 rounded-full font-heading text-xl font-bold transition-all border-2 ${
                selected === count
                  ? 'bg-alibi-gold text-alibi-black border-alibi-gold'
                  : 'bg-transparent text-alibi-cream border-alibi-cream/30 hover:border-alibi-gold hover:text-alibi-gold'
              }`}
            >
              {count}
            </button>
          ))}
        </div>

        <p className="font-body text-alibi-cream/50 text-xs mb-6">
          {selected} players · {selected === 8 ? 'All roles available' : `${8 - selected} roles excluded`}
        </p>

        {/* Step dots */}
        <div className="flex gap-2 my-6">
          <div className="w-2 h-2 rounded-full bg-alibi-gold/50" />
          <div className="w-2 h-2 rounded-full bg-alibi-gold" />
          <div className="w-2 h-2 rounded-full bg-alibi-cream/30" />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="font-heading text-alibi-black font-bold hover:opacity-90 transition"
          style={{
            display: 'inline-flex',
            padding: '19px 47px 18px 49px',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '20px',
            background: '#F9A856',
          }}
        >
          NEXT →
        </button>

      </div>
    </PageLayout>
  )
}