import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkWinCondition, getEliminatedPlayer } from '../lib/checkWin'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'
import conspiratorsImg from '../assets/conspirator.png'
import citizensImg from '../assets/citizen.png'

export default function VotingReveal(){
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom]                   = useState<any>(null)
  const [eliminated, setEliminated]       = useState<any>(null)
  const [loading, setLoading]             = useState(true)
  const [revealed, setRevealed]           = useState(false)
  const [processing, setProcessing]       = useState(false)
  const [countdown, setCountdown]         = useState<number | null>(null)

  const isHost    = sessionStorage.getItem('alibi_is_host') === 'true'

  useEffect(() => {
    if (!code) return
    init()
  }, [code])

  const init = async () => {
    // Get room
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('*')

    const foundRoom = allRooms?.find(
      r => r.code.toUpperCase() === code?.toUpperCase()
    )

    if (!foundRoom) { navigate('/'); return }
    setRoom(foundRoom)

    // Get all players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', foundRoom.id)

    if (!playersData) return

    // Get votes for this round
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', foundRoom.id)
      .eq('round', foundRoom.round)

    if (!votesData) return

    // Find eliminated player
    const alivePlayers    = playersData.filter(p => p.status === 'alive')
    const eliminatedPlayer = getEliminatedPlayer(votesData, alivePlayers)
    setEliminated(eliminatedPlayer)

    setLoading(false)

    // Subscribe to room phase changes
    supabase
      .channel(`reveal-phase-${foundRoom.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${foundRoom.id}`
      }, (payload) => {
        const phase = payload.new.phase
        if (phase === 'discussion') navigate(`/room/${code}/discussion`)
        if (phase === 'gameover')   navigate(`/room/${code}/gameover`)
      })
      .subscribe()
  }

  const handleReveal = async () => {
    setRevealed(true)

    if (!isHost || !eliminated || !room) return
    setProcessing(true)

    // Eliminate player in DB
    await supabase
      .from('players')
      .update({ status: 'eliminated' })
      .eq('id', eliminated.id)

    // Get updated players after elimination
    const { data: updatedPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)

    if (!updatedPlayers) return

    // Check win condition
    const result = checkWinCondition(updatedPlayers)

    await new Promise(resolve => setTimeout(resolve,6000))

    if (result) {
      // Someone won → game over
      await supabase
        .from('rooms')
        .update({ phase: 'gameover' })
        .eq('id', room.id)
    } else {
      // No winner → next round
      await supabase
        .from('rooms')
        .update({
          phase: 'discussion',
          round: room.round + 1,
        })
        .eq('id', room.id)

      // Reset is_ready for all players
      await supabase
        .from('players')
        .update({ is_ready: false })
        .eq('room_id', room.id)
    }

    setProcessing(false)

    let count = 5
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        navigate(`/room/${code}/discussion`)
      }
    }, 1000)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
       
        <p className="relative z-10 font-heading text-alibi-gold text-xl animate-pulse">
          The verdict is in...
        </p>
      </div>
    )
  }

  const isConspirator = eliminated?.role === 'conspirator'

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col"
      style={{
        height: '100dvh',
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >

      {/* Top Bar */}
      <div className="relative z-10 flex-shrink-0 flex justify-between items-center px-6 py-4">
        <img src={logo} alt="Alibi" className="w-10" />
        <span className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest">
          Round {room?.round} — The Verdict
        </span>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8">

        {!revealed ? (
          // Before reveal
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="font-heading text-alibi-gold text-3xl uppercase tracking-widest">
              The Verdict Is In
            </h2>
            <p className="font-body text-alibi-cream/60 text-sm italic max-w-sm">
              The votes have been counted. One player will be eliminated. Are you ready to see who it is?
            </p>
            {isHost && (
              <button
                onClick={handleReveal}
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
                REVEAL
              </button>
            )}
            {!isHost && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                    style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                    style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                    style={{ animationDelay: '300ms' }} />
                </div>
                <p className="font-body text-alibi-cream/40 text-sm italic">
                  Waiting for host to reveal...
                </p>
              </div>
            )}
          </div>

        ) : (
          
          <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center">

            {/* Eliminated Player Card */}
            <div className={`w-full rounded-2xl border-2 overflow-hidden ${
              isConspirator
                ? 'border-alibi-red'
                : 'border-alibi-gold'
            }`}>
              {/* Image */}
              <img
                src={isConspirator ? conspiratorsImg : citizensImg}
                alt=""
                className="w-full object-cover"
              />

              {/* Info */}
              <div className={`p-6 ${
                isConspirator ? 'bg-alibi-red/10' : 'bg-alibi-gold/10'
              }`}>
                <p className="font-mono text-alibi-cream/50 text-[9px] uppercase tracking-widest mb-1">
                  Eliminated
                </p>
                <h2 className="font-heading text-alibi-cream text-3xl uppercase tracking-widest mb-1">
                  {eliminated?.fake_name}
                </h2>
                <p className="font-mono text-alibi-cream/50 text-xs mb-4">
                  {eliminated?.occupation}
                </p>

                <div className={`border-t mb-4 ${
                  isConspirator ? 'border-alibi-red/30' : 'border-alibi-gold/30'
                }`} />

                <p className={`font-heading text-xl uppercase tracking-widest ${
                  isConspirator ? 'text-alibi-red' : 'text-alibi-gold'
                }`}>
                  {isConspirator ? '🔴 Conspirator' : '🔵 Citizen'}
                </p>

                <p className="font-body text-alibi-cream/50 text-xs italic mt-2">
                  {isConspirator
                    ? 'A conspirator has been eliminated. Good work citizens.'
                    : 'An innocent citizen has been eliminated. The conspirators are still among you.'
                  }
                </p>
              </div>
              {/* countdown */}
                {revealed && !processing && countdown !== null && countdown > 0 && (
                <p className="font-mono text-alibi-cream/40 text-xs text-center">
                    Continuing in {countdown}...
                </p>
                )}
            </div>

            {/* Processing */}
            {processing && (
              <p className="font-mono text-alibi-cream/40 text-xs animate-pulse">
                Processing results...
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  )
}