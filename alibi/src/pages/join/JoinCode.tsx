import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../context/GameContext'
import PageLayout from '../../components/ui/PageLayout'
import logo from '../../assets/logo1.png'

export default function JoinCode() {
  const navigate = useNavigate()
  const { setRoomCode } = useGame()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!input.trim()) {
      setError('Please enter a room code')
      return
    }
    if (input.trim().length !== 6) {
      setError('Room code must be 6 characters')
      return
    }

    setLoading(true)

    // TODO: check if room exists in Supabase
    // For now navigate directly
    setRoomCode(input.toUpperCase())
    navigate(`/room/${input.toUpperCase()}`)

    setLoading(false)
  }

  return (
    <PageLayout showBackButton backTo="/join/name">
      <div className="flex flex-col items-center text-center">

        {/* Big Logo */}
        <img src={logo} alt="Alibi" className="w-48 mb-8" />

        {/* Title */}
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Join Room
        </h2>
        <p className="font-body text-alibi-cream text-sm mb-8 opacity-70">
          Step 2 of 2 — Enter room code
        </p>

        {/* Code Input */}
        <input
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value.toUpperCase())
            setError('')
          }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="ABC123"
          maxLength={6}
          className="font-mono bg-transparent border-b-2 border-alibi-gold text-alibi-gold text-center text-3xl outline-none w-72 pb-2 mb-2 placeholder:text-alibi-cream/30 tracking-widest"
        />

        {/* Error */}
        {error && (
          <p className="font-body text-alibi-red text-xs mb-4">{error}</p>
        )}

        {/* Step dots */}
        <div className="flex gap-2 my-6">
          <div className="w-2 h-2 rounded-full bg-alibi-gold/50" />
          <div className="w-2 h-2 rounded-full bg-alibi-gold" />
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={loading}
          className={`font-heading text-alibi-black font-bold transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{
            display: 'inline-flex',
            padding: '19px 47px 18px 49px',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '20px',
            background: '#F9A856',
          }}
        >
          {loading ? 'JOINING...' : 'JOIN ROOM'}
        </button>

      </div>
    </PageLayout>
  )
}