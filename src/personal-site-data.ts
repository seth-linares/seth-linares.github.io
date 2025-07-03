// siteData.ts - Main data structure for your personal site

import { PersonalSiteData } from "./types/portfolio";

export const siteData: PersonalSiteData = {
  hero: {
    name: "Seth Linares",
    title: "Software Engineer & Security Enthusiast",
    tagline: "Building secure, performant, and user-centric applications with a focus on system design and cryptography",
    cta: {
      primary: { text: "View Projects", link: "#projects" },
      secondary: { text: "Get In Touch", link: "#contact" }
    }
  },

  about: {
    summary: "I'm a Computer Science graduate with a passion for building secure and efficient systems. My work spans from low-level Rust development to full-stack web applications, with a particular interest in cryptography, security, and developer tools.",
    highlights: [
      "3.99 GPA recipient of full-ride academic scholarship at BYU-Idaho",
      "AWS Certified Solutions Architect with enterprise IoT experience",
      "Open source contributor focused on security and developer productivity",
      "Strong foundation in algorithms, system design, and secure coding practices"
    ],
    values: [
      {
        icon: "shield",
        title: "Security First",
        description: "I believe in building applications with security as a fundamental requirement, not an afterthought"
      },
      {
        icon: "cpu",
        title: "Performance Matters",
        description: "Optimizing for both user experience and system efficiency through thoughtful architecture"
      },
      {
        icon: "heart",
        title: "User-Centric Design",
        description: "Technology should be accessible and delightful, not just functional"
      }
    ]
  },

  experience: [
    {
      company: "Assured Automation",
      position: "IoT Developer",
      location: "Roselle, NJ",
      duration: "April 2024 - Present",
      current: true,
      achievements: [
        "Architected enterprise IoT platform processing 2,000+ daily events from 150+ devices, reducing operational costs by 40%",
        "Implemented real-time monitoring with sub-500ms latency for 20+ concurrent users using TimescaleDB and Redis",
        "Developed custom visualization platform saving $3,588 annually in licensing costs",
        "Engineered Kubernetes/Docker migration improving deployment reliability by 25%",
        "Designed scalable data pipeline supporting 12+ sensor types with automated processing",
        "Implemented secure multi-tenant architecture with 3-level role-based access control"
      ],
      technologies: ["Python", "JavaScript", "TypeScript", "Docker", "Kubernetes", "Redis", "TimescaleDB", "ChirpStack"]
    }
  ],

  projects: [
    {
      id: "pawpass",
      title: "PawPass",
      subtitle: "Secure Offline Password Manager",
      description: "A zero-trust desktop password manager built with Rust and React, featuring military-grade encryption and complete offline operation",
      longDescription: "PawPass represents my 'love letter to security and usability.' It's a password manager that never connects to the internet, using Argon2id for key derivation and AES-256-GCM for encryption. The project showcases advanced Rust memory management techniques, including custom SecureMemory types and careful handling of sensitive data.",
      technologies: ["Rust", "React", "TypeScript", "Tauri", "TailwindCSS", "AES-GCM", "Argon2id", "ChaCha20"],
      links: {
        github: "https://github.com/seth-linares/PawPass-Official"
      },
      highlights: [
        "Implemented 3-tier key hierarchy with configurable Argon2id parameters",
        "Achieved 256-bit security with sub-100ms decryption times",
        "Built zero-copy memory management with automatic zeroization",
        "Reduced attack surface by 70% through local-only architecture",
        "Handles 1000+ encrypted entries with zero corruption incidents"
      ],
      featured: true,
      category: "security"
    },
    {
      id: "codecoach",
      title: "CodeCoach",
      subtitle: "AI-Powered Programming Education Platform",
      description: "An interactive learning platform that combines code execution, AI coaching, and personalized feedback for programming education",
      technologies: ["C#", "ASP.NET", "NextJS", "PostgreSQL", "Docker", "OpenAI API", "Judge0"],
      links: {
        github: "https://github.com/seth-linares/Code_Coach"
      },
      highlights: [
        "Reduced code execution latency by 40% with optimized Judge0 integration",
        "Implemented 3-layer authentication with email verification and 2FA",
        "Expanded support to 3 major programming languages with unified testing",
        "Increased student engagement by 35% through AI-powered personalized coaching",
        "Zero security incidents with rate limiting at 40 requests/minute"
      ],
      featured: true,
      category: "education"
    },
    {
      id: "repoviewer",
      title: "RepoViewer",
      subtitle: "TUI Repository Explorer",
      description: "A cross-platform terminal UI for quickly exploring repositories and selectively exporting file contents",
      longDescription: "RepoViewer solves a real problem I faced: efficiently sharing relevant parts of codebases. Built in Rust with Ratatui, it provides an intuitive way to navigate repositories, collect specific files, and export them with proper formatting.",
      technologies: ["Rust", "Ratatui", "Cross-platform CLI"],
      links: {
        github: "https://github.com/seth-linares/RepoViewer"
      },
      highlights: [
        "Interactive file collection with real-time size tracking",
        "Respects .gitignore with toggleable visibility",
        "Exports to markdown with syntax highlighting",
        "Cross-platform with zero dependencies",
        "Built-in clipboard support for quick sharing"
      ],
      featured: false,
      category: "tools"
    },
    {
      id: "vit-tokenizer",
      title: "Vision Transformer Image Tokenizer",
      subtitle: "Educational Implementation of ViT Encoding",
      description: "An exploration of how Vision Transformers process images, inspired by Andrej Karpathy's tokenizer series",
      technologies: ["Python", "PyTorch", "NumPy", "Computer Vision"],
      links: {
        github: "https://github.com/seth-linares/ViT-Image-Tokenizer"
      },
      highlights: [
        "Implemented sinusoidal positional encodings from scratch",
        "Created both general and PyTorch-specific tokenizers",
        "Comprehensive documentation explaining transformer concepts",
        "Includes unit tests demonstrating mathematical equivalence"
      ],
      featured: false,
      category: "ai"
    }
  ],

  skills: {
    categories: [
      {
        name: "Languages",
        skills: ["Python", "Rust", "TypeScript", "JavaScript", "Java", "C/C++", "C#", "Go", "SQL", "PowerShell"]
      },
      {
        name: "Web Technologies",
        skills: ["React", "Next.js", "ASP.NET", "Node.js", "TailwindCSS", "HTML/CSS", "REST APIs"]
      },
      {
        name: "Tools & Infrastructure",
        skills: ["Docker", "Kubernetes", "AWS", "Git", "Redis", "PostgreSQL", "TimescaleDB", "Linux"]
      },
      {
        name: "Specializations",
        skills: ["Cryptography", "Security Engineering", "System Design", "IoT Development", "Machine Learning", "Parallel Computing"]
      }
    ]
  },

  education: [
    {
      institution: "Brigham Young University-Idaho",
      degree: "B.S. in Computer Science",
      location: "Rexburg, ID",
      duration: "Apr 2022 - Jul 2024",
      gpa: "3.99/4.0",
      highlights: [
        "Full-ride BYU-I Academic Scholarship",
        "Relevant Coursework: Algorithms & Complexity, Parallelism & Concurrency, Machine Learning, Big Data Programming"
      ]
    },
    {
      institution: "Brookdale Community College",
      degree: "A.A.S in Network Information Technology",
      location: "Lincroft, NJ",
      duration: "Jan 2019 - Dec 2021",
      gpa: "3.9/4.0",
      highlights: [
        "Brookdale Foundation and Alumni Scholarship",
        "AWS Certified Solutions Architect - Associate (Aug 2021 - Aug 2024)"
      ]
    }
  ],

  contact: {
    email: "sethlinares1@gmail.com",
    phone: "732-567-4609",
    linkedin: "https://linkedin.com/in/seth-linares",
    github: "https://github.com/seth-linares"
  }
};