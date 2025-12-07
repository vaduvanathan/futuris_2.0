import React, { useState, useEffect, useRef } from 'react';
import { DebateResult, DebateTurn } from '../types';
import MatrixBackground from './MatrixBackground';
import TypewriterText from './TypewriterText';

// Placeholder images - in a real app these would be imported assets
const IMAGES = {
    Neo: "/Neo.png",
    Smith: "https://api.dicebear.com/7.x/avataaars/svg?seed=Smith&clothing=suit&eyes=squint&eyebrows=angry",
    Morpheus: "https://api.dicebear.com/7.x/avataaars/svg?seed=Morpheus&clothing=shirtCrewNeck&eyes=default&eyebrows=default",
    Oracle: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oracle&clothing=overall&eyes=happy"
};

const VOICES = {
    Neo: "en-US-Neural2-D",
    Smith: "en-US-Neural2-A", 
    Morpheus: "en-US-Neural2-J", // Assuming J exists, otherwise fallback to D
    Oracle: "en-US-Neural2-F"
};

const ComicDebateInterface: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Audio Queue
  const [audioQueue, setAudioQueue] = useState<{text: string, voice: string}[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Process Audio Queue
  useEffect(() => {
    const processQueue = async () => {
        if (isPlaying || audioQueue.length === 0) return;

        const nextItem = audioQueue[0];
        setIsPlaying(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/speak`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: nextItem.text, voice_id: nextItem.voice })
            });

            if (!response.ok) throw new Error('TTS failed');

            const data = await response.json();
            const audio = new Audio(`data:audio/mp3;base64,${data.audio_content}`);
            audioRef.current = audio;
            
            audio.onended = () => {
                setIsPlaying(false);
                setAudioQueue(prev => prev.slice(1));
            };
            
            await audio.play();
        } catch (e) {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
            setAudioQueue(prev => prev.slice(1));
        }
    };

    processQueue();
  }, [audioQueue, isPlaying]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult({ transcript: [], winner: '', confidence: 0, reason: '' });
    setStatusMessage('Initializing The Matrix...');
    setAudioQueue([]); // Clear queue

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    try {
      const response = await fetch(`${apiUrl}/api/debate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: topic }),
      });

      if (!response.ok) throw new Error('Failed to start debate stream');
      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === 'info') {
                setStatusMessage(event.message);
            } else if (event.type === 'turn') {
                const newTurn = { speaker: event.speaker, content: event.content, round: event.round || 1 };
                
                setResult(prev => {
                    if (!prev) return { transcript: [newTurn], winner: '', confidence: 0, reason: '' };
                    // Avoid duplicates if any
                    if (prev.transcript.some(t => t.speaker === newTurn.speaker && t.content === newTurn.content)) return prev;
                    return { ...prev, transcript: [...prev.transcript, newTurn] };
                });

                // Add to audio queue
                const voice = VOICES[event.speaker as keyof typeof VOICES] || VOICES.Neo;
                setAudioQueue(prev => [...prev, { text: event.content, voice }]);

            } else if (event.type === 'verdict') {
                let verdictData = event.content;
                if (typeof verdictData === 'string') {
                    try { verdictData = JSON.parse(verdictData); } catch (e) { console.error(e); }
                }

                setResult(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        winner: verdictData.winner,
                        confidence: verdictData.confidence,
                        reason: verdictData.reason
                    };
                });
                
                // Add verdict to audio queue
                setAudioQueue(prev => [...prev, { text: `The Oracle has spoken. The winner is ${verdictData.winner}. ${verdictData.reason}`, voice: VOICES.Oracle }]);
                
                setLoading(false);
                setStatusMessage('Simulation Complete.');
            }
          } catch (e) {
            console.error('Error parsing JSON line:', line, e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="comic-container">
      <MatrixBackground />
      
      {/* Header / Intro */}
      <div className="comic-header">
        <h1>FUTURIS 2.0</h1>
        <p>Enter the Matrix Debate</p>
      </div>

      {/* Input Area */}
      <div className="comic-input-area">
        <form onSubmit={handleSubmit} className="debate-form">
            <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is the nature of your inquiry?"
            className="topic-input"
            disabled={loading}
            />
            <button type="submit" className="start-btn" disabled={loading || !topic.trim()}>
            {loading ? 'CONNECTING...' : 'JACK IN'}
            </button>
        </form>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Comic Strip Layout */}
      <div className="comic-strip">
        {result?.transcript.map((turn, index) => {
            const isLeft = turn.speaker === 'Neo' || turn.speaker === 'Morpheus';
            return (
                <div key={index} className={`comic-panel ${isLeft ? 'panel-left' : 'panel-right'} fade-in`}>
                    <div className="character-image-container">
                        <img 
                            src={IMAGES[turn.speaker as keyof typeof IMAGES] || IMAGES.Neo} 
                            alt={turn.speaker} 
                            className="character-image"
                        />
                        <div className="character-name">{turn.speaker}</div>
                    </div>
                    <div className="speech-bubble">
                        <TypewriterText text={turn.content} speed={10} />
                    </div>
                </div>
            );
        })}

        {/* Verdict Panel */}
        {result?.winner && (
            <div className="comic-panel panel-center fade-in">
                <div className="character-image-container">
                    <img src={IMAGES.Oracle} alt="Oracle" className="character-image oracle-glow" />
                    <div className="character-name">The Oracle</div>
                </div>
                <div className="speech-bubble oracle-bubble">
                    <h3>VERDICT: {result.winner}</h3>
                    <TypewriterText text={result.reason} speed={20} />
                    <div className="confidence-meter">
                        Confidence: {Math.round(result.confidence * 100)}%
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        .comic-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 1;
            font-family: 'Courier New', Courier, monospace;
            color: #0f0;
        }
        .comic-header {
            text-align: center;
            margin-bottom: 2rem;
            text-shadow: 0 0 10px #0f0;
        }
        .comic-input-area {
            margin-bottom: 3rem;
            display: flex;
            justify-content: center;
        }
        .comic-strip {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            padding-bottom: 100px;
        }
        .comic-panel {
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            background: rgba(0, 20, 0, 0.8);
            border: 2px solid #0f0;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.2);
            transition: transform 0.3s ease;
        }
        .comic-panel:hover {
            transform: scale(1.02);
        }
        .panel-left {
            flex-direction: row;
        }
        .panel-right {
            flex-direction: row-reverse;
            text-align: right;
        }
        .panel-center {
            flex-direction: column;
            align-items: center;
            text-align: center;
            border-color: #ffff00;
            box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
        }
        .character-image-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 140px;
            flex-shrink: 0;
            z-index: 2;
        }
        .character-image {
            width: 100%;
            height: auto;
            max-height: 160px;
            filter: drop-shadow(0 0 5px #0f0);
            object-fit: contain;
            transition: transform 0.3s ease;
        }
        .character-image:hover {
            transform: scale(1.1);
        }
        .oracle-glow {
            filter: drop-shadow(0 0 10px #ffff00);
        }
        .character-name {
            margin-top: 0.5rem;
            font-weight: bold;
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        .speech-bubble {
            background: #fff;
            color: #000;
            padding: 1.5rem;
            border-radius: 20px;
            position: relative;
            flex-grow: 1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 500;
            line-height: 1.5;
        }
        .panel-left .speech-bubble::before {
            content: '';
            position: absolute;
            left: -10px;
            top: 20px;
            border-width: 10px 10px 10px 0;
            border-style: solid;
            border-color: transparent #fff transparent transparent;
        }
        .panel-right .speech-bubble::before {
            content: '';
            position: absolute;
            right: -10px;
            top: 20px;
            border-width: 10px 0 10px 10px;
            border-style: solid;
            border-color: transparent transparent transparent #fff;
        }
        .oracle-bubble {
            background: #ffffcc;
            border: 2px solid #e6e600;
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ComicDebateInterface;
