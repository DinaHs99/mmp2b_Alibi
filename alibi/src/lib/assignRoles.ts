interface Player {
    id: string;
    fake_name: string;
    
}

interface Scenario {
    occupations: string[];
    clues: string[];
}

interface PlayerAssignment {
    
    id: string
    role: 'citizen' | 'conspirator'
    team: 'citizen' | 'conspirator'
    occupation: string
    private_clue: string
}


const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);


export const getConspiratorCount = (playerCount: number): number => {
    if (playerCount <= 5) return 1;
    if (playerCount  <= 7) return 2;
    return 3;
}

export const assignRoles = (
    players: Player[],
    scenario: Scenario,
    conspiratorCount: number): PlayerAssignment[] => {
        
        const shuffledPlayers = shuffleArray(players)
        const shuffledScenario = shuffleArray(scenario.occupations).slice(0, players.length)
        const shuffledClues = shuffleArray(scenario.clues).slice(0, players.length)

        return shuffledPlayers.map((player, index) => ({
            id: player.id,
            role: index < conspiratorCount ? 'conspirator' : 'citizen',
            team: index < conspiratorCount ? 'conspirator' : 'citizen',
            occupation: shuffledScenario[index],
            private_clue: shuffledClues[index]
        }))
    
    }
