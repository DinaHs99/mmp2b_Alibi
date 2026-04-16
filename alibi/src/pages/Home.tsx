import bg from '../assets/hero-texture.png'
import paper from '../assets/hero-element2.png'
import locationCard from '../assets/hero-element1.png'
import coins from '../assets/hero-element3.png'
import logo from '../assets/logo1.png'
import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
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

      {/* Floating Elements - hidden on mobile shown on desktop */}
      <img
        src={paper}
        alt=""
        className="absolute opacity-90 hidden md:block"
        style={{ right: '-60px', bottom: '0px', width: '380px' }}
      />
      <img
        src={locationCard}
        alt=""
        className="absolute opacity-90 hidden md:block"
        style={{ bottom: '-50px', left: '-40px', width: '240px' }}
      />
      <img
        src={coins}
        alt=""
        className="absolute opacity-90 hidden md:block"
        style={{ top: '80px', left: '-10px', width: '130px' }}
      />

      {/* Main Card */}
      <div className="relative z-10 flex flex-col gap-4 items-center text-center px-6 py-12 w-full mx-auto">

        {/* Logo */}
        <img
          src={logo}
          alt="Alibi"
          className="w-48 md:w-64"
        />
        <h1 className="font-heading text-alibi-gold  text-4xl mt-8 mb-8 md:text-logo uppercase tracking-wider">
          Alibi
        </h1>

        {/* Subtitle */}
        <p className="font-body text-alibi-cream text-base md:text-lg font-bold mt-2">
          A mysterious incident has occurred. <br />
          The suspects are gathering.
        </p>
        <p className="font-body text-alibi-cream text-sm md:text-base opacity-80">
          Will you start the investigation <br />or join an existing one?
        </p>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row items-center  justify-center gap-4 w-full mt-4">
          <button
            onClick={() => navigate('/join/name')}
            className="font-heading text-alibi-black font-bold hover:opacity-90 transition w-full md:w-auto"
            style={{
              display: 'inline-flex',
              padding: '19px 47px 18px 49px',  
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '20px',
              background: '#F9A856',
            }}
          >
            JOIN ROOM
          </button>

          <button
            onClick={() => navigate('/create/name')}
            className="font-heading text-alibi-black font-bold hover:opacity-90 transition w-full md:w-auto"
            style={{
              display: 'inline-flex',
              padding: '19px 47px 18px 49px',  // ← original desktop padding
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '20px',
              background: '#F9A856',
            }}
          >
            CREATE NEW ROOM
          </button>
        </div>

        {/* How To Play */}
        <Link
          to="/how-to-play"
          className="font-heading text-alibi-cream/60 text-sm underline hover:text-alibi-cream transition mt-4"
        >
          How To Play
        </Link>

      </div>
    </div>
  )
}