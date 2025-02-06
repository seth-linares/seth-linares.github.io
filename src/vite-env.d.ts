/// <reference types="vite/client" />


// This interface defines the shape of environment variables
interface ImportMetaEnv {
  readonly VITE_CLAUDE_API_KEY: string  // Declares that VITE_CLAUDE_API_KEY exists and is a string
  // readonly makes the variable immutable
  // VITE_ prefix is required for client-side exposure
}

// This interface augments the global ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv  // Makes your env variables available via import.meta.env
}
