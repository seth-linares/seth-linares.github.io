// src/pages/About/index.tsx

import React from 'react';

const About: React.FC = () => {

    console.log('About page loaded');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">About Me</h1>
      <p className="text-base-content/70">
        Learn more about who I am and what I do.
      </p>
    </div>
  );
};

export default About;