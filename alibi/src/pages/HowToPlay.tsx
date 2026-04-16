import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bg from '../assets/bg2.png'
import paper from '../assets/paper1.png'
import ConspiratorsImage from '../assets/conspirator.png'
import CitizenImage from '../assets/citizen.png'

type TabType = 'Objective' | 'Teams' | 'The Cycle'

const HowToPlay = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Objective')
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-8 px-4"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <h1 className="font-heading text-alibi-gold text-2xl md:text-4xl uppercase tracking-widest">
          How To Play
        </h1>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="font-heading text-alibi-cream text-sm uppercase tracking-widest hover:text-alibi-gold transition"
        >
          ← Back
        </button>
      </div>

      {/* Paper Wrapper */}
      <div
        className="relative z-10 w-full"
        style={{ maxWidth: '520px' }}
      >
        {/* Paper Background */}
        <img
          src={paper}
          alt=""
          className="absolute inset-0 w-full h-full object-fill"
        />

        {/* Content */}
        <div
          className="relative flex flex-col"
          style={{
            padding: '100px 36px 40px 36px',
            minHeight: '600px',
          }}
        >

          {/* Tabs */}
          <div className="flex gap-2 mb-4 justify-center flex-shrink-0 flex-wrap">
            {(['Objective', 'Teams', 'The Cycle'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold transition-all border border-stone-700 ${
                  activeTab === tab
                    ? 'bg-stone-900 text-white'
                    : 'bg-transparent text-stone-700 hover:bg-stone-800/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'none', maxHeight: '420px' }}
          >
            {/* Title */}
            <h2 className="font-heading text-center text-xl uppercase tracking-widest text-stone-900 mb-1">
              {activeTab === 'Objective' ? 'The Objective' : activeTab}
            </h2>

            <p className="text-center text-red-700 font-mono text-[9px] font-black mb-4 tracking-widest">
              TWO TEAMS. ONE TRUTH. NO ONE IS WHO THEY SEEM.
            </p>

            <div className="border-t border-stone-400/50 mb-4" />

            {/* Objective Tab */}
            {activeTab === 'Objective' && (
              <div className="text-stone-800">
                <p className="font-body text-sm leading-relaxed w-[400px]  text-center">
                  A mystery has occurred. Players are secretly split into two teams —
                  Conspirators and Citizens. Nobody knows who is on which side.
                  Use your private clue, question everyone, and vote to expose the truth.
                </p>

                <div className="border-t border-stone-400/50 mb-4" />

                <h3 className="font-heading text-sm uppercase tracking-widest text-center mb-3">
                  Win Conditions
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-body text-xs uppercase mb-1 border-b border-stone-400 pb-1">
                      Citizens
                    </h4>
                    <p className="font-body text-[9px] leading-tight italic">
                      Identify and vote out all Conspirators before they take control.
                    </p>
                  </div>
                  <div className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-body text-xs uppercase mb-1 border-b border-stone-400 pb-1">
                      Conspirators
                    </h4>
                    <p className="font-body text-[9px] leading-tight italic">
                      Eliminate citizens until your team equals or outnumbers them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'Teams' && (
              <div className="text-stone-800 space-y-4">
                <div className="border border-stone-800/20 p-4 bg-stone-900/5 rounded">
                  <img
                    src={ConspiratorsImage}
                    alt="Conspirators"
                    className="w-full h-24 object-cover rounded mb-3"
                  />
                  <h4 className="font-heading text-[11px] font-bold uppercase mb-2 tracking-widest">
                    Conspirators
                  </h4>
                  <p className="font-body text-[9px] leading-relaxed italic">
                    Blend in — deny, deflect, and cast doubt on innocent players.
                  </p>
                </div>

                <div className="border border-stone-800/20 p-4 bg-stone-900/5 rounded">
                  <img
                    src={CitizenImage}
                    alt="Citizens"
                    className="w-full h-24 object-cover rounded mb-3"
                  />
                  <h4 className="font-heading text-[11px] font-bold uppercase mb-2 tracking-widest">
                    Citizens
                  </h4>
                  <p className="font-body text-[9px] leading-relaxed italic">
                    Use your private clue to find contradictions and expose the truth.
                  </p>
                </div>
              </div>
            )}

            {/* The Cycle Tab */}
            {activeTab === 'The Cycle' && (
              <div className="text-stone-800 space-y-2">
                {[
                  {
                    phase: '1 — Preparation',
                    desc: 'Teams assigned secretly. Each player receives a unique private clue. Read it alone.'
                  },
                  {
                    phase: '2 — Evidence',
                    desc: 'A new piece of evidence is revealed each round. Use it to narrow down the suspects.'
                  },
                  {
                    phase: '3 — Discussion',
                    desc: 'Everyone debates. Use your clue to find contradictions. Nobody has the full picture.'
                  },
                  {
                    phase: '4 — The Vote',
                    desc: 'Vote simultaneously. Most votes gets eliminated and their role revealed.'
                  },
                  {
                    phase: '5 — The Verdict',
                    desc: 'All Conspirators gone? Citizens win. Outnumbered? The conspiracy succeeds.'
                  },
                ].map((item) => (
                  <div key={item.phase} className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-heading text-[10px] font-bold uppercase mb-1 tracking-widest">
                      {item.phase}
                    </h4>
                    <p className="font-body text-[9px] leading-relaxed italic">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end border-t border-stone-400/30 pt-4 mt-4 flex-shrink-0">
            <div>
              <p className="font-mono text-[7px] italic opacity-50 mb-1">
                I have read the briefing.
              </p>
              <p className="font-mono text-sm font-bold border-b border-stone-900 tracking-tighter">
                MAX MUSTERMANN
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="border-4 border-red-700/80 px-2 py-1 text-red-700/80 font-black uppercase text-lg tracking-tighter"
                style={{ transform: 'rotate(-12deg)' }}
              >
                Confirmed
              </div>
              <p className="font-mono text-[7px] mt-2 opacity-50">tap to proceed</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default HowToPlay