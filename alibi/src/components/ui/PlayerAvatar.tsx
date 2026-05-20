import avatar from '../../assets/avatar.png'

interface PlayerAvatarProps {
  className?: string
  muted?: boolean
}

export default function PlayerAvatar({ className = '', muted = false }: PlayerAvatarProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border bg-black/30 ${
        muted ? 'border-alibi-cream/10 opacity-35' : 'border-alibi-gold/30'
      } ${className}`}
    >
      <img
        src={avatar}
        alt=""
        className="h-full w-full object-cover object-top"
        draggable={false}
      />
    </div>
  )
}
