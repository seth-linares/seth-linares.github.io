import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ThemeSwitcher from "./components/ThemeSwitcher.tsx";

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex justify-center space-x-8 mb-8">
            <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="h-24 hover:scale-110 transition-transform" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="h-24 animate-spin-slow hover:animate-spin" alt="React logo" />
            </a>
          </div>
          <h1 className="text-4xl font-bold mb-8">Vite + React</h1>
          <div className="mb-8">
            <button 
              className="btn btn-primary mb-4"
              onClick={() => setCount((count) => count + 1)}
            >
              count is {count}
            </button>
            <p className="text-lg">
              Edit <code className="bg-base-200 p-1 rounded">src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="text-base-content/70 mb-8">
            Click on the Vite and React logos to learn more
          </p>
          <div>
            <h2 className="text-xl font-semibold mb-2">Theme Selection:</h2>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App