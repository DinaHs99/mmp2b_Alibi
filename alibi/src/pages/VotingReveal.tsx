import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkWinCondition, getEliminatedPlayer, getTiedPlayers } from '../lib/checkWin'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'
import conspiratorsImg from '../assets/conspirator.png'
import citizensImg from '../assets/citizen.png'

export default function VotingReveal() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom]         = useState<any>(null)
  const [eliminated, setEliminated] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [tiedPlayers, setTiedPlayers] = useState<any[]>([])
  const [isTied, setIsTied] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const isHost = sessionStorage.getItem('alibi_is_host') === 'true'

  useEffect(() => {
    if (!code) return
    init()
    return () => {
            supabase.getChannels().forEach(channel => {
            supabase.removeChannel(channel)
            })
    }
  }, [code])

  const init = async () => {

    supabase.getChannels().forEach(channel => {
        supabase.removeChannel(channel)
    })
   
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('*')

    const foundRoom = allRooms?.find(
      r => r.code.toUpperCase() === code?.toUpperCase()
    )

    if (!foundRoom) { navigate('/'); return }
    setRoom(foundRoom)

    if (foundRoom.revealed === true) {
      setRevealed(true)
    }

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', foundRoom.id)

    if (!playersData) return

    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', foundRoom.id)
      .eq('round', foundRoom.round)

    if (!votesData) return

    const alivePlayers     = playersData.filter(p => p.status === 'alive')
    const eliminatedPlayer = getEliminatedPlayer(votesData, alivePlayers)

    if (!eliminatedPlayer && votesData.length >0) {
        const tied = getTiedPlayers(votesData, alivePlayers)
        setTiedPlayers(tied)
        setIsTied(true)
    }
    setEliminated(eliminatedPlayer)

    setLoading(false)

    supabase
      .channel(`reveal-room-${foundRoom.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${foundRoom.id}`
      }, (payload) => {
        console.log('VotingReveal room update:', payload.new)

       
        if (payload.new.revealed === true) {
          setRevealed(true)
          startCountdown()
        }

        if (payload.new.phase === 'voting') {
            navigate(`/room/${code}/voting`)
        }

      
        if (payload.new.phase === 'discussion') {
          navigate(`/room/${code}/discussion`)
        }
        if (payload.new.phase === 'gameover') {
          navigate(`/room/${code}/gameover`)
        }
      })
      .subscribe()
  }

    const handleReveal = async () => {
        if (!isHost || !room) return
        setProcessing(true)

        
        if (isTied) {
            // Step 1 - Remove votes
            await supabase
            .from('votes')
            .delete()
            .eq('room_id', room.id)
            .eq('round', room.round)

           // Step 2 - Save tied players
            await supabase
            .from('rooms')
            .update({
                tie_player_ids: tiedPlayers.map(p => p.id),
            })
            .eq('id', room.id)

            
            await new Promise(resolve => setTimeout(resolve, 500))

            // Step 4 - Change phase to voting 
            await supabase
            .from('rooms')
            .update({ phase: 'voting' })
            .eq('id', room.id)

            setProcessing(false)
            return
        }

        
        if (!eliminated) return

        await supabase
            .from('players')
            .update({ status: 'eliminated' })
            .eq('id', eliminated.id)

        await supabase
            .from('rooms')
            .update({ revealed: true })
            .eq('id', room.id)

        const { data: updatedPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', room.id)

        if (!updatedPlayers) return

        const result = checkWinCondition(updatedPlayers)
        setProcessing(false)

        await new Promise(resolve => setTimeout(resolve, 5000))

        if (result) {
            await supabase
            .from('rooms')
            .update({ phase: 'gameover' })
            .eq('id', room.id)
        } else {
            await supabase
            .from('rooms')
            .update({
                phase: 'discussion',
                round: room.round + 1,
                revealed: false,
                tie_player_ids: null, 
            })
            .eq('id', room.id)

            await supabase
            .from('players')
            .update({ is_ready: false })
            .eq('room_id', room.id)
            .neq('status', 'eliminated')
        }
    }
    const startCountdown = () => {
        let count = 5
        setCountdown(count)
        const countInterval = setInterval(() => {
            count -= 1
            setCountdown(count)
            if (count <= 0) clearInterval(countInterval)
        }, 1000)
    }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
        <p className="font-heading text-alibi-gold text-xl animate-pulse">
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
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >

        {!revealed ? (
          <div className="flex flex-col items-center gap-8 text-center">
            {/*  Tie message */}
            {isTied? (
            <>
                <h2 className="font-heading text-alibi-gold text-3xl uppercase tracking-widest">
                It's A Tie
                </h2>
                <p className="font-body text-alibi-cream/60 text-sm italic max-w-sm">
                The votes are tied between these players. A revote will begin.
                </p>
                {/* Show tied players */}
                <div className="flex gap-3">
                {tiedPlayers.map(player => (
                    <div
                    key={player.id}
                    className="border border-alibi-red/50 bg-alibi-red/10 rounded-xl px-4 py-3"
                    >
                    <p className="font-heading text-alibi-cream text-sm uppercase">
                        {player.fake_name}
                    </p>
                    <p className="font-mono text-alibi-cream/40 text-[9px]">
                        {player.occupation}
                    </p>
                    </div>
                ))}
                </div>
            </>
            ) : (
            <>
                <h2 className="font-heading text-alibi-gold text-3xl uppercase tracking-widest">
                The Verdict Is In
                </h2>
                <p className="font-body text-alibi-cream/60 text-sm italic max-w-sm">
                The votes have been counted. One player will be eliminated.
                </p>
            </>
            )}

            {/* Host button */}
            {isHost && !processing && (
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
                {isTied? 'START REVOTE' : 'REVEAL'}
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
                {isTied? 'Tie detected. Waiting for host...' : 'Waiting for host to reveal...'}
                </p>
            </div>
            )}

            {/* Processing */}
            {processing && (
              <p className="font-mono text-alibi-cream/40 text-xs animate-pulse">
                Processing results...
              </p>
            )}
          </div>

        ) : (
          
          <div className="flex flex-col items-center gap-4 w-full max-w-sm text-center py-4">

            <div className={`w-full rounded-2xl border-2 overflow-hidden ${
              isConspirator ? 'border-alibi-red' : 'border-alibi-gold'
            }`}>
              <img
                src={isConspirator ? conspiratorsImg : citizensImg}
                alt=""
                className="w-full object-cover"
              />

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

                {/* Countdown */}
                {countdown !== null && countdown > 0 && (
                  <p className="font-mono text-alibi-cream/40 text-xs mt-4">
                    Continuing in {countdown}...
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}