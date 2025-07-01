// src/components/Navbar.tsx

import { useNavbar } from "@/hooks/useNavbar"
import { motion, useTransform } from "motion/react"
import { Link } from "react-router-dom"
import { HiOutlineMenuAlt3 } from "react-icons/hi"; // for hamburger menu
import { IoChevronUpOutline } from "react-icons/io5"; // for pull tab
import ThemeSwitcher from "./ThemeSwitcher"

function Navbar() {
  const { 
    navbarHeight, 
    navbarOpacity, 
    navbarVisibility, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    closeMobileMenu, 
    showNavbar,
    isHomePage,
    navigateToSection 
  } = useNavbar()

    return (
    <>
      <motion.header 
          className="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md shadow-sm"
          style={{ 
              height: navbarHeight,
              opacity: navbarOpacity,
              y: useTransform(navbarVisibility, 
                [0, 1], 
                ['-100%', '0%']
              )
          }}
      >
        <nav className="navbar container mx-auto px-4">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl" onClick={closeMobileMenu}>
              Seth Linares
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-none gap-2 items-center">
            {!isHomePage && (
              <Link to="/" className="btn btn-ghost">
                Home
              </Link>
            )}
            <button 
              onClick={() => navigateToSection('about')}
              className="btn btn-ghost"
            >
              About
            </button>
            <button 
              onClick={() => navigateToSection('projects')}
              className="btn btn-ghost"
            >
              Projects
            </button>
            <button 
              onClick={() => navigateToSection('experience')}
              className="btn btn-ghost"
            >
              Experience
            </button>
            <button 
              onClick={() => navigateToSection('tools')}
              className="btn btn-ghost"
            >
              Tools
            </button>
            <button 
              onClick={() => navigateToSection('contact')}
              className="btn btn-ghost"
            >
              Contact
            </button>
            <ThemeSwitcher />
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex-none md:hidden">
            <ThemeSwitcher />
            <button 
              className="btn btn-square btn-ghost"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <HiOutlineMenuAlt3 className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu - Replace the existing mobile menu JSX */}
          <motion.div 
            className="md:hidden absolute top-full left-0 right-0 bg-base-100 shadow-lg overflow-hidden"
            initial={false}
            animate={{
              height: isMobileMenuOpen ? 'auto' : 0,
              opacity: isMobileMenuOpen ? 1 : 0
            }}
            transition={{
              height: { 
                duration: 0.3,
                ease: [0.45, 0, 0.55, 1]
              },
              opacity: {
                duration: 0.2,
                ease: [0.45, 0, 0.55, 1]
              }
            }}
          >
            <div className="flex flex-col p-4">
              {!isHomePage && (
                <Link to="/" className="btn btn-ghost" onClick={closeMobileMenu}>
                  Home
                </Link>
              )}
              <button 
                onClick={() => navigateToSection('about')}
                className="btn btn-ghost"
              >
                About
              </button>
              <button 
                onClick={() => navigateToSection('projects')}
                className="btn btn-ghost"
              >
                Projects
              </button>
              <button 
                onClick={() => navigateToSection('experience')}
                className="btn btn-ghost"
              >
                Experience
              </button>
              <button 
                onClick={() => navigateToSection('tools')}
                className="btn btn-ghost"
              >
                Tools
              </button>
              <button 
                onClick={() => navigateToSection('contact')}
                className="btn btn-ghost"
              >
                Contact
              </button>
            </div>
          </motion.div>
        </nav>
      </motion.header>

      {/* Pull Tab */}
      <motion.button
        className="fixed -top-2 left-1/2 -translate-x-1/2 z-50 bg-base-100/90 backdrop-blur-md shadow-lg rounded-b-lg px-4 py-2 border border-base-300"
        style={{
          y: useTransform(navbarVisibility,
            [0, 1],
            [0, -48] // Move up by the height of the button when navbar is visible
          )
        }}
        onClick={showNavbar}
        aria-label="Show navigation bar"
        aria-describedby="pull-tab-description"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            showNavbar()
          }
        }}
      >
        <IoChevronUpOutline className="w-6 h-6" />
        <span id="pull-tab-description" className="sr-only">
          Pull down to show the navigation bar
        </span>
      </motion.button>
    </>
    )
}

export default Navbar;