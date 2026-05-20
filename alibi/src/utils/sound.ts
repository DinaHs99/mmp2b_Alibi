export type SoundKey =
  | 'caseBriefing'
  | 'citizensWin'
  | 'conspiratorsWin'
  | 'eliminated'
  | 'gameOver'
  | 'openRole'
  | 'timer'
  | 'ui'

const SOUND_MUTED_KEY = 'alibi_sound_muted'

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const SOUND_PATHS: Record<SoundKey, string> = {
  caseBriefing: publicAsset('audio/case-briefing.mp3'),
  citizensWin: publicAsset('audio/citizens-win.mp3'),
  conspiratorsWin: publicAsset('audio/conspi-win.mp3'),
  eliminated: publicAsset('audio/eliminated.mp3'),
  gameOver: publicAsset('audio/game-over.mp3'),
  openRole: publicAsset('audio/open-role.mp3'),
  timer: publicAsset('audio/timer.mp3'),
  ui: publicAsset('audio/ui.mp3'),
}

const DEFAULT_VOLUME: Record<SoundKey, number> = {
  caseBriefing: 0.45,
  citizensWin: 0.55,
  conspiratorsWin: 0.55,
  eliminated: 0.6,
  gameOver: 0.55,
  openRole: 0.55,
  timer: 0.35,
  ui: 0.3,
}

const audioCache = new Map<SoundKey, HTMLAudioElement>()

const getAudio = (key: SoundKey) => {
  const audio = audioCache.get(key) || new Audio(SOUND_PATHS[key])
  audioCache.set(key, audio)
  return audio
}

export const isSoundMuted = () => {
  return localStorage.getItem(SOUND_MUTED_KEY) === 'true'
}

export const setSoundMuted = (muted: boolean) => {
  localStorage.setItem(SOUND_MUTED_KEY, String(muted))

  if (muted) {
    audioCache.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }
}

export const toggleSoundMuted = () => {
  const nextMuted = !isSoundMuted()
  setSoundMuted(nextMuted)
  return nextMuted
}

export const playSound = async (key: SoundKey, volume = DEFAULT_VOLUME[key]) => {
  if (isSoundMuted()) return

  const audio = getAudio(key)

  audio.pause()
  audio.currentTime = 0
  audio.loop = false
  audio.volume = volume

  try {
    await audio.play()
  } catch (error) {
    console.warn(`Sound "${key}" could not play.`, error)
  }
}

export const playLoopingSound = async (key: SoundKey, volume = DEFAULT_VOLUME[key]) => {
  if (isSoundMuted()) return

  const audio = getAudio(key)
  audio.loop = true
  audio.volume = volume

  if (!audio.paused) return

  audio.currentTime = 0

  try {
    await audio.play()
  } catch (error) {
    console.warn(`Sound "${key}" could not play.`, error)
  }
}

export const stopSound = (key: SoundKey) => {
  const audio = audioCache.get(key)
  if (!audio) return

  audio.pause()
  audio.currentTime = 0
  audio.loop = false
}
