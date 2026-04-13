import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bg from '../assets/bg2.png';
import paper from '../assets/paper1.png';

type TabType = 'Objective' | 'Teams' | 'The Cycle';

const HowToPlay = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Objective');
  const navigate = useNavigate();
  return (
    <div
      className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >

      {/* Dark overlay so paper stands out */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Header Top Left */}
      <div className="absolute top-8 left-10 z-20">
        <h1 className="font-heading text-alibi-gold text-4xl uppercase tracking-widest">
          How To Play
        </h1>
      </div>

      {/* Back Button Top Right */}
      <div className="absolute top-8 right-10 z-20">
        <button 
        onClick={() => navigate('/')}
        className="font-heading text-alibi-cream text-sm uppercase tracking-widest hover:text-alibi-gold transition">
          ← Back
        </button>
      </div>

      {/* Paper Wrapper */}
      <div
        className="relative z-10"
        style={{
          width: '520px',
          height: '680px',
        }}
      >
        {/* Paper Background Image */}
        <img
          src={paper}
          alt=""
          className="absolute inset-0 w-full h-full object-fill"
        />

        {/* Content ON TOP of paper */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            padding: '115px 50px 50px 50px',  
          }}
        >

          {/* Tabs */}
          <div className="flex gap-2 mb-6 justify-center flex-shrink-0">
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
          <div className="flex-1 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'none' }}
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
                <p className="font-body text-sm leading-relaxed italic mb-4 text-center">
                  A mystery has occurred. Players are secretly split into two teams —
                  Conspirators and Citizens. Nobody knows who is on which side.
                  Use your private clue, question everyone, and vote to expose the truth.
                </p>

                <div className="border-t border-stone-400/50 mb-4" />

                <h3 className="font-heading text-xs uppercase tracking-widest text-center mb-3">
                  Win Conditions
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-heading text-[9px] uppercase mb-1 border-b border-stone-400 pb-1">
                      Citizens
                    </h4>
                    <p className="font-body text-[9px] leading-tight italic">
                      Identify and vote out all Conspirators before time runs out.
                    </p>
                  </div>
                  <div className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-heading text-[9px] uppercase mb-1 border-b border-stone-400 pb-1">
                      Conspirators
                    </h4>
                    <p className="font-body text-[9px] leading-tight italic">
                      Eliminate citizens until you outnumber them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'Teams' && (
              <div className="text-stone-800 space-y-3">
                {[
                  { name: 'Detektiv', team: 'Team Gut', desc: 'Stellt Fragen und analysiert. Ziel: alle Verschwörer eliminieren.' },
                  { name: 'Verschwörer', team: 'Team Böse', desc: 'Lügt koordiniert. Ziel: überleben ohne entlarvt zu werden.' },
                  { name: 'Zeuge', team: 'Neutral', desc: 'Weiß wer schuldig ist aber darf es nicht direkt sagen.' },
                  { name: 'Doktor', team: 'Team Gut', desc: 'Hat einen Schutz pro Spiel. Rettet einen Spieler pro Nacht.' },
                  { name: 'Ermittler', team: 'Team Gut', desc: 'Kann einmal die echte Rolle eines Spielers aufdecken.' },
                ].map((role) => (
                  <div key={role.name} className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-heading text-[10px] uppercase">{role.name}</h4>
                      <span className="font-mono text-[8px] opacity-60">{role.team}</span>
                    </div>
                    <p className="font-body text-[9px] leading-tight italic">{role.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* The Cycle Tab */}
            {activeTab === 'The Cycle' && (
              <div className="text-stone-800 space-y-3">
                {[
                  { phase: '01 — Tag', desc: 'Alle diskutieren öffentlich. Verhör, Beweise, Nervositäts-Anzeige.' },
                  { phase: '02 — Voting', desc: 'Alle voten wen sie eliminieren. Mehrheit entscheidet.' },
                  { phase: '03 — Nacht', desc: 'Verschwörer wählen Opfer. Doktor schützt. Zeuge bekommt Hinweis.' },
                  { phase: '04 — Morgen', desc: 'Enthüllung. Wer wurde eliminiert? Echte Rolle wird aufgedeckt.' },
                ].map((item) => (
                  <div key={item.phase} className="border border-stone-800/20 p-3 bg-stone-900/5 rounded">
                    <h4 className="font-heading text-[10px] uppercase mb-1">{item.phase}</h4>
                    <p className="font-body text-[9px] leading-tight italic">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-between items-end border-t border-stone-400/30 flex-shrink-0 ">
            <div>
              <p className="font-mono text-[7px] italic opacity-50 mb-1">
                I have read the briefing.
              </p>
              <p className="font-mono text-sm font-bold border-b border-stone-900 tracking-tighter">
                MAX MUSTERMANN
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="border-4 border-red-700/80 px-2 py-1 text-red-700/80 font-black uppercase text-lg tracking-tighter"
                style={{ transform: 'rotate(-12deg)' }}>
                Confirmed
              </div>
              <p className="font-mono text-[7px] mt-2 opacity-50">tap to proceed</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default HowToPlay;