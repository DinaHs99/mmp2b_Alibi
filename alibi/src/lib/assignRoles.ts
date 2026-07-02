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
    role: 'citizen' | 'conspirator' | 'investigator'
    team: 'citizen' | 'conspirator'
    occupation: string
    private_clue: string
}

// Fisher-Yates shuffle: returns a new randomly ordered copy of the array
// without mutating the original. Used to randomise both which players get
// which role and which occupation/clue each player receives.
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j]
        shuffled[j] = temp
    }

    return shuffled
}


export const getConspiratorCount = (playerCount: number): number => {
    if (playerCount <= 6) return 1;
    return 2;
}

const hasInvestigator = (playerCount: number) => playerCount >= 6

export const assignRoles = (
    players: Player[],
    scenario: Scenario,
    conspiratorCount: number): PlayerAssignment[] => {
        
        const shuffledPlayers = shuffleArray(players)
        const shuffledScenario = shuffleArray(scenario.occupations).slice(0, players.length)
        const shuffledClues = shuffleArray(scenario.clues).slice(0, players.length)
        const shouldAssignInvestigator = hasInvestigator(players.length)

        return shuffledPlayers.map((player, index) => {
            const isConspirator = index < conspiratorCount
            const isInvestigator = shouldAssignInvestigator && index === conspiratorCount

            return {
                id: player.id,
                role: isConspirator ? 'conspirator' : isInvestigator ? 'investigator' : 'citizen',
                team: isConspirator ? 'conspirator' : 'citizen',
                occupation: shuffledScenario[index],
                private_clue: shuffledClues[index]
            }
        })
    
    }
