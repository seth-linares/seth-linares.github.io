// src/App.tsx

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import PromptGenerator from './components/prompt_generator/PromptGenerator';
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

// AnimatedRoutes component to handle route animations
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/prompt-generator" element={
          <Layout>
            <FileContextProvider>
              <PromptGenerator />
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
    </AnimatePresence>
  );
};

function App() {
  return (
    // HashRouter is used instead of BrowserRouter for GitHub Pages compatibility
    <HashRouter>
      {/* Suspense handles the loading state while components are being fetched */}
      <Suspense fallback={<LoadingScreen />}>
        <AnimatedRoutes />
      </Suspense>
    </HashRouter>
  );
}

export default App;