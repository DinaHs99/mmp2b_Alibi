import { useNavigate } from 'react-router-dom'
import bg from '../../assets/hero-texture.png'
import logo from '../../assets/logo1.png'
import PlayerAvatar from './PlayerAvatar'

interface PageLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  backTo?: string
  showSmallLogo?: boolean
}

export default function PageLayout({
  children,
  showBackButton = true,
  backTo,
  showSmallLogo = false
}: PageLayoutProps) {
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0" />

      {showSmallLogo && (
        <div className="absolute top-6 left-8 z-20">
          <img src={logo} alt="Alibi" className="w-16" />
        </div>
      )}

      {showBackButton && (
        <button
          onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          className="absolute top-8 left-10 z-20 font-heading text-alibi-cream text-sm uppercase tracking-widest hover:text-alibi-gold transition"
        >
          Back
        </button>
      )}

      <div className="absolute top-5 right-8 z-20">
        <PlayerAvatar className="h-11 w-11" />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
