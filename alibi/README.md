# ALIBI

> Browser-based multiplayer social deduction game. Players join a shared room, receive secret roles and private clues, discuss the case in real time, vote out suspects, and try to identify the conspirators before they take over.

**Live demo:** https://mmp2b-alibi.vercel.app/

---

## Overview

ALIBI is a fully playable web application built for the implementation course. It supports room creation, join-by-code, realtime multiplayer state, automatic role assignment, scenario briefings, discussion, voting, night actions, win-condition handling, audio feedback, a responsive UI, and accessibility improvements.

## Tech Stack

React · TypeScript · Vite · Tailwind CSS · React Router · Supabase · Vercel · Vitest

Supabase powers rooms, players, messages, votes, scenarios, and realtime updates.

---

## Core Features

- Create a room with a chosen player count and scenario
- Join a room via a six-character room code
- Automatic secret role assignment: **Citizen**, **Conspirator**, and **Investigator** (6+ players)
- Private role reveal with occupation and clue
- Shared case briefing before the reveal
- Realtime discussion phase: chat, evidence, private clues, readiness state
- Simultaneous voting with eliminated-player reveal and a tie/revote flow
- Night phase (6+ players): conspirator night kill and Investigator inspection
- Win-condition checks after every elimination and night kill
- Game-over screen with the winning team and revealed roles
- Sound effects with a global mute toggle

## Game Rules

Players are split into two teams:

- **Citizens** try to identify and eliminate all conspirators.
- **Conspirators** try to survive until they equal or outnumber the citizens.

Win conditions, checked after every major elimination:

- Citizens win when all conspirators are eliminated.
- Conspirators win when conspirators ≥ citizens.

For balance, 5-player games are simpler (no Investigator, no night kill). The Investigator and night actions unlock in 6+ player games.

## User Flow

1. Host creates a room and selects player count + scenario
2. Other players join with the room code
3. Host starts the game once enough players have joined
4. Everyone reads the case briefing
5. Each player privately reveals their role, occupation, and clue
6. Players discuss and compare clues
7. Players vote → result is revealed
8. If the game continues, night actions happen
9. Next round begins, or the game ends

Instructions are embedded in the game flow, so players don't need external rules.

## Scenarios

Each scenario provides a public case description, role occupations, private clues, and round evidence. Scenarios are designed to spark discussion rather than point to one fixed culprit — since the conspirator is assigned randomly, clues support social deduction through details about timing, objects, access, contradictions, and suspicious behavior.

---

## Local Setup

```bash
npm install        # install dependencies
npm.cmd run dev    # start dev server
npm.cmd run build  # production build
npm.cmd run lint   # linting
```

> On Windows PowerShell, `npm.cmd` is used because script execution policies can block `npm.ps1`.

### Environment Variables

The app needs Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The deployed Vercel version is already configured with these.

---

## Testing

The project uses **Vitest** + **React Testing Library** for unit and UI tests.

```bash
npm run test           # watch mode
npm run test:run       # run once
npm run test:coverage  # run with coverage report
```

**What's covered (32 tests across 5 files):**

- **Unit tests** for pure logic in `src/lib/` and `src/utils/`:
  - `checkWin.ts` — win conditions, vote evaluation, tie handling
  - `assignRoles.ts` — role/investigator distribution (invariant-based, since shuffling uses `Math.random`)
  - `roomUtils.ts` — room-code length and allowed characters
  - `sound.ts` — mute-state logic (localStorage)
- **UI test** for `JoinCode.tsx` — form validation, auto-uppercase input, and the join action (the Supabase hook is mocked so tests stay deterministic).

Logic files reach ~96–100% coverage. Audio playback, the Supabase client, and pure layout components are intentionally not unit-tested.

See `TESTING-DOKU.md` for the full testing documentation.

---

## Code Structure

```text
src/
  components/ui/   shared UI components
  context/         global game setup state
  hooks/           room creation, joining, game start
  lib/             role assignment, win checks, Supabase client
  pages/           route-level screens
  utils/           sound handling
  test/            test setup
```

Key logic files:

- `src/lib/assignRoles.ts` — assigns roles, teams, occupations, clues
- `src/lib/checkWin.ts` — checks citizen/conspirator win conditions
- `src/hooks/useStartGame.ts` — starts the game and writes assignments
- `src/pages/NightPhase.tsx` — night actions
- `src/pages/VotingReveal.tsx` — vote results and phase changes

---

## Accessibility

Implemented from a dedicated accessibility backlog:

- visible, associated labels for input fields
- keyboard focus states for interactive elements
- live announcements for new chat messages
- improved image and icon semantics
- better contrast for secondary text
- a black base background to support contrast over background images

Interactive elements use semantic buttons and links rather than click-only `div`s.

## Responsiveness

Mobile-first, designed for real phone use during in-person play, and adapted for tablet and desktop. Player cards wrap or scroll by available width, voting/room grids adapt across screens, key controls stay reachable on mobile, and desktop layouts keep readable max widths.

## Security Considerations

- Input is rendered as React text content, never raw HTML (no `dangerouslySetInnerHTML`)
- Supabase client APIs are used instead of hand-built SQL, avoiding SQL-injection patterns
- Room-code length and name input are validated on the client
- Game state changes go through structured Supabase operations

> Final access control also depends on Supabase table policies and permissions. Reviewers who need to inspect backend rules should be given access to the Supabase project.

---

## Deployment

Deployed publicly on Vercel: https://mmp2b-alibi.vercel.app/

Test with multiple browser sessions or devices to verify the multiplayer flow:

- **5-player game** → simple base flow
- **6-player game** → Investigator and night-kill behavior

## Known Limitations

- Requires a live Supabase backend and realtime subscriptions
- Full multiplayer testing needs multiple users
- Large visual assets trigger a Vite chunk-size warning during build (build still succeeds)
- Voice chat is not implemented

## Review Checklist

- [ ] Deployed app is reachable
- [ ] A room can be created
- [ ] Another player can join by code
- [ ] Role reveal works
- [ ] Discussion chat updates in realtime
- [ ] Voting and vote reveal work
- [ ] 5-player game stays simple
- [ ] 6-player game includes Investigator and night actions
- [ ] Win conditions trigger correctly
- [ ] App builds successfully with `npm.cmd run build`
- [ ] Tests pass with `npm run test:run`
