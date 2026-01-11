// src/components/regex_playground/ShareButton.tsx

import { useState } from 'react';

interface ShareButtonProps {
    /** The URL to share */
    shareUrl: string;
    /** Callback when share action is triggered */
    onShare?: () => void;
    /** Optional additional CSS classes */
    className?: string;
}

function ShareButton({ shareUrl, onShare, className = '' }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            onShare?.();

            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy URL to clipboard:', error);
            // Fallback: Select the URL in a temporary input for manual copy
            const tempInput = document.createElement('input');
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices

            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
            }

            document.body.removeChild(tempInput);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Handle Enter and Space key activation
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleShare();
        }
    };

    return (
        <div className="relative">
            <button
                className={`btn btn-sm btn-outline transition-all duration-200 ${
                    copied ? 'btn-success' : ''
                } ${className}`}
                onClick={handleShare}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
                aria-label={
                    copied ? 'Link copied to clipboard' : 'Copy shareable link to clipboard'
                }
                title={copied ? 'Copied!' : 'Click to copy link'}
            >
                <span
                    className={`flex items-center gap-2 transition-transform duration-200 ${
                        copied ? 'scale-105' : ''
                    }`}
                >
                    {copied ? (
                        <>
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                />
                            </svg>
                            <span>Share Link</span>
                        </>
                    )}
                </span>
            </button>

            {/* Tooltip */}
            {isHovered && !copied && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-base-content text-base-100 rounded shadow-lg whitespace-nowrap animate-in fade-in duration-200 z-60">
                    Click to copy link
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-base-content"></div>
                </div>
            )}
        </div>
    );
}

export default ShareButton;
