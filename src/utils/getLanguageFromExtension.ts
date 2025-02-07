export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // Programming Languages
    'ts': 'typescript',
    'tsx': 'tsx',
    'js': 'javascript',
    'jsx': 'jsx',
    'vue': 'vue',
    'svelte': 'svelte',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'sql': 'sql',
    'php': 'php',
    'rb': 'ruby',
    'pl': 'perl',
    'kt': 'kotlin',
    'scala': 'scala',
    'dart': 'dart',
    'r': 'r',
    'lua': 'lua',
    'elm': 'elm',
    'fs': 'fsharp',
    'vb': 'vbnet',
    'asm': 'assembly',
    'f90': 'fortran',
    'f95': 'fortran',
    'f03': 'fortran',
    'nim': 'nim',
    'ex': 'elixir',
    'exs': 'elixir',
    'erl': 'erlang',
    'hrl': 'erlang',
    'clj': 'clojure',
    'groovy': 'groovy',
    'jl': 'julia',
    'ml': 'ocaml',
    'mli': 'ocaml',
    
    // Web Technologies
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'astro': 'astro',
    'liquid': 'liquid',
    'pug': 'pug',
    'haml': 'haml',
    
    // Markup
    'md': 'markdown',
    'mdx': 'markdown',
    'txt': 'plaintext',
    
    // Shell Scripts
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'ps1': 'powershell',
    
    // Config/Data
    'toml': 'toml',
    'ini': 'ini',
    'conf': 'conf',
    'env': 'properties',
    'proto': 'protobuf',
    'cmake': 'cmake',
    'makefile': 'makefile',
    'mk': 'makefile',
    'gradle': 'gradle',
    'graphql': 'graphql',
    'gql': 'graphql',
    
    // Docker & DevOps
    'dockerfile': 'dockerfile',
    'tf': 'terraform',
    'hcl': 'hcl',
  };

  return languageMap[ext || ''] || 'plaintext';
}
