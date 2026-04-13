import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../context/GameContext'
import PageLayout from '../../components/ui/PageLayout'
import logo from '../../assets/logo1.png'

export default function CreateName() {
  const navigate = useNavigate()
  const { playerName, setPlayerName } = useGame()
  const [input, setInput] = useState(playerName)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (!input.trim()) {
      setError('Please enter your name')
      return
    }
    if (input.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setPlayerName(input.trim())
    navigate('/create/players')
  }

  return (
    <PageLayout showBackButton backTo="/">
      <div className="flex flex-col items-center text-center">

        {/* Big Logo */}
        <img src={logo} alt="Alibi" className="w-48 mb-8" />

        {/* Title */}
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Create Room
        </h2>
        <p className="font-body text-alibi-cream text-sm mb-8 opacity-70">
          Step 1 of 3 — Enter your name
        </p>

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value)
            setError('')
          }}
          onKeyDown={e => e.key === 'Enter' && handleNext()}
          placeholder="Your name..."
          maxLength={20}
          className="font-body bg-transparent border-b-2 border-alibi-gold text-alibi-cream text-center text-xl outline-none w-72 pb-2 mb-2 placeholder:text-alibi-cream/30"
        />

        {/* Error */}
        {error && (
          <p className="font-body text-alibi-red text-xs mb-4">{error}</p>
        )}

        {/* Step dots */}
        <div className="flex gap-2 my-6">
          <div className="w-2 h-2 rounded-full bg-alibi-gold" />
          <div className="w-2 h-2 rounded-full bg-alibi-cream/30" />
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