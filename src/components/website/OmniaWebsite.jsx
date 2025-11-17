// 🌐 OMNIA WEBSITE COMPONENT - Modern Landing Page
// Standalone website component for www.omniaoneai.com

import React, { useEffect, useState } from 'react';

const OmniaWebsite = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate content in after mount
    setTimeout(() => setShowContent(true), 200);
  }, []);

  return (
    <>
      {/* CSS Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .website-body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          line-height: 1.6;
          background: #0a0a0f;
          color: white;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .website-body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(140, 82, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 51, 204, 0.1) 0%, transparent 50%);
          z-index: -1;
          pointer-events: none;
          animation: backgroundShift 15s ease-in-out infinite;
        }
        
        @keyframes backgroundShift {
          0%, 100% {
            background: 
              radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(140, 82, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 51, 204, 0.1) 0%, transparent 50%);
          }
          33% {
            background: 
              radial-gradient(circle at 80% 60%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 30% 80%, rgba(140, 82, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 60% 20%, rgba(255, 51, 204, 0.1) 0%, transparent 50%);
          }
          66% {
            background: 
              radial-gradient(circle at 40% 20%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(140, 82, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 20% 60%, rgba(255, 51, 204, 0.1) 0%, transparent 50%);
          }
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .header {
          padding: 20px 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #8c52ff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .cta-button {
          background: linear-gradient(135deg, #00d4ff, #8c52ff);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s, box-shadow 0.3s;
          font-size: 1rem;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
        }
        
        .hero {
          padding: 150px 0 100px;
          text-align: center;
        }
        
        .brand-text {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #ffffff 0%, #00d4ff 30%, #8c52ff 70%, #ffffff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          line-height: 1.1;
          animation: gradientShift 4s ease-in-out infinite;
        }
        
        .hero-title {
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 30px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.2;
        }
        
        .hero-subtitle {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 30px;
          font-weight: 300;
          letter-spacing: 0.25rem;
        }
        
        .status-badges {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 10px 18px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .status-dot.green { background: #00ff88; }
        .status-dot.orange { background: #ff6b35; animation-delay: 0.5s; }
        .status-dot.purple { background: #8c52ff; animation-delay: 1s; }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .hero-cta {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 40px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #00d4ff, #8c52ff);
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s;
        }
        
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 212, 255, 0.4);
        }
        
        
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s ease;
        }
        
        .fade-in.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          .brand-text { font-size: 2.5rem; }
          .hero-title { font-size: 2rem; }
          .hero-subtitle { font-size: 1.2rem; letter-spacing: 0.1rem; }
          .status-badges { flex-direction: column; align-items: center; }
          .hero-cta { flex-direction: column; align-items: center; }
          .hero { padding: 120px 0 60px; }
        }
      `}</style>
      
      <div className="website-body">
        {/* Header */}
        <header className="header">
          <nav className="container">
            <div className="nav">
              <div className="logo">Omnia</div>
              <a href="https://omniaoneai.com" className="cta-button">Launch App</a>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className={`fade-in ${showContent ? 'show' : ''}`}>
              <h1 className="brand-text">Omnia One AI</h1>
              <h2 className="hero-title">Your Personal AI That Knows You</h2>
              <p className="hero-subtitle">Think global. Answer local</p>
              
              <div className="status-badges">
                <div className="status-badge">
                  <div className="status-dot green"></div>
                  <span>Lightning Fast</span>
                </div>
                <div className="status-badge">
                  <div className="status-dot orange"></div>
                  <span>Works Offline</span>
                </div>
                <div className="status-badge">
                  <div className="status-dot purple"></div>
                  <span>Remembers You</span>
                </div>
              </div>
              
              <div className="hero-cta">
                <a href="https://omniaoneai.com" className="btn-primary">Try Omnia Now</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default OmniaWebsite;