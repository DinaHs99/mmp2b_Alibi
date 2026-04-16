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

export const getEliminatedPlayer = (votes: any[], players: Player[]) => {
    const voteCounts: Record<string, number> = {}

    votes.forEach(vote => {
        voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
    })

    let maxVotes = 0
    let eliminatedPlayerId: string | null = null

    for (const playerId in voteCounts) {
        if (voteCounts[playerId] > maxVotes) {
            maxVotes = voteCounts[playerId]
            eliminatedPlayerId = playerId
        }                                           

    }
    return players.find(player => player.id === eliminatedPlayerId)
}