import { supabase } from './lib/supabase.ts'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    console.log('Supabase client:', supabase)
  }, [])

  return (
    <div>
      <h1 className="text-4xl text-red-500">Alibi</h1>
    </div>
  )
}

export default App