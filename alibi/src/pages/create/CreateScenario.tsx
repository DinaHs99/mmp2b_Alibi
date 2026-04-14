import { useState } from 'react'
import PageLayout from '../../components/ui/PageLayout'
import { useGame } from '../../context/GameContext'
import { userCreateRoom } from '../../hooks/userCreateRoom'

const SCENARIOS = [
  {
    id: 'ddcfd532-62c2-4d61-a07b-4ffbb36d8855',
    title: 'The Museum Heist',
    description: 'A priceless artifact has vanished from the city museum overnight.',
    difficulty: 'Easy',
    icon: '🏛️'
  },
  {
    id: '39d3fd85-306c-480b-b126-da53f8ac3630',
    title: 'The Poisoned Gala',
    description: 'A guest was found dead at the mayors annual dinner party.',
    difficulty: 'Medium',
    icon: '🍷'
  },
  {
    id: 'e657cb00-95bc-4a8d-8213-a7cb546ade2a',
    title: 'The Vanishing Witness',
    description: 'The only witness to a crime has disappeared without a trace.',
    difficulty: 'Hard',
    icon: '🔍'
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
      <div className="flex flex-col items-center text-center">

        {/* Title */}
        <h2 className="font-heading text-alibi-gold text-2xl uppercase tracking-widest mb-2">
          Choose Scenario
        </h2>
        <p className="font-body text-alibi-cream text-sm mb-8 opacity-70">
          Step 3 of 3 — Pick your crime
        </p>

        {/* Scenario Cards */}
        <div className="flex gap-6 mb-8">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelected(scenario.id)}
              className={`w-52 p-6 rounded-2xl border-2 text-left transition-all ${
                selected === scenario.id
                  ? 'border-alibi-gold bg-alibi-gold/10'
                  : 'border-alibi-cream/20 bg-black/30 hover:border-alibi-gold/50'
              }`}
            >
              <div className="text-4xl mb-4">{scenario.icon}</div>
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
        <div className="flex gap-2 my-6">
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