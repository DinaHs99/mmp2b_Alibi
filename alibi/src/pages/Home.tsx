import bg from '../assets/hero-texture.png'
import paper from '../assets/hero-element2.png'
import locationCard from '../assets/hero-element1.png'
import coins from '../assets/hero-element3.png'
import logo from '../assets/logo1.png'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

export default function Home() {

  const navigate = useNavigate();
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden h-[1024px] flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >

      {/* Floating Elements */}
      <img
        src={paper}
        alt=""
        className="absolute top-10 left-8 w-32 opacity-90"
        style={{ 
            left: '926px',
            top: '629px',
            width: '480px' }}   
      />

      <img
        src={locationCard}
        alt=""
        className="absolute bottom-16 left-12 w-28 opacity-90"
        style={{ 
            top: '750px',
            left: '-67px',
            width: '300px',
    }}    
      />

      <img
        src={coins}
        alt=""
        className="absolute top-20 right-10 w-24 opacity-90"
        style={{ 
            top: '100px',
            left: '-18px',
            width: '150px',
         }}    
      />

      {/* Main Card */}
      <div className="relative z-10 flex flex-col gap-6 items-center text-center px-8">

        {/* Title */}
        <img
          src={logo}
          alt=""
          className=""
        />
        <h1 className="font-heading text-alibi-gold text-logo uppercase tracking-wider">
          Alibi
        </h1>

        {/* Subtitle */}
        <p className="font-body text-alibi-cream text-quote font-bold">
          A mysterious incident has occurred. <br />
          The suspects are gathering.
        </p>
        <p className="font-body text-alibi-cream text-subhead mt-4">
          Will you start the investigation <br />or join an existing one?
        </p>

        
      
      {/* Buttons */}
        <div className="flex flex-row items-center gap-6">
        <button
            onClick={() => navigate('/join/name')}
            className="font-heading text-alibi-black font-bold hover:opacity-90 transition"
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
            className="font-heading text-alibi-black font-bold hover:opacity-90 transition"
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
            CREATE NEW ROOM
        </button>
        </div>

        {/* How To Play */}
        <Link 
        to="/how-to-play" 
        className="font-heading text-alibi-cream/60 text-subhead underline hover:text-alibi-cream transition mb-13 mt-8 text-center block w-full"
        >
        How To Play
        </Link>
      </div>
    </div>
  )
}