import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ThemeSwitcher from './components/ThemeSwitcher'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-3xl mx-auto min-h-screen p-8 text-center">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="flex justify-center gap-8 mb-8">
            <a href="https://vite.dev" target="_blank">
              <img 
                src={viteLogo} 
                className="h-24 p-6 transition-all hover:drop-shadow-[0_0_2em_rgba(100,108,255,0.667)]"
                alt="Vite logo" 
              />
            </a>
            <a href="https://react.dev" target="_blank">
              <img 
                src={reactLogo} 
                className="h-24 p-6 animate-[spin_20s_linear_infinite] hover:drop-shadow-[0_0_2em_rgba(97,218,251,0.667)]"
                alt="React logo" 
              />
            </a>
          </div>
          
          <div className="w-full space-y-8 flex flex-col items-center">
            <h1 className="text-5xl font-bold">Vite + React</h1>
            
            <div className="space-y-4">
              <button 
                onClick={() => setCount((count) => count + 1)}
                className="btn btn-primary"
              >
                count is {count}
              </button>
              <p>
                Edit <code className="badge badge-neutral">src/App.tsx</code> and save to test HMR
              </p>
            </div>
            
            <p className="text-base-content/60">
              Click on the Vite and React logos to learn more
            </p>

            <div>
              <h2 className="text-xl font-semibold mb-2">Theme Selection:</h2>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
