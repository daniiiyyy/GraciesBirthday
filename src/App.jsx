import React, { useState, useRef, useEffect } from 'react';
import smilyGracie from './assets/smilygracie.jpg';
import gracieTots from './assets/gracietots.jpg';
import gracieSelfie from './assets/gracienmeselfie.jpg';
import gracieMe from './assets/gracienme.jpg';
import gracieKissie from './assets/graciekissie.jpg';
import gracieBottie from './assets/graciebottie.jpg';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [candleLit, setCandleLit] = useState(true);
  const [activeTab, setActiveTab] = useState('letter');
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [activeMemory, setActiveMemory] = useState(null);
  const [customWish, setCustomWish] = useState('');
  
  const [petals, setPetals] = useState(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 14 + 10,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.5 + 0.3
    }))
  );

  const [wishes, setWishes] = useState([
    "Wishing you endless happiness, beautiful adventures, and all the success in the world! ✨",
    "May your 21st year be filled with unforgettable moments and pure joy! 🌸",
    "To many more years of laughing at our own jokes! 🥂"
  ]);

  const [bucketList, setBucketList] = useState([
    { id: 1, title: "Weekend Getaway", detail: "Take a spontaneous road trip to a cute cabin", completed: false },
    { id: 2, title: "Vinyl & Coffee Tasting", detail: "Spend an entire afternoon hunting rare records", completed: false },
    { id: 3, title: "Late Night Stargazing", detail: "Drive out past city lights with cozy blankets", completed: false },
    { id: 4, title: "Celebrate Next Birthday!", detail: "An even bigger milestone celebration", completed: false }
  ]);

  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef(null);

  // Web Audio Synth implementation for Vinyl ambience & Happy Birthday Melody
  const toggleMusic = () => {
    if (isPlaying) {
      if (synthNodesRef.current) {
        // Stop active timeouts and oscillators
        synthNodesRef.current.timeouts.forEach(clearTimeout);
        synthNodesRef.current.activeOscs.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        if (synthNodesRef.current.gain) {
          synthNodesRef.current.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.5);
        }
        synthNodesRef.current = null;
      }
      setIsPlaying(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Note frequencies for Happy Birthday melody
        const noteFreqs = {
          'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
          'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
          'D5': 587.33, 'A#4': 466.16
        };

        // Full "Happy Birthday To You" melody sequence (note, duration in beats)
        const melody = [
          { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 },
          { note: 'D4', dur: 1.0 }, { note: 'C4', dur: 1.0 },
          { note: 'F4', dur: 1.0 }, { note: 'E4', dur: 2.0 },

          { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 },
          { note: 'D4', dur: 1.0 }, { note: 'C4', dur: 1.0 },
          { note: 'G4', dur: 1.0 }, { note: 'F4', dur: 2.0 },

          { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 },
          { note: 'C5', dur: 1.0 }, { note: 'A4', dur: 1.0 },
          { note: 'F4', dur: 1.0 }, { note: 'E4', dur: 1.0 },
          { note: 'D4', dur: 2.0 },

          { note: 'A#4', dur: 0.75 }, { note: 'A#4', dur: 0.25 },
          { note: 'A4', dur: 1.0 }, { note: 'F4', dur: 1.0 },
          { note: 'G4', dur: 1.0 }, { note: 'F4', dur: 2.5 }
        ];

        const tempo = 240; // milliseconds per beat
        let currentTimeOffset = 0;
        const activeOscs = [];
        const timeouts = [];

        const playMelodyLoop = () => {
          currentTimeOffset = 0;
          melody.forEach((item) => {
            const durationMs = item.dur * tempo;
            const t = setTimeout(() => {
              if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                // Warm warm vinyl timbre (triangle wave with lowpass filtering)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(noteFreqs[item.note], ctx.currentTime);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, ctx.currentTime);

                // Attack and Decay Envelope
                noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
                noteGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.04);
                noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (durationMs / 1000) - 0.02);

                osc.connect(filter);
                filter.connect(noteGain);
                noteGain.connect(masterGain);

                osc.start();
                osc.stop(ctx.currentTime + (durationMs / 1000));
                activeOscs.push(osc);
              }
            }, currentTimeOffset);

            timeouts.push(t);
            currentTimeOffset += durationMs;
          });

          // Loop the melody seamlessly
          const loopTimeout = setTimeout(() => {
            playMelodyLoop();
          }, currentTimeOffset + 1000);
          timeouts.push(loopTimeout);
        };

        playMelodyLoop();

        synthNodesRef.current = { gain: masterGain, activeOscs, timeouts };
        setIsPlaying(true);
      } catch (e) {
        console.error("Audio playback error", e);
      }
    }
  };

  const blowCandle = () => {
    setCandleLit(!candleLit);
    if (candleLit) {
      // Add burst of extra floating petals on blow out
      const burstPetals = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: 45 + (Math.random() * 10 - 5),
        size: Math.random() * 16 + 12,
        duration: Math.random() * 6 + 4,
        delay: 0,
        rotation: Math.random() * 360,
        opacity: 0.9
      }));
      setPetals(prev => [...prev, ...burstPetals]);
    }
  };

  const toggleBucket = (id) => {
    setBucketList(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleAddWish = (e) => {
    e.preventDefault();
    if (customWish.trim()) {
      setWishes([customWish.trim(), ...wishes]);
      setCustomWish('');
    }
  };

  // State for the Image Gallery Carousel (6 images)
  const [currentSlide, setCurrentSlide] = useState(0);

  const memories = [
    { id: 1, imageUrl: smilyGracie },
    { id: 2, imageUrl: gracieTots },
    { id: 3, imageUrl: gracieSelfie },
    { id: 4, imageUrl: gracieMe },
    { id: 5, imageUrl: gracieKissie },
    { id: 6, imageUrl: gracieBottie }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % memories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + memories.length) % memories.length);
  };

  return (
    <div className="gracie-app">
      {/* Dynamic CSS Styling strictly adhering to extracted Palette */}
      <style>{`
        :root {
          --gochujang-red: #780000;
          --crimson-blaze: #C1121F;
          --varden-accent: #c7bba2;
          --varden-parchment: #f3efe6;
          --varden-red: #AE1F23;
          --cosmos-blue: #003049;
          --blue-marble: #669BBC;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Playfair Display', Georgia, serif;
        }

        body {
          background-color: var(--cosmos-blue);
          color: var(--varden-parchment);
          overflow-x: hidden;
          min-height: 100vh;
        }

        .gracie-app {
          position: relative;
          min-height: 100vh;
          background: radial-gradient(circle at 50% 20%, #00456a 0%, var(--cosmos-blue) 70%, #001825 100%);
          padding: 2rem 1rem;
        }

        /* Ambient floating petals */
        .petal-field {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .petal {
          position: absolute;
          top: -10%;
          fill: var(--crimson-blaze);
          animation: floatDown linear infinite;
        }

        @keyframes floatDown {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--petal-opacity, 0.6);
          }
          90% {
            opacity: var(--petal-opacity, 0.6);
          }
          100% {
            transform: translateY(115vh) rotate(360deg) translateX(50px);
            opacity: 0;
          }
        }

        /* Main Container */
        .content-container {
          max-width: 1050px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        /* Header Styling */
        .hero-header {
          text-align: center;
          padding: 3rem 1rem 2rem 1rem;
          position: relative;
        }

        .hero-tag {
          font-family: 'Cinzel', sans-serif;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-size: 0.85rem;
          color: var(--blue-marble);
          margin-bottom: 0.75rem;
          display: block;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 400;
          color: var(--varden-parchment);
          line-height: 1.15;
          margin-bottom: 1rem;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .hero-title span {
          color: var(--varden-accent);
          font-style: italic;
          font-weight: 300;
        }

        .subtitle {
          font-size: 1.1rem;
          color: var(--blue-marble);
          font-weight: 300;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Botanical Divider */
        .botanical-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0 3rem 0;
        }

        .divider-line {
          height: 1px;
          width: 80px;
          background: linear-gradient(90deg, transparent, var(--blue-marble), transparent);
        }

        /* Top Interactive Bar: Candle & Vinyl Player */
        .interactive-deck {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3.5rem;
        }

        .deck-card {
          background: rgba(120, 0, 0, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(193, 18, 31, 0.3);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .deck-card:hover {
          border-color: var(--blue-marble);
          transform: translateY(-3px);
        }

        /* Candle Styling */
        .candle-wrapper {
          position: relative;
          cursor: pointer;
          margin: 1.5rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .candle-flame {
          width: 22px;
          height: 32px;
          background: radial-gradient(circle at 50% 80%, #ffffff, #ffe066 40%, var(--crimson-blaze) 80%);
          border-radius: 50% 50% 35% 35%;
          box-shadow: 0 0 20px #ffe066, 0 0 35px var(--crimson-blaze);
          animation: flicker 1.2s infinite alternate;
          margin-bottom: 4px;
        }

        @keyframes flicker {
          0% { transform: scale(1) rotate(-1deg); opacity: 0.95; }
          100% { transform: scale(1.1) rotate(1deg); opacity: 1; }
        }

        .candle-wick {
          width: 3px;
          height: 10px;
          background-color: #333;
        }

        .candle-body {
          width: 50px;
          height: 90px;
          background: linear-gradient(180deg, var(--varden-accent) 0%, #8c7e68 100%);
          border-radius: 8px 8px 12px 12px;
          position: relative;
          box-shadow: inset -5px 0 10px rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .candle-flowers {
          position: absolute;
          bottom: 5px;
          width: 100%;
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .smoke {
          width: 8px;
          height: 25px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          filter: blur(4px);
          animation: riseSmoke 2s forwards;
        }

        @keyframes riseSmoke {
          0% { transform: translateY(0) scaleX(1); opacity: 0.8; }
          100% { transform: translateY(-40px) scaleX(3); opacity: 0; }
        }

        /* Vinyl Player Styling */
        .vinyl-container {
          position: relative;
          width: 140px;
          height: 140px;
          margin: 1rem 0;
        }

        .vinyl-disc {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, var(--cosmos-blue) 18%, #111 20%, #222 40%, #111 41%, #222 60%, var(--gochujang-red) 61%, var(--crimson-blaze) 100%);
          border-radius: 50%;
          box-shadow: 0 5px 15px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .vinyl-spinning {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .vinyl-center {
          width: 45px;
          height: 45px;
          background-color: var(--varden-accent);
          border-radius: 50%;
          border: 3px solid var(--gochujang-red);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          color: var(--gochujang-red);
          font-weight: bold;
        }

        .arm-needle {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 60px;
          height: 80px;
          pointer-events: none;
          transition: transform 0.5s ease;
          transform-origin: top right;
        }

        .arm-needle.playing {
          transform: rotate(22deg);
        }

        /* Navigation Tabs */
        .nav-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: rgba(0, 48, 73, 0.6);
          border: 1px solid var(--blue-marble);
          color: var(--varden-parchment);
          padding: 0.75rem 1.75rem;
          border-radius: 30px;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 1px;
        }

        .tab-btn:hover, .tab-btn.active {
          background: var(--crimson-blaze);
          border-color: var(--crimson-blaze);
          box-shadow: 0 4px 15px rgba(193, 18, 31, 0.4);
          transform: translateY(-2deg);
        }

        /* Section Cards */
        .main-card {
          background: rgba(120, 0, 0, 0.2);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(193, 18, 31, 0.25);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
          margin-bottom: 3rem;
        }
        /* Letter Content Styling */
        .letter-content p {
          margin-bottom: 1.5rem;
        }

        /* Interactive Image Gallery Carousel */
        .carousel-wrapper {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid rgba(193, 18, 31, 0.3);
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          background: rgba(0, 24, 37, 0.6);
        }

        .carousel-track {
          display: flex;
          transition: transform 0.5s ease-in-out;
          width: 100%;
        }

        .carousel-slide {
          min-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .carousel-img-box {
          position: relative;
          width: 100%;
          height: 380px;
          overflow: hidden;
        }

        .carousel-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 48, 73, 0.85);
          backdrop-filter: blur(6px);
          border: 1px solid var(--blue-marble);
          color: var(--varden-accent);
          padding: 0.4rem 0.9rem;
          border-radius: 20px;
          font-size: 0.75rem;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .carousel-info {
          padding: 1.75rem 2rem 2rem 2rem;
          width: 100%;
          text-align: center;
          background: linear-gradient(180deg, rgba(0,48,73,0.3) 0%, rgba(120,0,0,0.2) 100%);
        }

        .carousel-title {
          font-size: 1.6rem;
          color: var(--varden-parchment);
          margin-bottom: 0.4rem;
          font-weight: 400;
        }

        .carousel-caption {
          font-family: 'Caveat', 'Comic Sans MS', cursive, sans-serif;
          font-size: 1.25rem;
          color: var(--blue-marble);
          margin-bottom: 0.75rem;
        }

        .carousel-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--varden-parchment);
          opacity: 0.9;
          max-width: 650px;
          margin: 0 auto;
        }

        .carousel-nav-btn {
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          background: rgba(0, 48, 73, 0.75);
          color: var(--varden-parchment);
          border: 1px solid var(--blue-marble);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .carousel-nav-btn:hover {
          background: var(--crimson-blaze);
          border-color: var(--crimson-blaze);
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-nav-btn.prev { left: 1rem; }
        .carousel-nav-btn.next { right: 1rem; }

        /* Thumbnails & Indicators */
        .thumbnails-row {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }

        .thumb-btn {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.3s ease;
          padding: 0;
          background: none;
        }

        .thumb-btn.active, .thumb-btn:hover {
          opacity: 1;
          border-color: var(--crimson-blaze);
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(193, 18, 31, 0.4);
        }

        .thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Bucket List styling */
        .bucket-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bucket-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(0, 48, 73, 0.4);
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(193, 18, 31, 0.2);
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .bucket-item:hover {
          background: rgba(0, 48, 73, 0.7);
        }

        .checkbox {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 2px solid var(--blue-marble);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .checkbox.checked {
          background: var(--crimson-blaze);
          border-color: var(--crimson-blaze);
        }

        /* Wishes Wall */
        .wishes-input-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .wish-input {
          flex: 1;
          background: rgba(0, 48, 73, 0.6);
          border: 1px solid var(--blue-marble);
          padding: 0.85rem 1.25rem;
          border-radius: 30px;
          color: var(--varden-parchment);
          font-size: 1rem;
          outline: none;
        }

        .wish-input:focus {
          border-color: var(--crimson-blaze);
        }

        .wish-btn {
          background: var(--crimson-blaze);
          color: white;
          border: none;
          padding: 0 1.75rem;
          border-radius: 30px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: background 0.3s ease;
        }

        .wish-btn:hover {
          background: var(--gochujang-red);
        }

        .wishes-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wish-card {
          background: rgba(0, 48, 73, 0.4);
          border-left: 3px solid var(--blue-marble);
          padding: 1.25rem 1.5rem;
          border-radius: 0 12px 12px 0;
          font-style: italic;
        }

        /* Footer */
        .footer {
          text-align: center;
          padding: 2rem 0 1rem 0;
          color: var(--blue-marble);
          font-size: 0.9rem;
          border-top: 1px solid rgba(102, 155, 188, 0.15);
        }

        /* Button General */
        .action-btn {
          background: linear-gradient(135deg, var(--crimson-blaze), var(--gochujang-red));
          color: var(--varden-parchment);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          box-shadow: 0 4px 12px rgba(193, 18, 31, 0.5);
          transform: scale(1.03);
        }

        @media (max-width: 600px) {
          .main-card {
            padding: 1.5rem;
          }
          .interactive-deck {
            grid-template-columns: 1fr;
          }
          .wishes-input-group {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Floating Botanical Petals Background */}
      <div className="petal-field">
        {petals.map(p => (
          <svg
            key={p.id}
            className="petal"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--petal-opacity': p.opacity
            }}
            viewBox="0 0 24 24"
          >
            <path d="M12,2 C15,7 22,10 22,15 C22,19 18,22 12,22 C6,22 2,19 2,15 C2,10 9,7 12,2 Z" />
          </svg>
        ))}
      </div>

      <div className="content-container">
        {/* Header Section */}
        <header className="hero-header">
          <span className="hero-tag">A Celebration of Grace & Wisdom</span>
          <h1 className="hero-title">Happy Birthday, <span>Gracie</span></h1>
          <p className="subtitle">
            To my absolute best friend: may your life be as rich, beautiful, and effortlessly iconic as you are.
          </p>
          
          <div className="botanical-divider">
            <div className="divider-line"></div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue-marble)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
            <div className="divider-line"></div>
          </div>
        </header>

        {/* Top Interactive Deck */}
        <div className="interactive-deck">
          {/* Birthday Candle Card */}
          <div className="deck-card">
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--blue-marble)' }}>
              Blow out your candle
            </span>

            <div className="candle-wrapper" onClick={blowCandle} title="Click to blow or light candle">
              {!candleLit && <div className="smoke"></div>}
              {candleLit && <div className="candle-flame"></div>}
              <div className="candle-wick"></div>
              <div className="candle-body">
                <div className="candle-flowers">🌸 🌿</div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--varden-accent)', textAlign: 'center' }}>
              {candleLit ? "Click the flame to make a wish & blow out the candle" : "✨ Wish made! Click candle to relight"}
            </p>
          </div>

          {/* Vinyl Record Player Card */}
          <div className="deck-card">
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--blue-marble)' }}>
              Your Birthday Song
            </span>

            <div className="vinyl-container">
              <div className={`vinyl-disc ${isPlaying ? 'vinyl-spinning' : ''}`}>
                <div className="vinyl-center">G & D</div>
              </div>
              <svg className={`arm-needle ${isPlaying ? 'playing' : ''}`} viewBox="0 0 60 80">
                <path d="M 50 10 L 25 50 L 20 65" stroke="var(--varden-accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="50" cy="10" r="6" fill="var(--crimson-blaze)" />
                <rect x="16" y="63" width="8" height="12" fill="#aaa" rx="2" />
              </svg>
            </div>

            <button className="action-btn" onClick={toggleMusic}>
              {isPlaying ? 'Pause Birthday Song' : 'Play Birthday Song'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'letter' ? 'active' : ''}`}
            onClick={() => setActiveTab('letter')}
          >
            💌 The Letter
          </button>
          <button 
            className={`tab-btn ${activeTab === 'memories' ? 'active' : ''}`}
            onClick={() => setActiveTab('memories')}
          >
            📸 Moment Vault
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bucket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bucket')}
          >
            🥂 Next Chapter Capsule
          </button>
          <button 
            className={`tab-btn ${activeTab === 'wishes' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishes')}
          >
            🌸 Birthday Wishes
          </button>
        </nav>

        {/* Main Content Sections */}
        <main className="main-card">
          {/* Letter Tab */}
          {activeTab === 'letter' && (
            <div className="envelope-wrapper">
              {!isLetterOpen ? (
                <div>
                  <div className="wax-seal" onClick={() => setIsLetterOpen(true)}>
                    <span style={{ color: 'var(--varden-parchment)', fontSize: '1.5rem', fontWeight: 'bold' }}>G</span>
                  </div>
                  <h3 style={{ color: 'var(--varden-accent)', marginBottom: '0.5rem', fontWeight: '400' }}>
                    A Letter For Gracie
                  </h3>
                  <p style={{ color: 'var(--blue-marble)', fontSize: '0.9rem' }}>
                    Click the wax seal to open your birthday letter.
                  </p>
                </div>
              ) : (
                <div className="letter-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(102,155,188,0.2)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--blue-marble)' }}>To: Gracie</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--blue-marble)' }}>From: Your Best Friend</span>
                  </div>
                  
                  <p>Dearest Gracie,</p>
                  
                  <p>
                    As you celebrate your 21st, I am just humble and glad to have been part of it. I can't wait to see you grow throughout the years just as i have watched the last year.
                  </p>

                  <p>
                    Thank you for being the person I can talk to constantly even when it's annoying, and repetitive. We sit with each other through our toughest, i hope to say this again in our 30s. Thank you for being you.
                  </p>

                  <p>
                    May this year open doors to dream destinations, quiet moments of luxury, deep contentment, and endless reasons to smile. You deserve every ounce of beauty this world has to offer.
                  </p>

                  <p style={{ fontStyle: 'italic', color: 'var(--varden-accent)' }}>
                    With all my love, Happy Birthday!
                  </p>

                  <div style={{ marginTop: '2rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => setIsLetterOpen(false)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--blue-marble)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      Re-seal envelope
                    </button>
                    <span style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--crimson-blaze)' }}>
                      Always & Forever 
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Moment Vault / Memories Tab (Interactive Slider Gallery) */}
          {activeTab === 'memories' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--varden-accent)', fontWeight: '400', marginBottom: '0.5rem' }}>
                  The Memory Gallery
                </h2>
                <p style={{ color: 'var(--blue-marble)', fontSize: '0.95rem' }}>
                  Click arrows or thumbnails to slide through our favorite memories together ({currentSlide + 1} of {memories.length}).
                </p>
              </div>

              {/* Gallery Carousel */}
              <div className="carousel-wrapper">
                <button className="carousel-nav-btn prev" onClick={prevSlide} title="Previous Memory">
                  ❮
                </button>
                <button className="carousel-nav-btn next" onClick={nextSlide} title="Next Memory">
                  ❯
                </button>

                <div 
                  className="carousel-track" 
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {memories.map((m, idx) => (
                    <div key={m.id} className="carousel-slide">
                      <div className="carousel-img-box">
                        <img src={m.imageUrl} alt={`Memory ${idx + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="thumbnails-row">
                {memories.map((m, idx) => (
                  <button
                    key={m.id}
                    className={`thumb-btn ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Show memory ${idx + 1}`}
                  >
                    <img src={m.imageUrl} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bucket List Tab */}
          {activeTab === 'bucket' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--varden-accent)', fontWeight: '400', marginBottom: '0.5rem' }}>
                  For Our Next Chapter
                </h2>
                <p style={{ color: 'var(--blue-marble)', fontSize: '0.95rem' }}>
                  A curated bucket list for the upcoming year. Click to mark off our adventures!
                </p>
              </div>

              <div className="bucket-list">
                {bucketList.map(item => (
                  <div 
                    key={item.id} 
                    className="bucket-item"
                    onClick={() => toggleBucket(item.id)}
                  >
                    <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                      {item.completed && <span style={{ color: 'white', fontSize: '0.8rem' }}>✓</span>}
                    </div>
                    <div>
                      <h4 style={{ 
                        fontSize: '1.1rem', 
                        color: item.completed ? 'var(--blue-marble)' : 'var(--varden-parchment)',
                        textDecoration: item.completed ? 'line-through' : 'none'
                      }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--varden-accent)', opacity: 0.8, marginTop: '2px' }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Birthday Wishes Wall Tab */}
          {activeTab === 'wishes' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--varden-accent)', fontWeight: '400', marginBottom: '0.5rem' }}>
                  Birthday Wishes Wall
                </h2>
                <p style={{ color: 'var(--blue-marble)', fontSize: '0.95rem' }}>
                  Leave a note or a blessing for Gracie's next solar return.
                </p>
              </div>

              <form onSubmit={handleAddWish} className="wishes-input-group">
                <input 
                  type="text" 
                  className="wish-input" 
                  placeholder="Write a heartfelt wish..."
                  value={customWish}
                  onChange={(e) => setCustomWish(e.target.value)}
                />
                <button type="submit" className="wish-btn">Send Wish</button>
              </form>

              <div className="wishes-list">
                {wishes.map((w, idx) => (
                  <div key={idx} className="wish-card">
                    "{w}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>Created with love for Gracie • Wishing you an incredible year ahead</p>
        </footer>
      </div>
    </div>
  );
}