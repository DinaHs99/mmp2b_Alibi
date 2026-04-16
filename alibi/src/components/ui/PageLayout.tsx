import bg from '../../assets/hero-texture.png'
import logo from '../../assets/logo1.png'
import { useNavigate } from 'react-router-dom'

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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Small Logo Top Left (after scenario) */}
      {showSmallLogo && (
        <div className="absolute top-6 left-8 z-20">
          <img src={logo} alt="Alibi" className="w-16" />
        </div>
      )}

      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          className="absolute top-8 left-10 z-20 font-heading text-alibi-cream text-sm uppercase tracking-widest hover:text-alibi-gold transition"
        >
          ← Back
        </button>
      )}

      {/* Username Top Right */}
      <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
        <span className="font-heading text-alibi-gold text-sm">👤 Player</span>
      </div>

      {/* Page Content */}
      <div className="relative z-10">
        {children}
      </div>

    </div>
  )
}