interface Player {
    id: string;
    role: string;
    status: string;
}

export const checkWinCondition = (players: Player[]): 'citizens' | 'conspirators' | null => {
    const alivePlayers = players.filter(player => player.status === 'alive')
    const aliveconspirators= alivePlayers.filter(player => player.role === 'conspirator')
    const alivecitizens = alivePlayers.filter(player => player.role === 'citizen')
    if (aliveconspirators.length === 0) return 'citizens'
    if (aliveconspirators.length >= alivecitizens.length) return 'conspirators'
    return null

}

export const getEliminatedPlayer = (votes: any[], players: any[]) => {
  if (votes.length === 0) return null

  const voteCounts: Record<string, number> = {}
  votes.forEach(vote => {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
  })

  const maxVotes = Math.max(...Object.values(voteCounts))

  const topPlayerIds = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id]) => id)


  if (topPlayerIds.length > 1) return null

  return players.find(p => p.id === topPlayerIds[0]) || null
}

export const getTiedPlayers = (votes: any[], players: any[]) => {
  if (votes.length === 0) return []

  const voteCounts: Record<string, number> = {}
  votes.forEach(vote => {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
  })

  const maxVotes = Math.max(...Object.values(voteCounts))

  const topPlayerIds = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id]) => id)

  if (topPlayerIds.length <= 1) return []

  return players.filter(p => topPlayerIds.includes(p.id))
}