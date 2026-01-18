"use client";

import React, { useState } from 'react';
import './ContactPage.css';

const ContactPage = () => {
  const [name, setName] = useState('');

  return (
    <div>
      <h1>Contact</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
  );
};

export default ContactPage;
