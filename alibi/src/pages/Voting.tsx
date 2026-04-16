import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import bg from "../assets/hero-texture.png";
import logo from "../assets/logo1.png";

interface Player {
    id: string
    fake_name: string
    occupation: string
    status: string
    session_id: string
}

export default function Voting() {
    const { code } = useParams()
    const navigate = useNavigate()
    const [players, setPlayers] = useState<Player[]>([])
    const [room, setRoom] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [hasVoted, setHasVoted] = useState(false)
    const [votes, setVotes] = useState<any[]>([])

    const sessionId = sessionStorage.getItem('alibi_session_id')
    const playerName = sessionStorage.getItem('alibi_player_name')
    const isHost = sessionStorage.getItem('alibi_is_host') === 'true'

    useEffect(() => {
        if (!code) return
        init()
    }, [code])

    const init = async () => {
        // Step 1 - find room
        const { data: allRooms } = await supabase
            .from('rooms')
            .select('*')

        const foundRoom = allRooms?.find(
            r => r.code.toUpperCase() === code?.toUpperCase()
        )

        if (!foundRoom) {
            navigate('/')
            return
        }

        setRoom(foundRoom)  

        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', foundRoom.id)
            .eq('status', 'alive')

        if (playersData) {
            setPlayers(playersData)
            setLoading(false)
        }
        //get existing votes
        const { data: votesData } = await supabase
            .from('votes')
            .select('*')
            .eq('room_id', foundRoom.id)
            .eq('round', foundRoom.round)
        if (votesData) {
            setVotes(votesData)
            const myVote = votesData.find(v => v.session_id === sessionId)
            if (myVote) {
                setHasVoted(true)
            }
        }
        setLoading(false)

        const votesChannel = supabase
            .channel(`room-votes-${foundRoom.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'votes',
                filter: `room_id=eq.${foundRoom.id}`
            }, (payLoad) => {
                setVotes(prev => [...prev, payLoad.new])
            })
        
        const roomChannel = supabase
            .channel(`room-players-${foundRoom.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'players',
                filter: `room_id=eq.${foundRoom.id}`
            }, (payLoad) => {
                if (payLoad.new.phase === 'reveal') {
                    navigate(`/room/${foundRoom.code}/role-reveal`)
                }
            })
        
            votesChannel.subscribe()
            roomChannel.subscribe()
    }


   const handleVote = async () => {
    if (!selectedId || !room || hasVoted) return

    const { error } = await supabase
      .from('votes')
      .insert({
        room_id:       room.id,
        round:         room.round,
        voter_session: sessionId,
        target_id:     selectedId,
      })

    if (error) {
      console.error('Vote error:', error)
      return
    }

    setHasVoted(true)
  }

  // Host reveals result when all voted
  const handleReveal = async () => {
    if (!room) return
    await supabase
      .from('rooms')
      .update({ phase: 'reveal' })
      .eq('id', room.id)
  }

  const allVoted = votes.length === players.length 
  const voteCount = (playerId: string) => votes.filter(v => v.target_id === playerId).length

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <p className="relative z-10 font-heading text-alibi-gold text-xl animate-pulse">
          Loading...
        </p>
      </div>
    )
  }

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
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Top Bar */}
      <div className="relative z-10 flex-shrink-0 flex justify-between items-center px-6 py-4">
        <img src={logo} alt="Alibi" className="w-10" />
        <span className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest">
          Round {room?.round || 1} — Voting
        </span>
        <span className="font-heading text-alibi-gold text-sm">
          👤 {playerName}
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 flex-shrink-0 text-center px-6 mb-6">
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Cast Your Vote
        </h2>
        <p className="font-body text-alibi-cream/60 text-sm italic">
          Who do you think is a Conspirator?
        </p>
        <p className="font-mono text-alibi-cream/40 text-xs mt-2">
          {votes.length} / {players.length} voted
        </p>
      </div>

   
      <div
        className="relative z-10 flex-1 overflow-y-auto px-6"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="grid grid-cols-2 gap-4 pb-4">
          {players.map(player => {
            const isMe       = player.session_id === sessionId
            const isSelected = selectedId === player.id
            const count      = voteCount(player.id)

            return (
              <button
                key={player.id}
                onClick={() => {
                  if (hasVoted || isMe) return
                  setSelectedId(player.id)
                }}
                disabled={hasVoted || isMe}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  isMe
                    ? 'border-alibi-cream/10 bg-black/20 opacity-40 cursor-not-allowed'
                    : isSelected
                    ? 'border-alibi-red bg-alibi-red/10'
                    : 'border-alibi-cream/20 bg-black/30 hover:border-alibi-cream/40'
                }`}
              >
                <span className="text-3xl">👤</span>
                <p className="font-heading text-alibi-cream text-sm uppercase tracking-wide">
                  {player.fake_name}
                </p>
                <p className="font-mono text-alibi-cream/40 text-[9px]">
                  {player.occupation}
                </p>
                {isMe && (
                  <span className="font-mono text-[8px] text-alibi-cream/30 uppercase">
                    You
                  </span>
                )}
            
                {hasVoted && count > 0 && (
                  <span className="font-mono text-xs text-alibi-red">
                    {count} vote{count > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

     
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-3 px-6 pb-6 pt-3">

      
        {!hasVoted && (
          <button
            onClick={handleVote}
            disabled={!selectedId}
            className={`font-heading font-bold transition w-full ${
              selectedId
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
            CONFIRM VOTE
          </button>
        )}

        {/* Voted confirmation */}
        {hasVoted && !allVoted && (
          <div className="flex flex-col items-center gap-2">
            <p className="font-body text-alibi-cream/50 text-sm italic">
              Vote cast. Waiting for others...
            </p>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-alibi-gold animate-bounce"
                style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Host reveal button */}
        {isHost && hasVoted && (
          <button
            onClick={handleReveal}
            className={`font-mono text-xs border px-4 py-2 rounded-full transition ${
              allVoted
                ? 'border-alibi-gold text-alibi-gold hover:bg-alibi-gold/10'
                : 'border-alibi-cream/20 text-alibi-cream/40 hover:border-alibi-red hover:text-alibi-red'
            }`}
          >
            {allVoted ? 'Reveal Results →' : 'Force Reveal →'}
          </button>
        )}

      </div>
    </div>
  )
}