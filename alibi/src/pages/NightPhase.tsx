import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'

export default function NightPhase() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isEliminated, setIsEliminated] = useState(false)
  const [hostAlive, setHostAlive] = useState(true)
  const [canAutoAdvance, setCanAutoAdvance] = useState(false)

  const isHost = sessionStorage.getItem('alibi_is_host') === 'true'

  useEffect(() => {
    if (!code) return

    const init = async () => {
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

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', foundRoom.id)

      const alivePlayers = players?.filter(player => player.status === 'alive') || []
      const myPlayer = players?.find(player => player.session_id === sessionStorage.getItem('alibi_session_id'))
      const nextHostAlive = alivePlayers.some(player => player.is_host)
      const firstAlivePlayer = alivePlayers[0]

      setIsEliminated(myPlayer?.status === 'eliminated')
      setHostAlive(nextHostAlive)
      setCanAutoAdvance(
        myPlayer?.status === 'alive' &&
        !nextHostAlive &&
        firstAlivePlayer?.session_id === myPlayer.session_id
      )

      setLoading(false)

      supabase
        .channel(`night-room-${foundRoom.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${foundRoom.id}`
        }, (payload) => {
          if (payload.new.phase === 'discussion') {
            navigate(`/room/${code}/discussion`)
          }

          if (payload.new.phase === 'gameover') {
            navigate(`/room/${code}/gameover`)
          }
        })
        .subscribe()
    }

    init()

    return () => {
      supabase.getChannels().forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [code])

  useEffect(() => {
    if (!room || !canAutoAdvance || hostAlive || processing) return

    const timeout = setTimeout(() => {
      startNextDay()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [room, canAutoAdvance, hostAlive, processing])

  const startNextDay = async () => {
    if (!room || (!isHost && !canAutoAdvance)) return
    setProcessing(true)

    const { error } = await supabase
      .from('rooms')
      .update({ phase: 'discussion' })
      .eq('id', room.id)

    if (error) {
      console.error('Failed to start next day:', error)
      setProcessing(false)
      return
    }

    navigate(`/room/${code}/discussion`)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
        <p className="font-heading text-alibi-gold text-xl animate-pulse">
          Night falls...
        </p>
      </div>
    )
  }

  if (isEliminated) {
    return (
      <div
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-8"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-sm rounded-2xl border border-alibi-red/40 bg-alibi-red/10 p-8">
          <p className="font-mono text-alibi-red text-[9px] uppercase tracking-widest mb-3">
            Eliminated
          </p>
          <h2 className="font-heading text-alibi-cream text-3xl uppercase tracking-widest mb-4">
            You Are Out
          </h2>
          <p className="font-body text-alibi-cream/60 text-sm italic leading-relaxed">
            Night falls, but your investigation is over. Wait for the remaining players to finish the game.
          </p>
        </div>
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
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="relative z-10 flex justify-between items-center px-8 py-6">
        <img src={logo} alt="Alibi" className="w-16" />
        <span className="font-heading text-alibi-gold text-sm uppercase tracking-widest">
          Night Phase
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 pb-8 text-center">
        <div className="w-full max-w-md rounded-2xl border-2 border-alibi-cream/20 bg-black/40 p-8">
          <p className="font-mono text-alibi-cream/50 text-[9px] uppercase tracking-widest mb-3">
            Round {room?.round || 1}
          </p>

          <h1 className="font-heading text-alibi-gold text-4xl uppercase tracking-widest mb-6">
            Night Falls
          </h1>

          <p className="font-body text-alibi-cream/70 text-sm italic leading-relaxed mb-8">
            The room goes quiet. The remaining players prepare for the next day, where new evidence will be revealed.
          </p>

          {isHost && !isEliminated ? (
            <button
              onClick={startNextDay}
              disabled={processing}
              className="font-heading text-alibi-black font-bold hover:opacity-90 transition disabled:opacity-40"
              style={{
                display: 'inline-flex',
                padding: '19px 47px 18px 49px',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '20px',
                background: '#F9A856',
              }}
            >
              {processing ? 'STARTING...' : 'START NEXT DAY'}
            </button>
          ) : (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              {hostAlive
                ? 'Waiting for the host to start the next day...'
                : 'The next day will begin automatically...'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
