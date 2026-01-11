// src/App.tsx

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import FileContextProvider from './contexts/FileContextProvider';

const PromptGenerator = lazy(() => import('./components/prompt_generator/PromptGenerator'));
const RegexPlayground = lazy(() => import('./components/regex_playground/RegexPlayground'));

const LoadingScreen = () => (
    <div className="h-screen w-full flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
    <>
        <Navbar />
        <main>{children}</main>
    </>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <Layout>
                            <HomePage />
                        </Layout>
                    }
                />

                <Route
                    path="/prompt-generator"
                    element={
                        <Layout>
                            <FileContextProvider>
                                <PromptGenerator />
                            </FileContextProvider>
                        </Layout>
                    }
                />

                <Route
                    path="/regex-playground"
                    element={
                        <Layout>
                            <RegexPlayground />
                        </Layout>
                    }
                />

                <Route
                    path="*"
                    element={
                        <Layout>
                            <div className="h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-4xl font-bold mb-4">
                                        404 - Page Not Found
                                    </h1>
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
        <HashRouter>
            <Suspense fallback={<LoadingScreen />}>
                <AnimatedRoutes />
            </Suspense>
        </HashRouter>
    );
}

export default App;
