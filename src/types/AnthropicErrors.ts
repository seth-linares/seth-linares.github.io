// src/types/AnthropicErrors.ts

import {
    AnthropicError,
    APIConnectionError,
    APIConnectionTimeoutError,
    AuthenticationError,
    BadRequestError,
    ConflictError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    UnprocessableEntityError,
} from '@anthropic-ai/sdk';

const ERROR_MAP = [
    [
        BadRequestError,
        {
            message: 'Invalid input provided',
            solution: 'Please check your prompt format and try again',
        },
    ],
    [
        AuthenticationError,
        {
            message: 'Authentication failed',
            solution: 'Please verify your API key is correct and active',
        },
    ],
    [
        PermissionDeniedError,
        {
            message: 'Access denied',
            solution: 'Please ensure your API key has the required permissions',
        },
    ],
    [
        NotFoundError,
        {
            message: 'Resource not found',
            solution: 'The requested resource or endpoint is unavailable',
        },
    ],
    [
        ConflictError,
        {
            message: 'Request conflict detected',
            solution: 'Please try your request again',
        },
    ],
    [
        UnprocessableEntityError,
        {
            message: 'Unable to process request',
            solution: 'Please verify your input meets all requirements',
        },
    ],
    [
        RateLimitError,
        {
            message: 'Rate limit reached',
            solution: 'Please wait a moment before trying again',
        },
    ],
    [
        InternalServerError,
        {
            message: 'Server error occurred',
            solution: 'This is a temporary issue, please try again later',
        },
    ],
    [
        APIConnectionTimeoutError,
        {
            message: 'Connection timed out',
            solution: 'Please check your internet connection and try again',
        },
    ],
    [
        APIConnectionError,
        {
            message: 'Connection failed',
            solution: 'Please verify your internet connection is stable',
        },
    ],
] as const;

export const formatAnthropicError = (error: AnthropicError): string => {
    console.debug('Anthropic API Error:', {
        type: error.constructor.name,
        message: error.message,
        status: 'status' in error ? error.status : undefined,
    });

    for (const [ErrorClass, { message, solution }] of ERROR_MAP) {
        if (error instanceof ErrorClass) {
            return `${message}. ${solution}.`;
        }
    }

    const errorMessage = error.message;
    const hasStatusCode = /^\d{3}\s+/.test(errorMessage);
    return hasStatusCode
        ? errorMessage.substring(4)
        : errorMessage || 'An unexpected error occurred';
};
