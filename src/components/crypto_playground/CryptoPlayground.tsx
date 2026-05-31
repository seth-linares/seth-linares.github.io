// src/components/crypto_playground/CryptoPlayground.tsx

import { m, AnimatePresence } from 'motion/react';
import { FiLock, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { siteData } from '@/personal-site-data';
import useCryptoPlayground from '@/hooks/crypto_playground/useCryptoPlayground';
import Argon2Controls from './Argon2Controls';
import EncryptionResult from './EncryptionResult';

const PAWPASS_URL =
    siteData.projects.find((p) => p.id === 'pawpass')?.links.github ?? siteData.contact.github;

function CryptoPlayground() {
    const {
        password,
        setPassword,
        plaintext,
        setPlaintext,
        params,
        setParam,
        view,
        deriveSeq,
        tamper,
        toggleByte,
        resetTamper,
        isEncrypting,
        error,
        handleEncrypt,
        resetResult,
    } = useCryptoPlayground();

    return (
        <div className="px-4 pb-16 pt-24">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        <span className="bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                            Crypto Playground
                        </span>
                    </h1>
                    <p className="text-base-content/70 mt-2">
                        Stretch a passphrase into a key with{' '}
                        <span className="font-mono text-primary">Argon2id</span>, then encrypt and
                        authenticate it with{' '}
                        <span className="font-mono text-primary">AES-256-GCM</span> — the same stack
                        behind{' '}
                        <a
                            href={PAWPASS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary"
                        >
                            PawPass
                        </a>
                        , running entirely in your browser.
                    </p>
                </div>

                <div className="flex items-start gap-2 text-xs text-base-content/60 bg-base-200 border border-base-300 rounded-lg p-3 mb-6">
                    <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-info" />
                    <span>
                        Educational demo. Keys and plaintext never leave this page — but a browser
                        tab isn&apos;t a vault, so don&apos;t paste real secrets.
                    </span>
                </div>

                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card bg-base-200 shadow-xl"
                >
                    <div className="card-body space-y-5">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Passphrase</span>
                            </label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                spellCheck={false}
                                autoComplete="off"
                                placeholder="a strong passphrase…"
                                className="input input-bordered w-full font-mono focus:input-primary"
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">Plaintext</span>
                            </label>
                            <textarea
                                value={plaintext}
                                onChange={(e) => setPlaintext(e.target.value)}
                                rows={3}
                                placeholder="the message to encrypt…"
                                className="textarea textarea-bordered w-full focus:textarea-primary"
                            />
                        </div>

                        <Argon2Controls
                            params={params}
                            setParam={setParam}
                            disabled={isEncrypting}
                            derivationMs={view?.derivationMs ?? null}
                            deriveSeq={deriveSeq}
                        />

                        {error && (
                            <div className="alert alert-error py-2">
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleEncrypt}
                                disabled={isEncrypting}
                                className="btn btn-primary gap-2 flex-1 min-w-48"
                            >
                                {isEncrypting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        Deriving key…
                                    </>
                                ) : (
                                    <>
                                        <FiLock className="w-4 h-4" />
                                        Derive key &amp; encrypt
                                    </>
                                )}
                            </button>
                            {view && (
                                <button
                                    type="button"
                                    onClick={resetResult}
                                    className="btn btn-ghost gap-2"
                                    title="Clear result"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </m.div>

                <AnimatePresence>
                    {view && tamper && (
                        <EncryptionResult
                            view={view}
                            tamper={tamper}
                            onToggleByte={toggleByte}
                            onResetTamper={resetTamper}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CryptoPlayground;
