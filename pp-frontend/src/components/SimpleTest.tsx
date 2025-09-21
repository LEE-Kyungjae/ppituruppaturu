'use client';

import { useEffect, useRef } from 'react';

export default function SimpleTest() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('SimpleTest component mounted');
    console.log('div ref:', divRef.current);

    if (divRef.current) {
      divRef.current.innerHTML = `
        <h1 style="color: red;">Simple Test Working!</h1>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
      `;
    }
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(45deg, blue, green)',
      padding: '20px'
    }}>
      <div style={{ color: 'white', fontSize: '24px' }}>
        React Component Test
      </div>
      <div ref={divRef} style={{ marginTop: '20px', color: 'white' }}>
        Loading...
      </div>
    </div>
  );
}