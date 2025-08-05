// src/components/regex_playground/PatternLibrary.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ANIMATION_VARIANTS } from '@/utils/animations';
import type { PatternLibraryProps, LibraryPattern } from '@/types/regex';

// Organized pattern library with categories
const PATTERN_LIBRARY: LibraryPattern[] = [
  // Validation
  { id: 'email', name: 'Email', pattern: String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`, category: 'validation', flags: { i: true } },
  { id: 'url', name: 'URL (http/https)', pattern: String.raw`https?:\/\/[^\s/$.?#].[^\s]*`, category: 'validation' },
  { id: 'phone-us', name: 'US Phone', pattern: String.raw`\d{3}-\d{3}-\d{4}`, category: 'validation' },
  { id: 'ipv4', name: 'IPv4', pattern: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}\b`, category: 'validation' },
  { id: 'zip', name: 'ZIP Code', pattern: String.raw`\b\d{5}(?:-\d{4})?\b`, category: 'validation' },
  
  // Extraction
  { id: 'hashtag', name: 'Hashtag', pattern: String.raw`#\w+`, category: 'extraction' },
  { id: 'mention', name: '@Mention', pattern: String.raw`@[A-Za-z0-9_]+`, category: 'extraction' },
  { id: 'quoted', name: 'Quoted String', pattern: String.raw`"([^"\\]|\\.)*"`, category: 'extraction' },
  
  // Formatting
  { id: 'date-iso', name: 'ISO Date', pattern: String.raw`\d{4}-\d{2}-\d{2}`, category: 'formatting' },
  { id: 'hex-color', name: 'Hex Color', pattern: String.raw`#(?:[0-9a-fA-F]{3}){1,2}\b`, category: 'formatting' },
  { id: 'slug', name: 'URL Slug', pattern: String.raw`[a-z0-9]+(?:-[a-z0-9]+)*`, category: 'formatting' },
  
  // Misc
  { id: 'whitespace', name: 'Whitespace', pattern: String.raw`\s+`, category: 'misc' },
  { id: 'number', name: 'Number', pattern: String.raw`-?\d+(?:\.\d+)?`, category: 'misc' },
  { id: 'word', name: 'Word', pattern: String.raw`\b\w+\b`, category: 'misc' },
  { id: 'html-tag', name: 'HTML Tag', pattern: String.raw`<\/?[A-Za-z][^>]*>`, category: 'misc' },
];

function PatternLibrary({ onUsePattern, activePatternId }: PatternLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(PATTERN_LIBRARY.map(p => p.category))];
    return cats;
  }, []);
  
  const filteredPatterns = useMemo(() => {
    return PATTERN_LIBRARY.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.pattern.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);
  
  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body">
        <h2 className="card-title text-primary">Pattern Library</h2>
        
        {/* Search Input */}
        <div className="form-control mb-3">
          <input
            type="text"
            placeholder="Search patterns..."
            className="input input-sm input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Category Tabs */}
        <div className="tabs tabs-boxed mb-3">
          {categories.map(cat => (
            <button
              key={cat}
              className={`tab tab-sm ${activeCategory === cat ? 'tab-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Pattern Grid - FIXED ANIMATION */}
        <motion.div 
          className="space-y-2 max-h-96 overflow-y-auto"
          key={`${activeCategory}-${searchTerm}`} // Force re-mount on filter change
        >
          <AnimatePresence initial={false}>
            {filteredPatterns.map((pattern) => (
              <motion.div
                key={pattern.id}
                // Remove layout prop - it's causing the overlap
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: 1, 
                  height: 'auto',
                  transition: {
                    opacity: { duration: 0.2 },
                    height: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
                  }
                }}
                exit={{ 
                  opacity: 0,
                  height: 0,
                  transition: {
                    opacity: { duration: 0.1 },
                    height: { duration: 0.2 }
                  }
                }}
                className="overflow-hidden"
              >
                <div
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${
                      activePatternId === pattern.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-base-300 hover:border-primary/50 hover:bg-base-100'
                    }
                  `}
                  onClick={() => onUsePattern({ pattern: pattern.pattern, flags: pattern.flags })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{pattern.name}</div>
                      <code className="text-xs opacity-70 font-mono block truncate">
                        /{pattern.pattern}/
                      </code>
                    </div>
                    <motion.button
                      whileHover={ANIMATION_VARIANTS.buttonHover}
                      whileTap={ANIMATION_VARIANTS.buttonTap}
                      className="btn btn-xs btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUsePattern({ pattern: pattern.pattern, flags: pattern.flags });
                      }}
                    >
                      Use
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredPatterns.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 opacity-60"
            >
              No patterns found
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default PatternLibrary;