// src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import TokenCounter from './components/token_counter/TokenCounter';
import FileContextProvider from './contexts/FileContextProvider';

// Loading component shown while our lazy-loaded components are being fetched
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-base-100">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
);

// Layout component to wrap all pages
const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <main>
      {children}
    </main>
  </>
);

function App() {
  return (
    // HashRouter is used instead of BrowserRouter for GitHub Pages compatibility
    <HashRouter>
      {/* Suspense handles the loading state while components are being fetched */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/token-counter" element={
            <Layout>
              <FileContextProvider>
                <TokenCounter />
              </FileContextProvider>
            </Layout>
          } />
          <Route 
            path="*" 
            element={
              <Layout>
                <div className="h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-base-content/60">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                </div>
              </Layout>
            } 
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;