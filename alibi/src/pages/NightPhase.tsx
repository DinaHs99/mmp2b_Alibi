import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkWinCondition } from '../lib/checkWin'
import bg from '../assets/hero-texture.png'
import logo from '../assets/logo1.png'
import PlayerAvatar from '../components/ui/PlayerAvatar'

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
  const [investigationResult, setInvestigationResult] = useState<string | null>(null)

  const isHost = sessionStorage.getItem('alibi_is_host') === 'true'
  const sessionId = sessionStorage.getItem('alibi_session_id')
  const alivePlayers = players.filter(player => player.status === 'alive')
  const aliveConspirators = alivePlayers.filter(player => player.role === 'conspirator')
  const aliveInvestigator = alivePlayers.find(player => player.role === 'investigator')
  const completedActorIds = new Set(nightActions.map(action => action.actor_id))
  const hasSubmittedAction = myPlayer ? completedActorIds.has(myPlayer.id) : false
  const killAction = nightActions.find(action => action.action_type === 'kill')
  const hasConspiratorAction = aliveConspirators.length > 0
  const hasInvestigatorAction = Boolean(aliveInvestigator)
  const conspiratorActionComplete =
    Boolean(killAction) ||
    !hasConspiratorAction ||
    aliveConspirators.every(player => completedActorIds.has(player.id))
  const investigatorActionComplete =
    !hasInvestigatorAction || completedActorIds.has(aliveInvestigator!.id)
  const allRequiredActionsComplete = conspiratorActionComplete && investigatorActionComplete
  const requiredActionCount = Number(hasConspiratorAction) + Number(hasInvestigatorAction)
  const requiredDoneCount =
    Number(hasConspiratorAction && conspiratorActionComplete) +
    Number(hasInvestigatorAction && investigatorActionComplete)
  const isConspirator = myPlayer?.role === 'conspirator'
  const isInvestigator = myPlayer?.role === 'investigator'
  const aliveCitizens = alivePlayers.filter(player => player.role !== 'conspirator')
  const inspectTargets = myPlayer
    ? alivePlayers.filter(player => player.id !== myPlayer.id)
    : []
  const nightKillTarget = killAction?.target_id

  const canUseKill =
    isConspirator &&
    !room?.night_kill_used &&
    room?.player_count >= 6 &&
    aliveCitizens.length > 0

  const getRoleLabel = (role: string) => {
    if (role === 'conspirator') return 'Conspirator'
    if (role === 'investigator') return 'Investigator'
    return 'Citizen'
  }

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
    if (!nightKillTarget) {
      setKilledPlayer(null)
      return
    }

    const target = players.find(player => player.id === nightKillTarget)
    if (target) setKilledPlayer(target)
  }, [nightKillTarget, players])

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

    const { data: latestPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)

    if (playersError || !latestPlayers) {
      console.error('Failed to check win condition:', playersError)
      setProcessing(false)
      return
    }

    const winner = checkWinCondition(latestPlayers)
    const nextPhase = winner ? 'gameover' : 'discussion'

    const { error } = await supabase
      .from('rooms')
      .update({ phase: nextPhase })
      .eq('id', room.id)

    if (error) {
      console.error('Failed to start next day:', error)
      setProcessing(false)
      return
    }

    navigate(`/room/${code}/${nextPhase === 'gameover' ? 'gameover' : 'discussion'}`)
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
    if (!room || !myPlayer || !selectedTargetId || submittingAction || hasSubmittedAction || !canUseKill) return

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

      const { error: playerError } = await supabase
        .from('players')
        .update({ status: 'eliminated' })
        .eq('id', selectedTargetId)

      if (playerError) {
        console.error('Failed to eliminate target:', playerError)
        setSubmittingAction(false)
        return
      }

      setKilledPlayer(players.find(player => player.id === selectedTargetId) || null)
      setPlayers(prev =>
        prev.map(player =>
          player.id === selectedTargetId
            ? { ...player, status: 'eliminated' }
            : player
        )
      )

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

      setNightActions(prev => [...prev, data])
      setSubmittingAction(false)
  }

  const submitInvestigate = async () => {
    if (!room || !myPlayer || !selectedTargetId || submittingAction || hasSubmittedAction) return
    setSubmittingAction(true)

    const { data, error } = await supabase
      .from('night_actions')
      .insert({
        room_id: room.id,
        round: room.round,
        actor_id: myPlayer.id,
        target_id: selectedTargetId,
        action_type: 'inspect',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to submit night action:', error)
      setSubmittingAction(false)
      return
    }

    const target = players.find(p => p.id === selectedTargetId)

    if (target) {
      const result =
        target.role === 'conspirator'
          ? `${target.fake_name} looks Suspicious`
          : `${target.fake_name} does not look suspicious`

      setInvestigationResult(result)
    }

    setNightActions(prev => [...prev, data as NightAction])
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
            Morning Report
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 pb-8 text-center">
          <div className="w-full max-w-md rounded-2xl border-2 border-alibi-red bg-black/50 p-8 shadow-2xl">
            <p className="font-mono text-alibi-red text-[9px] uppercase tracking-widest mb-4">
              The Night Is Over
            </p>

            <h1 className="font-heading text-alibi-cream text-4xl uppercase tracking-widest mb-3">
              {killedPlayer.fake_name}
            </h1>

            <p className="font-mono text-alibi-cream/50 text-xs uppercase tracking-widest mb-6">
              {getRoleLabel(killedPlayer.role)}
            </p>

            <div className="border-t border-alibi-red/30 my-6" />

            <p className="font-body text-alibi-cream/80 text-base leading-relaxed mb-3">
              When morning came, one seat was empty.
            </p>

            <p className="font-body text-alibi-cream/60 text-sm italic leading-relaxed mb-5">
              {killedPlayer.fake_name} was killed during the night. Everyone has a moment to take that in before the game moves on.
            </p>

            <p className="font-mono text-alibi-gold text-[10px] uppercase tracking-widest animate-pulse">
              {processing ? 'Checking what this means...' : 'Waiting for everyone...'}
            </p>
          </div>
        </div>
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
        <div className="relative z-10 max-w-sm rounded-2xl border border-alibi-red/40 bg-black/50 p-8 shadow-2xl">
          <p className="font-mono text-alibi-red text-[9px] uppercase tracking-widest mb-3">
            You Are Out
          </p>
          <h2 className="font-heading text-alibi-cream text-3xl uppercase tracking-widest mb-4">
            The Case Continues
          </h2>
          <p className="font-body text-alibi-cream/60 text-sm italic leading-relaxed">
            Your part in the investigation is over, but the others are still playing. Stay close and watch how the truth comes out.
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

          {/* Night Action Status */}
          <div className="border border-alibi-cream/10 bg-black/30 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-alibi-cream/40 text-[9px] uppercase tracking-widest mb-1">
              Night Actions
            </p>
            <p className="font-body text-alibi-cream/70 text-sm">
              {requiredDoneCount} / {requiredActionCount} required actions complete
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {aliveCitizens.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTargetId(player.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition text-left ${
                      selectedTargetId === player.id
                        ? 'border-alibi-red bg-alibi-red/20'
                        : 'border-alibi-cream/20 bg-black/30 hover:border-alibi-red/50'
                    }`}
                  >
                    <PlayerAvatar className="h-16 w-16" />
                    <div className="min-w-0">
                      <p className="font-heading text-alibi-cream text-xs uppercase tracking-wide leading-tight break-words">
                        {player.fake_name}
                      </p>
                      <p className="font-mono text-alibi-cream/40 text-[9px] mt-1 uppercase tracking-widest">
                        {getRoleLabel(player.role)}
                      </p>
                    </div>
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

          {isInvestigator && !hasSubmittedAction && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="font-heading text-alibi-gold text-xl uppercase tracking-widest">
                  Investigation
                </p>

                <p className="font-body text-alibi-cream/60 mt-2">
                  Select one player to inspect.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {inspectTargets.map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTargetId(player.id)}
                    className={`p-4 rounded-2xl border transition ${
                      selectedTargetId === player.id
                        ? 'border-alibi-gold bg-alibi-gold/10'
                        : 'border-alibi-cream/20 bg-black/20'
                      }`}
                  >
                    <PlayerAvatar className="mx-auto h-14 w-14" />
                    <p className="mt-2 font-heading text-alibi-cream">
                      {player.fake_name}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={submitInvestigate}
                disabled={!selectedTargetId || submittingAction}
                className="bg-alibi-gold text-black px-6 py-3 rounded-2xl font-heading disabled:opacity-30"
              >
                {submittingAction ? 'INSPECTING...' : 'INSPECT PLAYER'}
              </button>
            </div>
          )}
          {isInvestigator && hasSubmittedAction && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              Your investigation is complete. Waiting for the night to end...
            </p>
          )}

          {/* Citizen view */}
          {!isConspirator && !isInvestigator && (
            <p className="font-body text-alibi-cream/40 text-sm italic">
              You have no action tonight. Wait for the night to end...
            </p>
          )}

          {investigationResult && (
            <div className="mt-6 border border-alibi-gold/30 bg-black/40 rounded-2xl p-4 text-center">
              <p className="font-heading text-alibi-gold uppercase tracking-widest text-sm">
                Investigation Result
              </p>

              <p className="mt-2 text-alibi-cream">
                {investigationResult}
              </p>
            </div>
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
