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
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [killedPlayer, setKilledPlayer] = useState<Player | null>(null)

  const isHost = sessionStorage.getItem('alibi_is_host') === 'true'
  const sessionId = sessionStorage.getItem('alibi_session_id')
  const alivePlayers = players.filter(player => player.status === 'alive')
  const requiredActors = alivePlayers.filter(player => player.role === 'conspirator')
  const completedActorIds = new Set(nightActions.map(action => action.actor_id))
  const hasSubmittedAction = myPlayer ? completedActorIds.has(myPlayer.id) : false
  const killAction = nightActions.find(action => action.action_type === 'kill')
  const allRequiredActionsComplete =
    Boolean(killAction) ||
    requiredActors.length === 0 || requiredActors.every(player => completedActorIds.has(player.id))
  const requiredDoneCount = requiredActors.filter(player => completedActorIds.has(player.id)).length
  const isConspirator = myPlayer?.role === 'conspirator'
  const aliveCitizens = alivePlayers.filter(player => player.role === 'citizen')
  

  const canUseKill =
    isConspirator &&
    !room?.night_kill_used &&
    alivePlayers.length > 3 &&
    aliveCitizens.length > 0

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
    }, killedPlayer ? 6000 : 3000)

    return () => clearTimeout(timeout)
  }, [room, canAutoAdvance, processing, nightActions, killedPlayer])

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

  const submitKill = async () => {
    console.log('submitKill clicked', {
      roomId: room?.id,
      round: room?.round,
      myPlayerId: myPlayer?.id,
      selectedTargetId,
      submittingAction,
      canUseKill,
      hasSubmittedAction,
    })

    if (!room || !myPlayer || !selectedTargetId || submittingAction) {
      console.log('submitKill blocked', {
        hasRoom: Boolean(room),
        hasMyPlayer: Boolean(myPlayer),
        selectedTargetId,
        submittingAction,
      })
      return
    }

    setSubmittingAction(true)

    const { data, error } = await supabase
      .from('night_actions')
      .insert({
        room_id: room.id,
        round: room.round,
        actor_id: myPlayer.id,
        target_id: selectedTargetId,
        action_type: 'kill',
      })
      .select()
      .single()

      if (error) {
        console.error('Failed to insert kill action:', error)
        setSubmittingAction(false)
        return
      }

      console.log('Kill action inserted', data)

      const { error: playerError } = await supabase
        .from('players')
        .update({ status: 'eliminated' })
        .eq('id', selectedTargetId)

      if (playerError) {
        console.error('Failed to eliminate target:', playerError)
        setSubmittingAction(false)
        return
      }

      console.log('Target eliminated', selectedTargetId)
      setKilledPlayer(players.find(player => player.id === selectedTargetId) || null)

      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          night_kill_used: true,
          night_kill_target_id: selectedTargetId,
        })
        .eq('id', room.id)

      if (roomError) {
        console.error('Failed to update room kill state:', roomError)
        setSubmittingAction(false)
        return
      }

      console.log('Room night kill state updated')

      setNightActions(prev => [...prev, data])
      setSubmittingAction(false)
  }

  const submitSkip = async () => {
  if (!room || !myPlayer || submittingAction || hasSubmittedAction) return

  setSubmittingAction(true)

  const { data, error } = await supabase
    .from('night_actions')
    .insert({
      room_id: room.id,
      round: room.round,
      actor_id: myPlayer.id,
      target_id: null,
      action_type: 'skip',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to skip night action:', error)
    setSubmittingAction(false)
    return
  }

  setNightActions(prev => [...prev, data])
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

  if (killedPlayer) {
    return (
      <div
        className="relative min-h-screen w-full overflow-hidden flex flex-col"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/80 z-0" />

        <div className="relative z-10 flex justify-between items-center px-8 py-6">
          <img src={logo} alt="Alibi" className="w-16" />
          <span className="font-heading text-alibi-red text-sm uppercase tracking-widest">
            Morning Reveal
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 pb-8 text-center">
          <div className="w-full max-w-md rounded-2xl border-2 border-alibi-red bg-alibi-red/10 p-8">
            <p className="font-mono text-alibi-red text-[9px] uppercase tracking-widest mb-4">
              During The Night
            </p>

            <h1 className="font-heading text-alibi-cream text-4xl uppercase tracking-widest mb-4">
              {killedPlayer.fake_name}
            </h1>

            <p className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest mb-6">
              {killedPlayer.role === 'citizen' ? 'Citizen' : 'Conspirator'}
            </p>

            <div className="border-t border-alibi-red/30 my-6" />

            <p className="font-body text-alibi-cream/70 text-sm italic leading-relaxed mb-6">
              The night was not quiet. One player did not make it to the next day.
            </p>

            <p className="font-mono text-alibi-gold text-[10px] uppercase tracking-widest animate-pulse">
              Dawn is coming...
            </p>
          </div>
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

          {/* Night Action Status */}
          <div className="border border-alibi-cream/10 bg-black/30 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-alibi-cream/40 text-[9px] uppercase tracking-widest mb-1">
              Night Actions
            </p>
            <p className="font-body text-alibi-cream/70 text-sm">
              {requiredDoneCount} / {requiredActors.length} required actions complete
            </p>
          </div>

          {/* Conspirator Kill Action */}
          {isConspirator && !hasSubmittedAction && canUseKill && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-mono text-alibi-red text-[9px] uppercase tracking-widest mb-2">
                  Conspirator Action
                </p>
                <p className="font-body text-alibi-cream/70 text-sm italic leading-relaxed">
                  Choose one citizen to eliminate tonight, or skip to save your one kill for later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {aliveCitizens.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      console.log('Night kill target selected', player)
                      setSelectedTargetId(player.id)
                    }}
                    className={`rounded-xl border px-4 py-3 transition text-left ${
                      selectedTargetId === player.id
                        ? 'border-alibi-red bg-alibi-red/20'
                        : 'border-alibi-cream/20 bg-black/30 hover:border-alibi-red/50'
                    }`}
                  >
                    <p className="font-heading text-alibi-cream text-xs uppercase tracking-wide">
                      {player.fake_name}
                    </p>
                    <p className="font-mono text-alibi-cream/40 text-[9px] mt-1">
                      Citizen
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={submitKill}
                disabled={!selectedTargetId || submittingAction}
                className="font-heading text-alibi-black font-bold transition disabled:opacity-30"
                style={{
                  display: 'inline-flex',
                  padding: '16px 32px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '20px',
                  background: '#F9A856',
                }}
              >
                {submittingAction ? 'SUBMITTING...' : 'CONFIRM KILL'}
              </button>

              <button
                onClick={submitSkip}
                disabled={submittingAction}
                className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest underline hover:text-alibi-cream transition disabled:opacity-30"
              >
                Skip and save kill
              </button>
            </div>
          )}

          {/* Conspirator fallback when kill is not available */}
          {isConspirator && !hasSubmittedAction && !canUseKill && (
            <div className="flex flex-col gap-5">
              <p className="font-body text-alibi-cream/60 text-sm italic leading-relaxed">
                Your team has no kill available tonight. Complete your night action to continue.
              </p>

              <button
                onClick={submitNightAction}
                disabled={submittingAction}
                className="font-heading text-alibi-black font-bold transition disabled:opacity-30"
                style={{
                  display: 'inline-flex',
                  padding: '16px 32px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '20px',
                  background: '#F9A856',
                }}
              >
                {submittingAction ? 'SUBMITTING...' : 'COMPLETE NIGHT ACTION'}
              </button>
            </div>
          )}

          {/* Conspirator after submitting */}
          {isConspirator && hasSubmittedAction && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              Your night action is complete. Waiting for the night to end...
            </p>
          )}

          {/* Citizen view */}
          {!isConspirator && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              You have no action tonight. Wait for the night to end...
            </p>
          )}

          {/* Completion message */}
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
