import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGame } from '../context/GameContext'

export const useJoinRoom = () => {
  const navigate = useNavigate()
  const { playerName, setRoomCode, setIsHost } = useGame()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const joinRoom = async (code: string) => {
    const name = playerName || sessionStorage.getItem('alibi_player_name') || ''

    if (!name) {
      setError('Missing player name')
      return
    }

    setLoading(true)
    setError('')

    try {
      
      const { data: allRooms, error: fetchError } = await supabase
        .from('rooms')
        .select('*')

      if (fetchError) {
        setError('Something went wrong. Try again.')
        setLoading(false)
        return
      }

      const room = allRooms?.find(
        r => r.code.toUpperCase() === code.toUpperCase()
      )

      if (!room) {
        setError('Room not found. Check your code.')
        setLoading(false)
        return
      }

     
      if (room.phase !== 'lobby') {
        setError('Game already started. You cannot join.')
        setLoading(false)
        return
      }

      //  check room is not full
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      if (count !== null && count >= room.player_count) {
        setError('Room is full.')
        setLoading(false)
        return
      }

      
      const sessionId = crypto.randomUUID()
      localStorage.setItem('alibi_session_id', sessionId)

      const { error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          fake_name: name,
          is_host: false,
          status: 'alive',
          session_id: sessionId,
        })

      if (playerError) {
        setError('Failed to join room. Try again.')
        setLoading(false)
        return
      }

    
      setRoomCode(code.toUpperCase())
      setIsHost(false)
      navigate(`/room/${code.toUpperCase()}`)

      sessionStorage.setItem('alibi_session_id', sessionId)
      sessionStorage.setItem('alibi_player_name', name)
      localStorage.setItem('alibi_room_code', code.toUpperCase())
      sessionStorage.setItem('alibi_is_host', 'false')

    } catch (err) {
      setError('Failed to join room. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return { joinRoom, loading, error }
}