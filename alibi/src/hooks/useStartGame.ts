import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { assignRoles, getConspiratorCount } from '../lib/assignRoles'

export const useStartGame = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const startGame = async (roomId: string, scenarioId: string) => {
    setLoading(true)
    setError('')

    try {
      
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)

      if (playersError || !players) throw playersError
      console.log('Players:', players.length)

      
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single()

      if (scenarioError || !scenario) throw scenarioError
      console.log('Scenario:', scenario.title)

      
      const conspiratorCount = getConspiratorCount(players.length)
      const assignments      = assignRoles(players, scenario, conspiratorCount)
      console.log('Assignments:', assignments)

      
      for (const assignment of assignments) {
        const { error: updateError } = await supabase
          .from('players')
          .update({
            role:         assignment.role,
            team:         assignment.team,
            occupation:   assignment.occupation,
            private_clue: assignment.private_clue,
          })
          .eq('id', assignment.id)

        if (updateError) throw updateError
      }

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ phase: 'role_reveal' })
        .eq('id', roomId)

      if (roomError) throw roomError

      console.log('Game started!')

    } catch (err) {
      console.error('Start game failed:', err)
      setError('Failed to start game. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return { startGame, loading, error }
}