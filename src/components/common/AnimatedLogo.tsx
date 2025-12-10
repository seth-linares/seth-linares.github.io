// src/components/common/AnimatedLogo.tsx

import { AnimatedLogoProps } from "@/types/components"
import { motion } from "motion/react"



function AnimatedLogo({ isHovered, onHoverStart, onHoverEnd, className = "" }: AnimatedLogoProps) {
  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated Cat Logo */}
      <motion.div
        className="relative"
        animate={{
          rotate: isHovered ? 5 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(45deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))",
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1.3 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        />
        {/* Is it working? */}
        <motion.img
          src="/orange-cat.svg"
          alt="Seth Linares Logo"
          className="w-8 h-8 relative z-10"
          animate={{
            filter: isHovered 
              ? "drop-shadow(0 0 8px rgba(124, 58, 237, 0.5))" 
              : "none",
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Subtle glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-sm"
          style={{
            background: "linear-gradient(45deg, #7c3aed, #3b82f6)",
            opacity: 0,
          }}
          animate={{
            opacity: isHovered ? 0.15 : 0,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Animated Text */}
      <motion.span
        className="text-xl font-semibold transition-colors duration-300"
        style={{
          color: isHovered ? "transparent" : undefined,
          background: isHovered ? "linear-gradient(45deg, #7c3aed, #3b82f6)" : undefined,
          backgroundClip: isHovered ? "text" : undefined,
        }}
      >
        Seth Linares
      </motion.span>
    </motion.div>
  )
}

export default AnimatedLogo