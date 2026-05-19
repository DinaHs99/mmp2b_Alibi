import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'

interface Player {
  id: string
  fake_name: string
  role: string
  status: string
  session_id: string
  is_host: boolean
}

interface NightAction {
  id: string
  room_id: string
  round: number
  actor_id: string
  target_id: string | null
  action_type: string
}

export default function NightPhase() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [nightActions, setNightActions] = useState<NightAction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isEliminated, setIsEliminated] = useState(false)
  const [canAutoAdvance, setCanAutoAdvance] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  const isHost = sessionStorage.getItem('alibi_is_host') === 'true'
  const sessionId = sessionStorage.getItem('alibi_session_id')
  const alivePlayers = players.filter(player => player.status === 'alive')
  const requiredActors = alivePlayers.filter(player => player.role === 'conspirator')
  const completedActorIds = new Set(nightActions.map(action => action.actor_id))
  const hasSubmittedAction = myPlayer ? completedActorIds.has(myPlayer.id) : false
  const allRequiredActionsComplete =
    requiredActors.length === 0 ||
    requiredActors.every(player => completedActorIds.has(player.id))
  const requiredDoneCount = requiredActors.filter(player => completedActorIds.has(player.id)).length
  const isConspirator = myPlayer?.role === 'conspirator'

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
      const currentPlayer = players?.find(player => player.session_id === sessionId) || null
      const nextHostAlive = alivePlayers.some(player => player.is_host)
      const firstAlivePlayer = alivePlayers[0]

      setPlayers(players || [])
      setMyPlayer(currentPlayer)
      setIsEliminated(currentPlayer?.status === 'eliminated')
      setCanAutoAdvance(
        currentPlayer?.status === 'alive' &&
        !nextHostAlive &&
        firstAlivePlayer?.session_id === currentPlayer.session_id
      )

      const { data: actions } = await supabase
        .from('night_actions')
        .select('*')
        .eq('room_id', foundRoom.id)
        .eq('round', foundRoom.round)

      setNightActions(actions || [])

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

      supabase
        .channel(`night-actions-${foundRoom.id}-${foundRoom.round}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'night_actions',
          filter: `room_id=eq.${foundRoom.id}`
        }, async () => {
          const { data: latestActions } = await supabase
            .from('night_actions')
            .select('*')
            .eq('room_id', foundRoom.id)
            .eq('round', foundRoom.round)

          setNightActions(latestActions || [])
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
    if (!room || !allRequiredActionsComplete || processing) return
    if (!isHost && !canAutoAdvance) return

    const timeout = setTimeout(() => {
      startNextDay()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [room, canAutoAdvance, processing, nightActions])

  const startNextDay = async () => {
    if (!room || !allRequiredActionsComplete || (!isHost && !canAutoAdvance)) return
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

  const submitNightAction = async () => {
    if (!room || !myPlayer || submittingAction || hasSubmittedAction) return
    setSubmittingAction(true)

    const { data, error } = await supabase
      .from('night_actions')
      .insert({
        room_id: room.id,
        round: room.round,
        actor_id: myPlayer.id,
        target_id: null,
        action_type: 'conspirator_ready',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to submit night action:', error)
      setSubmittingAction(false)
      return
    }

    setNightActions(prev => [...prev, data as NightAction])
    setSubmittingAction(false)
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

          <p className="font-body text-alibi-cream/70 text-sm italic leading-relaxed mb-6">
            The room goes quiet. Each team completes its night action before the next day begins.
          </p>

          <div className="border border-alibi-cream/10 bg-black/30 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-alibi-cream/40 text-[9px] uppercase tracking-widest mb-1">
              Night Actions
            </p>
            <p className="font-body text-alibi-cream/70 text-sm">
              {requiredDoneCount} / {requiredActors.length} required actions complete
            </p>
          </div>

          {isConspirator && !hasSubmittedAction && (
            <button
              onClick={submitNightAction}
              disabled={submittingAction}
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
              {submittingAction ? 'SUBMITTING...' : 'COMPLETE NIGHT ACTION'}
            </button>
          )}

          {isConspirator && hasSubmittedAction && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              Your night action is complete. Waiting for the night to end...
            </p>
          )}

          {!isConspirator && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              You have no action tonight. Wait for the night to end...
            </p>
          )}

          {allRequiredActionsComplete && (
            <p className="font-mono text-alibi-gold text-[10px] uppercase tracking-widest mt-6 animate-pulse">
              {processing ? 'Starting next day...' : 'All actions complete. Dawn is coming...'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
