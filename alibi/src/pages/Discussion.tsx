import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'

interface Message {
  id: string
  fake_name: string
  content: string
  created_at: string
}

interface Player {
  id: string
  fake_name: string
  role: string
  occupation: string
  status: string
  session_id: string
  is_ready: boolean
}

const DISCUSSION_TIME = 180

export default function Discussion() {
  const { code }  = useParams()
  const navigate  = useNavigate()
  const [room, setRoom]               = useState<any>(null)
  const [players, setPlayers]         = useState<Player[]>([])
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [timeLeft, setTimeLeft]       = useState(DISCUSSION_TIME)
  const [evidence, setEvidence]       = useState('')
  const [loading, setLoading]         = useState(true)
  const [timerStarted, setTimerStarted] = useState(false)
  const [iAmReady, setIAmReady]       = useState(false)
  const [privateClue, setPrivateClue] = useState('')
  const [showClue, setShowClue]       = useState(false)
  const chatEndRef                    = useRef<HTMLDivElement>(null)
  const timerRef                      = useRef<any>(null)
  const roomRef                       = useRef<any>(null)

  const sessionId  = sessionStorage.getItem('alibi_session_id')
  const playerName = sessionStorage.getItem('alibi_player_name')
  const isHost     = sessionStorage.getItem('alibi_is_host') === 'true'

  useEffect(() => {
    if (!code) return
    init()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [code])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if all players ready
  useEffect(() => {
    if (players.length === 0 || timerStarted) return
    const alivePlayers = players.filter(p => p.status === 'alive')
    const allReady     = alivePlayers.every(p => p.is_ready)
    if (allReady && alivePlayers.length > 0) {
      setTimerStarted(true)
      startTimer()
    }
  }, [players])

  const init = async () => {
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('*')

    const foundRoom = allRooms?.find(
      r => r.code.toUpperCase() === code?.toUpperCase()
    )

    if (!foundRoom) { navigate('/'); return }

    setRoom(foundRoom)
    roomRef.current = foundRoom

    // Get scenario evidence
    const { data: scenario } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', foundRoom.scenario_id)
      .single()

    if (scenario) {
      const round        = foundRoom.round || 1
      const evidenceList = scenario.round_evidence || []
      setEvidence(evidenceList[round - 1] || 'No evidence for this round.')
    }

    // Get players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', foundRoom.id)
      .eq('status', 'alive')

    if (playersData) {
      setPlayers(playersData)

      
      const me = playersData.find(p => p.session_id === sessionId)
      if (me) setPrivateClue(me.private_clue || '')
    }

    // Get messages
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', foundRoom.id)
      .eq('channel', 'public')
      .order('created_at', { ascending: true })

    if (messagesData) setMessages(messagesData)

    setLoading(false)

    // Subscriptions
    const messagesChannel = supabase
      .channel(`messages-${foundRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${foundRoom.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })

    const playersChannel = supabase
      .channel(`discussion-players-${foundRoom.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${foundRoom.id}`
      }, () => {
        fetchPlayers(foundRoom.id)
      })

    const roomChannel = supabase
      .channel(`discussion-phase-${foundRoom.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${foundRoom.id}`
      }, (payload) => {
        if (payload.new.phase === 'voting') {
          navigate(`/room/${code}/voting`)
        }
      })

    messagesChannel.subscribe()
    playersChannel.subscribe()
    roomChannel.subscribe()
  }

  const fetchPlayers = async (roomId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'alive')
    if (data) setPlayers(data)
  }

    const startTimer = () => {
    timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
        if (prev <= 1) {
            clearInterval(timerRef.current)
            
            if (sessionStorage.getItem('alibi_is_host') === 'true') {
            moveToVoting(roomRef.current.id)
            }
            return 0
        }
        return prev - 1
        })
    }, 1000)
    }

  const moveToVoting = async (roomId: string) => {
    await supabase
      .from('rooms')
      .update({ phase: 'voting' })
      .eq('id', roomId)
  }

  const handleReady = async () => {
    if (!room || !sessionId) return
    const { data: myPlayerData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .eq('session_id', sessionId)
      .single()

    if (!myPlayerData) return

    await supabase
      .from('players')
      .update({ is_ready: true })
      .eq('id', myPlayerData.id)

    setIAmReady(true)
  }

  const sendMessage = async () => {
    if (!input.trim() || !room) return
    const { error } = await supabase
      .from('messages')
      .insert({
        room_id:   room.id,
        fake_name: playerName,
        channel:   'public',
        content:   input.trim(),
      })
    if (error) console.error('Send error:', error)
    setInput('')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const alivePlayers = players.filter(p => p.status === 'alive')
  const readyCount   = alivePlayers.filter(p => p.is_ready).length
  const totalCount   = alivePlayers.length

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
      >
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

      
      <div className="relative z-10 flex-shrink-0">

        {/* Top Bar */}
        <div className="flex justify-between items-center px-6 py-4">
          <img src={logo} alt="Alibi" className="w-10" />
          <div className="flex items-center gap-4">
            <span className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest">
              Round {room?.round || 1}
            </span>
            {timerStarted && (
              <div className={`font-heading text-2xl ${
                timeLeft <= 30 ? 'text-alibi-red animate-pulse' : 'text-alibi-gold'
              }`}>
                {formatTime(timeLeft)}
              </div>
            )}
            {!timerStarted && (
              <div className="font-mono text-alibi-cream/40 text-sm">
                {readyCount}/{totalCount} ready
              </div>
            )}
          </div>
          <span className="font-heading text-alibi-gold text-sm">
            👤 {playerName}
          </span>
        </div>

        {/* Evidence Card */}
        <div className="mx-6 mb-3">
          <div className="border border-alibi-gold/30 bg-alibi-gold/5 rounded-2xl p-4">
            <p className="font-mono text-alibi-gold text-[9px] uppercase tracking-widest mb-1">
              Round {room?.round || 1} Evidence
            </p>
            <p className="font-body text-alibi-cream text-sm italic leading-relaxed">
              "{evidence}"
            </p>
          </div>
        </div>

        {/* Private Clue */}
        <div className="mx-6 mb-3">
          <button
            onClick={() => setShowClue(!showClue)}
            className="w-full flex justify-between items-center border border-alibi-cream/10 bg-black/30 rounded-2xl px-4 py-3 transition hover:border-alibi-cream/30"
          >
            <span className="font-mono text-alibi-cream/50 text-[9px] uppercase tracking-widest">
              🔒 My Private Clue
            </span>
            <span className="font-mono text-alibi-cream/30 text-xs">
              {showClue ? '▲ hide' : '▼ show'}
            </span>
          </button>
          {showClue && (
            <div className="border border-alibi-cream/10 border-t-0 bg-black/40 rounded-b-2xl px-4 py-3">
              <p className="font-body text-alibi-cream text-sm italic leading-relaxed">
                "{privateClue}"
              </p>
            </div>
          )}
        </div>

        {/* Players Row */}
        <div className="mx-6 mb-3">
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {alivePlayers.map(player => (
              <div
                key={player.id}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${
                  player.session_id === sessionId
                    ? 'border-alibi-gold bg-alibi-gold/10'
                    : player.is_ready
                    ? 'border-green-500/50 bg-green-900/10'
                    : 'border-alibi-cream/10 bg-black/20'
                }`}
              >
                <span className="text-sm">
                  {player.is_ready ? '✅' : '👤'}
                </span>
                <p className="font-heading text-alibi-cream text-[8px] uppercase tracking-wide whitespace-nowrap">
                  {player.fake_name}
                </p>
                <p className="font-mono text-alibi-cream/40 text-[7px] whitespace-nowrap">
                  {player.occupation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Banner */}
        {!timerStarted && (
          <div className="mx-6 mb-3">
            <div className="border border-alibi-cream/10 bg-black/30 rounded-2xl px-4 py-3 text-center">
              <p className="font-mono text-alibi-cream/50 text-xs">
                Waiting for all players to be ready...
              </p>
            </div>
          </div>
        )}

      </div>

      {/* CHAT SECTION*/}
      <div className="relative z-10 flex flex-col flex-1 mx-6 min-h-0">

        {/* Messages - only this scrolls */}
        <div
          className="flex-1 overflow-y-auto space-y-3 py-2 pr-1"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="text-center py-2">
            <span className="font-mono text-alibi-cream/20 text-[9px] uppercase tracking-widest">
              Discussion has begun. Use your clue wisely.
            </span>
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.fake_name === playerName ? 'items-end' : 'items-start'
              }`}
            >
              <span className="font-mono text-alibi-cream/40 text-[8px] uppercase tracking-widest mb-1 px-1">
                {msg.fake_name}
              </span>
              <div className={`max-w-xs px-4 py-2 rounded-2xl font-mono text-sm ${
                msg.fake_name === playerName
                  ? 'bg-alibi-gold text-alibi-black'
                  : 'bg-alibi-cream/10 text-alibi-cream'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 flex gap-3 items-center py-3">
          <input
            type="text"
                        value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={timerStarted ? "Say something..." : "Waiting for discussion to start..."}
            disabled={!timerStarted}
            className="flex-1 font-mono bg-black/40 border border-alibi-cream/20 text-alibi-cream text-sm rounded-full px-4 py-3 outline-none placeholder:text-alibi-cream/20 focus:border-alibi-gold transition disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !timerStarted}
            className="font-heading text-alibi-black font-bold px-6 py-3 rounded-full transition hover:opacity-90 disabled:opacity-30"
            style={{ background: '#F9A856' }}
          >
            SEND
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-shrink-0 flex justify-center gap-4 px-6 pb-6">

      
        {!iAmReady && !timerStarted && (
          <button
            onClick={handleReady}
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
        )}

       
        {iAmReady && !timerStarted && (
          <p className="font-body text-alibi-cream/50 text-sm italic py-4">
            Waiting for others...
          </p>
        )}

        {isHost && !timerStarted && (
          <button
            onClick={ () => {
                setTimerStarted(true)
                startTimer()
            }}
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
            START DISCUSSION
          </button>
        )}

        {isHost && timerStarted && (
          <button
            onClick={() => moveToVoting(room.id)}
            className="font-mono text-alibi-cream/40 text-xs border border-alibi-cream/20 px-4 py-2 rounded-full hover:border-alibi-red hover:text-alibi-red transition"
          >
            Skip to Voting →
          </button>
        )}

      </div>

    </div>
  )
}