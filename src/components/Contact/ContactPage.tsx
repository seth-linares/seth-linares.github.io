// src/components/Contact/ContactPage.tsx

import React from 'react';

const Contact: React.FC = () => {

    console.log('Contact page loaded');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Contact Me</h1>
      <p className="text-base-content/70">
        Get in touch with me here.
      </p>
    </div>
  );
};

export default Contact;