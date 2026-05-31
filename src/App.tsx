// src/App.tsx

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LazyMotion, domAnimation, MotionConfig, m } from 'motion/react';
import Navbar from './components/Navbar';
import HomePageResume from './components/HomePageResume';
import HomePageTools from './components/HomePageTools';
import CryptoPlayground from './components/crypto_playground/CryptoPlayground';
import RegexPlayground from './components/regex_playground/RegexPlayground';

const SpriteDemo = lazy(() => import('./components/SpriteDemo'));

const LoadingScreen = () => (
    <div className="h-screen w-full flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
);

// Per-page enter transition. Opacity-only on purpose: a `transform` here would create a
// containing block and break the cats' `position: fixed` tray/ghost (reducedMotion strips
// transforms anyway). Enter-only — no exit, no AnimatePresence — so navigation is instant:
// the new page mounts and is interactive immediately and just eases its opacity in. The keyed
// <Routes> remounts it per navigation so the fade replays; Suspense sits inside so a lazy
// chunk's fallback never blocks the mount.
const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
    >
        <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </m.div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <Routes location={location} key={location.pathname}>
            <Route
                path="/"
                element={
                    <PageTransition>
                        <HomePageTools />
                    </PageTransition>
                }
            />
            <Route
                path="/resume"
                element={
                    <PageTransition>
                        <HomePageResume />
                    </PageTransition>
                }
            />
            <Route
                path="/crypto-playground"
                element={
                    <PageTransition>
                        <CryptoPlayground />
                    </PageTransition>
                }
            />
            <Route
                path="/regex-playground"
                element={
                    <PageTransition>
                        <RegexPlayground />
                    </PageTransition>
                }
            />
            {/* Unlinked sprite preview route — used to visually review new cat poses. */}
            <Route
                path="/sprite-demo"
                element={
                    <PageTransition>
                        <SpriteDemo />
                    </PageTransition>
                }
            />
            <Route
                path="*"
                element={
                    <PageTransition>
                        <div className="h-screen flex items-center justify-center">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                                <p className="text-base-content/60">
                                    The page you're looking for doesn't exist.
                                </p>
                            </div>
                        </div>
                    </PageTransition>
                }
            />
        </Routes>
    );
};

function App() {
    return (
        <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="user">
                <HashRouter>
                    {/* Navbar is persistent — outside the keyed Routes so it doesn't remount
                        or fade on every navigation; only the page content transitions. */}
                    <Navbar />
                    <main>
                        <AnimatedRoutes />
                    </main>
                </HashRouter>
            </MotionConfig>
        </LazyMotion>
    );
}

export default App;
