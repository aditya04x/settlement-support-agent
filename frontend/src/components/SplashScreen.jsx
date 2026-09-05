import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`splash-overlay ${!visible ? 'splash-hide' : ''}`}>
      <div className="splash-orb splash-orb1"></div>
      <div className="splash-orb splash-orb2"></div>

      <div className="splash-mark">
        <div className="splash-mark-icon-wrap">
          <svg viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="splash-ring" cx="42" cy="42" r="38" stroke="url(#ringGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="70 200"/>
            <rect x="13" y="13" width="58" height="58" rx="16" fill="url(#boxGrad)"/>
            <path d="M27 47V33L42 42L57 33V47" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="boxGrad" x1="13" y1="13" x2="71" y2="71" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1F5EFF"/>
                <stop offset="1" stopColor="#7C3AED"/>
              </linearGradient>
              <linearGradient id="ringGrad" x1="4" y1="4" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1F5EFF"/>
                <stop offset="1" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="splash-mark-word">Fintech</span>
      </div>
      <div className="splash-credit">by <b>Code Crafters</b></div>
      <div className="splash-track"><div className="splash-fill"></div></div>
    </div>
  );
}
