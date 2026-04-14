import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGame } from '../context/GameContext'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'

interface Player {
  id: string
  fake_name: string
  is_host: boolean
  status: string
  session_id: string
}

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { playerName, isHost } = useGame()
  const [players, setPlayers] = useState<Player[]>([])
  const [room, setRoom] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPlayers = async (roomId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)

    if (data) setPlayers(data)
  }

  useEffect(() => {
    if (!code) return

    let channel: any = null

    const init = async () => {
      // Step 1 - find room
      const { data: allRooms } = await supabase
        .from('rooms')
        .select('*')

      const foundRoom = allRooms?.find(
        r => r.code.toUpperCase() === code.toUpperCase()
      )

      if (!foundRoom) {
        navigate('/')
        return
      }

      setRoom(foundRoom)

      // Step 2 - fetch players
      await fetchPlayers(foundRoom.id)
      setLoading(false)

      // Step 3 - subscribe AFTER we have room
      // ✅ .on() must be called BEFORE .subscribe()
      channel = supabase
        .channel(`room-players-${foundRoom.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${foundRoom.id}`
        }, () => {
          fetchPlayers(foundRoom.id)
        })
        .subscribe()
    }

    init()

    // Cleanup on unmount
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [code])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = async () => {
    if (!room) return
    await supabase
      .from('rooms')
      .update({ phase: 'night' })
      .eq('id', room.id)
  }

  const canStart = players.length >= (room?.player_count || 5)

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <p className="relative z-10 font-heading text-alibi-gold text-xl animate-pulse">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6">
        <img src={logo} alt="Alibi" className="w-16" />
        <div className="flex items-center gap-2">
          <span className="font-heading text-alibi-gold text-sm">
            👤 {playerName || localStorage.getItem('alibi_player_name')}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-8 pb-8">

        {/* Room Code */}
        <div className="text-center mb-8">
          <p className="font-body text-alibi-cream/60 text-sm uppercase tracking-widest mb-2">
            Room Code
          </p>
          <h1 className="font-heading text-alibi-gold text-6xl tracking-widest mb-4">
            {code}
          </h1>
          <button
            onClick={handleCopyCode}
            className="font-mono text-alibi-cream/60 text-xs border border-alibi-cream/20 px-4 py-2 rounded-full hover:border-alibi-gold hover:text-alibi-gold transition"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Player Count */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-16 bg-alibi-cream/20" />
          <p className="font-body text-alibi-cream/60 text-sm">
            {players.length} / {room?.player_count} players joined
          </p>
          <div className="h-px w-16 bg-alibi-cream/20" />
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-2xl">

          {players.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-alibi-gold/30 bg-alibi-gold/5"
            >
              <div className="w-12 h-12 rounded-full bg-alibi-gold/20 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <p className="font-heading text-alibi-cream text-xs uppercase tracking-wide text-center">
                {player.fake_name}
              </p>
              {player.is_host && (
                <span className="font-mono text-[8px] text-alibi-gold uppercase tracking-widest">
                  Host
                </span>
              )}
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: (room?.player_count || 5) - players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-alibi-cream/10 bg-black/20"
            >
              <div className="w-12 h-12 rounded-full bg-alibi-cream/5 flex items-center justify-center">
                <span className="text-xl opacity-30">👤</span>
              </div>
              <p className="font-heading text-alibi-cream/20 text-xs uppercase tracking-wide">
                Waiting...
              </p>
            </div>
          ))}

        </div>

        {/* Host Controls */}
        {isHost ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`font-heading font-bold transition ${
                canStart
                  ? 'text-alibi-black hover:opacity-90'
                  : 'text-alibi-black opacity-30 cursor-not-allowed'
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
              START GAME
            </button>
            {!canStart && (
              <p className="font-body text-alibi-cream/40 text-xs">
                Need {(room?.player_count || 5) - players.length} more players to start
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="font-body text-alibi-cream/50 text-sm italic">
              Waiting for host to start the game...
            </p>
          </div>
        )}

      </div>
    </div>
  )
}