import { useState } from 'react'
import PageLayout from '../../components/ui/PageLayout'
import { useGame } from '../../context/GameContext'
import { userCreateRoom } from '../../hooks/userCreateRoom'

const SCENARIOS = [
  {
    id: '9facef33-21ba-4710-acd1-8674d59da978',  
    title: 'The Mystery Dent',
    description: 'Someone returned the shared car with a dent and said nothing. The evidence is piling up.',
    difficulty: 'Easy',
    icon: '🚗',
  },
  {
    id: '1e6bee59-fbaa-4c77-93b2-2462dee27319',  
    title: 'The Ruined Laundry',
    description: 'A red sock destroyed an entire load of white laundry. Someone knows exactly what happened.',
    difficulty: 'Easy',
    icon: '🧺',
  },
  {
    id: '99df3dd6-a517-4ae5-a28f-233ceb466652',  
    title: 'The WiFi Sabotage',
    description: 'Someone blocked every device on the network. One person still has perfect connection.',
    difficulty: 'Medium',
    icon: '📡',
  },
  {
    id: '73436bb5-6c55-429a-8af3-fe74879438b2',  
    title: 'The Eaten Leftovers',
    description: 'The labeled leftovers are gone. The container was rinsed. Someone thought they were clever.',
    difficulty: 'Easy',
    icon: '🍱',
  },
  {
    id: '14ddb747-a8f7-4f5a-9d68-cbff14242588',  
    title: 'The Broken Controller',
    description: 'The controller is broken and back on the shelf like nothing happened. Someone is lying.',
    difficulty: 'Medium',
    icon: '🎮',
  },
]
export default function CreateScenario() {
 
  const [selected, setSelected] = useState<string | null>(null)
  const { setScenarioId } = useGame()
  const { createRoom, loading, error } = userCreateRoom()

  const handleCreate = async () => {
    if (!selected) return

   
    setScenarioId(selected)
    await createRoom(selected)
  }

  return (
    <PageLayout showBackButton backTo="/create/players">
      <div className="flex flex-col pt-16 items-center text-center">

        {/* Title */}
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Choose Scenario
        </h2>
        <p className="font-body text-alibi-cream text-sm mb-8 opacity-70">
          Step 3 of 3 — Pick your crime
        </p>

        {/* Scenario Cards */}
        <div className="flex flex-col md:flex-row gap-4 p-8 mb-8 w-full md:w-auto overflow-x-auto pb-2">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelected(scenario.id)}
              className={`w-full md:w-52 p-5 rounded-2xl border-2 text-left transition-all flex-shrink-0 ${
                selected === scenario.id
                  ? 'border-alibi-gold bg-alibi-gold/10'
                  : 'border-alibi-cream/20 bg-black/30 hover:border-alibi-gold/50'
              }`}
            >
              <div className="text-4xl mb-3">{scenario.icon}</div>
              <h3 className="font-heading text-alibi-gold text-sm uppercase tracking-wide mb-2">
                {scenario.title}
              </h3>
              <p className="font-body text-alibi-cream/70 text-xs leading-relaxed mb-4">
                {scenario.description}
              </p>
              <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full ${
                scenario.difficulty === 'Easy'   ? 'bg-green-900/50 text-green-400' :
                scenario.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                                                   'bg-red-900/50 text-alibi-red'
              }`}>
                {scenario.difficulty}
              </span>
            </button>
          ))}
        </div>

        {/* Step dots */}
        <div className="flex gap-2 my-4">
          <div className="w-2 h-2 rounded-full bg-alibi-gold/50" />
          <div className="w-2 h-2 rounded-full bg-alibi-gold/50" />
          <div className="w-2 h-2 rounded-full bg-alibi-gold" />
        </div>

        {/* Error */}
        {error && (
          <p className="font-body text-alibi-red text-xs mb-4">{error}</p>
        )}

        {/* Create Room Button */}
        <button
          onClick={handleCreate}
          disabled={!selected || loading}
          className={`font-heading font-bold transition ${
            selected && !loading
              ? 'hover:opacity-90 text-alibi-black'
              : 'opacity-30 cursor-not-allowed text-alibi-black'
          }`}
          style={{
            display: 'inline-flex',
            padding: '19px 47px 18px 49px',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '20px',
            background: '#F9A856',
          }}
        >
          {loading ? 'CREATING...' : 'CREATE ROOM'}
        </button>

      </div>
    </PageLayout>
  )
}