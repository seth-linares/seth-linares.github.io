// src/components/common/AnimatedLogo.tsx

import React from "react"
import { AnimatedLogoProps } from "@/types/components"
import { motion } from "motion/react"

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ isHovered, onHoverStart, onHoverEnd, className = "" }) => {
  return (
    <motion.div
      className={`flex items-center gap-3 group ${className}`}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Logo Container */}
      <div
        className={`relative transition-transform duration-300 ease-out ${
          isHovered ? 'rotate-[5deg] scale-110' : ''
        }`}
      >
        {/* Background glow */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ease-out logo-glow-bg ${
            isHovered ? 'opacity-100 scale-130' : 'opacity-0 scale-100'
          }`}
        />

        {/* Logo image */}
        <img
          src="/orange-cat.svg"
          alt="Seth Linares Logo"
          className={`w-8 h-8 relative z-10 transition-all duration-300 ${
            isHovered ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]' : ''
          }`}
        />

        {/* Subtle glow effect */}
        <div
          className={`absolute inset-0 rounded-full blur-sm transition-all duration-300 logo-glow-accent ${
            isHovered ? 'opacity-15 scale-120' : 'opacity-0 scale-100'
          }`}
        />
      </div>

      {/* Text */}
      <span
        className={`text-xl font-semibold transition-all duration-300 ${
          isHovered
            ? 'bg-linear-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent'
            : ''
        }`}
      >
        Seth Linares
      </span>
    </motion.div>
  )
}

export default React.memo(AnimatedLogo)
