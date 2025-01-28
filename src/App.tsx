// src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';

// Lazy load our pages for better initial load performance
// We use lazy loading since these components might be large and we don't need them immediately
const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./components/Home/HomePage'));
const Projects = lazy(() => import('./components/Projects/ProjectsPage'));
const About = lazy(() => import('./components/About/AboutPage'));
const Contact = lazy(() => import('./components/Contact/ContactPage'));

// Loading component shown while our lazy-loaded components are being fetched
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-base-100">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
);

function App() {
  return (
    // HashRouter is used instead of BrowserRouter for GitHub Pages compatibility
    <HashRouter>
      {/* Theme switcher is placed outside Routes so it persists across all routes */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      
      {/* Suspense handles the loading state while components are being fetched */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Layout component will contain shared UI elements like navigation */}
          <Route path="/" element={<Layout />}>
            {/* Index route renders the Home component */}
            <Route index element={<Home />} />
            
            {/* Other routes - we'll implement these components later */}
            <Route path="projects" element={<Projects />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />

            {/* 404 page - catches any undefined routes */}
            <Route 
              path="*" 
              element={
                <div className="h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-base-content/60">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                </div>
              } 
            />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;