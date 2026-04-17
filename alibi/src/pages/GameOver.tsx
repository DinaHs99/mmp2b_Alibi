import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'
import conspiratorsImg from '../assets/conspirator.png'
import citizensImg from '../assets/citizen.png'

export default function GameOver() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<any[]>([])
  const [winner, setWinner]   = useState<'citizens' | 'conspirators' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    init()
  }, [code])

  const init = async () => {
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('*')

    const foundRoom = allRooms?.find(
      r => r.code.toUpperCase() === code?.toUpperCase()
    )

    if (!foundRoom) { navigate('/'); return }

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', foundRoom.id)

    if (playersData) {
      setPlayers(playersData)
      const alivePlayers      = playersData.filter(p => p.status === 'alive')
      const aliveConspirators = alivePlayers.filter(p => p.role === 'conspirator')
      setWinner(aliveConspirators.length === 0 ? 'citizens' : 'conspirators')
    }

    setLoading(false)
  }

  const conspirators = players.filter(p => p.role === 'conspirator')
  const citizens     = players.filter(p => p.role === 'citizen')

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
        <p className="font-heading text-alibi-gold text-xl animate-pulse">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative w-full flex flex-col"
      style={{
        height: '100dvh',
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top Bar */}
      <div className="flex-shrink-0 flex justify-between items-center px-6 py-4">
        <img src={logo} alt="Alibi" className="w-10" />
        <span className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest">
          Game Over
        </span>
        <div className="w-10" />
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto px-6 pb-8"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex flex-col gap-4 max-w-md mx-auto">

          {/* Winner Banner */}
          <div className={`w-full rounded-2xl border-2 overflow-hidden ${
            winner === 'citizens' ? 'border-alibi-gold' : 'border-alibi-red'
          }`}>
            <img
              src={winner === 'citizens' ? citizensImg : conspiratorsImg}
              alt=""
              className="w-full object-cover max-h-48"
            />
            <div className={`p-5 text-center ${
              winner === 'citizens' ? 'bg-alibi-gold/10' : 'bg-alibi-red/10'
            }`}>
              <p className="font-mono text-alibi-cream/50 text-[9px] uppercase tracking-widest mb-1">
                Winner
              </p>
              <h2 className={`font-heading text-3xl uppercase tracking-widest ${
                winner === 'citizens' ? 'text-alibi-gold' : 'text-alibi-red'
              }`}>
                {winner === 'citizens' ? 'Citizens' : 'Conspirators'}
              </h2>
              <p className="font-body text-alibi-cream/60 text-sm italic mt-2">
                {winner === 'citizens'
                  ? 'Justice has been served. All conspirators have been exposed.'
                  : 'The conspiracy succeeded. The truth never came out.'
                }
              </p>
            </div>
          </div>

          {/* Conspirators */}
          <div className="w-full">
            <p className="font-mono text-alibi-cream/40 text-[9px] uppercase tracking-widest mb-2 text-center">
              The Conspirators Were
            </p>
            <div className="flex flex-col gap-2">
              {conspirators.map(player => (
                <div
                  key={player.id}
                  className="flex justify-between items-center border border-alibi-red/30 bg-alibi-red/5 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-heading text-alibi-cream text-sm uppercase tracking-wide">
                      {player.fake_name}
                    </p>
                    <p className="font-mono text-alibi-cream/40 text-[9px]">
                      {player.occupation}
                    </p>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full ${
                    player.status === 'eliminated'
                      ? 'bg-alibi-red/20 text-alibi-red'
                      : 'bg-green-900/20 text-green-400'
                  }`}>
                    {player.status === 'eliminated' ? 'Caught' : 'Escaped'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Citizens */}
          <div className="w-full">
            <p className="font-mono text-alibi-cream/40 text-[9px] uppercase tracking-widest mb-2 text-center">
              The Citizens
            </p>
            <div className="flex flex-col gap-2">
              {citizens.map(player => (
                <div
                  key={player.id}
                  className="flex justify-between items-center border border-alibi-gold/20 bg-alibi-gold/5 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-heading text-alibi-cream text-sm uppercase tracking-wide">
                      {player.fake_name}
                    </p>
                    <p className="font-mono text-alibi-cream/40 text-[9px]">
                      {player.occupation}
                    </p>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full ${
                    player.status === 'eliminated'
                      ? 'bg-black/30 text-alibi-cream/30'
                      : 'bg-alibi-gold/20 text-alibi-gold'
                  }`}>
                    {player.status === 'eliminated' ? 'Eliminated' : 'Survived'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Play Again */}
          <button
            onClick={() => navigate('/')}
            className="font-heading text-alibi-black font-bold hover:opacity-90 transition w-full mt-2"
            style={{
              display: 'inline-flex',
              padding: '19px 47px 18px 49px',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '20px',
              background: '#F9A856',
            }}
          >
            PLAY AGAIN
          </button>

        </div>
      </div>
    </div>
  )
}