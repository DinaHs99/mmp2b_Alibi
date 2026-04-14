import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'
import conspiratorimg from '../assets/conspirator.png'
import citizenimg from '../assets/citizen.png'

interface Player {
  id: string
  fake_name: string
  role: string
  occupation: string
  private_clue: string
  session_id: string
}

export default function RoleReveal() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer]   = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    fetchMyPlayer()
  }, [code])

  const fetchMyPlayer = async () => {
    const sessionId = sessionStorage.getItem('alibi_session_id')
    if (!sessionId) {
      navigate('/')
      return
    }

   
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('*')

    const room = allRooms?.find(
      r => r.code.toUpperCase() === code?.toUpperCase()
    )

    if (!room) {
      navigate('/')
      return
    }

    
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .eq('session_id', sessionId)

    if (players && players.length > 0) {
      setPlayer(players[0])
    }

    setLoading(false)
  }

  const isConspirator = player?.role === 'conspirator'

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <p className="relative z-10 font-heading text-alibi-gold text-xl animate-pulse">
          Loading your role...
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6">
        <img src={logo} alt="Alibi" className="w-16" />
        <span className="font-heading text-alibi-gold text-sm uppercase tracking-widest">
          Role Reveal
        </span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 pb-8">

        {!revealed ? (
          
          <div className="flex flex-col items-center gap-8">
            <p className="font-body text-alibi-cream/70 text-sm italic text-center max-w-sm">
              Your role has been assigned. Make sure nobody is watching your screen before you reveal it.
            </p>

            <button
              onClick={() => setRevealed(true)}
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
              REVEAL MY ROLE
            </button>
          </div>

        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">

            {/* Role Card */}
            <div className={`w-full rounded-2xl border-2 p-8 text-center ${
              isConspirator
                ? 'border-alibi-red bg-alibi-red/10'
                : 'border-alibi-gold bg-alibi-gold/10'
            }`}>

                {/* Role Image */}

                <div className="w-full mb-6 rounded-xl overflow-hidden">
                <img
                    src={isConspirator ? conspiratorimg : citizenimg}
                    alt={isConspirator ? 'Conspirator' : 'Citizen'}
                    className="w-full object-cover"
                />
                </div>

              {/* Team */}
              <p className={`font-mono text-xs uppercase tracking-widest mb-2 ${
                isConspirator ? 'text-alibi-red' : 'text-alibi-gold'
              }`}>
                {isConspirator ? 'Conspirator' : 'Citizen'}
              </p>

              {/* Occupation */}
              <h2 className="font-heading text-alibi-cream text-3xl uppercase tracking-widest mb-6">
                {player?.occupation}
              </h2>

              <div className="border-t border-alibi-cream/20 mb-6" />

              {/* Private Clue */}
              <div className="text-left">
                <p className="font-mono text-alibi-cream/50 text-[9px] uppercase tracking-widest mb-2">
                  Your Private Clue
                </p>
                <p className="font-body text-alibi-cream text-sm leading-relaxed italic">
                  "{player?.private_clue}"
                </p>
              </div>

              {/* Conspirator extra info */}
              {isConspirator && (
                <>
                  <div className="border-t border-alibi-red/20 mt-6 mb-4" />
                  <p className="font-body text-alibi-red/80 text-xs italic">
                    You are a Conspirator. Blend in. Deny everything. Eliminate the citizens.
                  </p>
                </>
              )}

              {/* Citizen extra info */}
              {!isConspirator && (
                <>
                  <div className="border-t border-alibi-gold/20 mt-6 mb-4" />
                  <p className="font-body text-alibi-cream/60 text-xs italic">
                    You are a Citizen. Use your clue. Find the truth. Vote wisely.
                  </p>
                </>
              )}

            </div>

            
            <button
              onClick={() => navigate(`/room/${code}/discussion`)}
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
              I AM READY
            </button>

            <p className="font-body text-alibi-cream/30 text-xs italic">
              Remember your role. Tell no one.
            </p>

          </div>
        )}

      </div>
    </div>
  )
}