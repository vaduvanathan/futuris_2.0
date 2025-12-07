import React, { useState, useEffect, useRef } from 'react';
import { DebateResult, DebateTurn } from '../types';
import MatrixBackground from './MatrixBackground';
import TypewriterText from './TypewriterText';

const DebateInterface: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // We need to track which turns have finished animating to show the next one
  // But for simplicity in this 3-column layout, we can just show them as they arrive
  // The user asked for "first give one point of neo and smith and then morpheus"
  // The backend yields them in that order (Neo -> Smith -> Morpheus).
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult({ transcript: [], winner: '', confidence: 0, reason: '' });
    setStatusMessage('Initializing The Matrix...');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    try {
      const response = await fetch(`${apiUrl}/api/debate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: topic }),
      });

      if (!response.ok) {
        throw new Error('Failed to start debate stream');
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

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
                setResult(prev => {
                    const newTurn = { speaker: event.speaker, content: event.content, round: event.round || 1 };
                    if (!prev) return { transcript: [newTurn], winner: '', confidence: 0, reason: '' };
                    return { ...prev, transcript: [...prev.transcript, newTurn] };
                });
            } else if (event.type === 'verdict') {
                // Parse the inner JSON content string
                let verdictData = event.content;
                if (typeof verdictData === 'string') {
                    try {
                        verdictData = JSON.parse(verdictData);
                    } catch (e) {
                        console.error("Failed to parse verdict JSON string", e);
                    }
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

  // Helper to filter turns by speaker and round
  const getTurnsBySpeakerAndRound = (speakerName: string, round: number) => {
    return result?.transcript.filter(t => t.speaker.includes(speakerName) && t.round === round) || [];
  };

  return (
    <div className="debate-container">
      <MatrixBackground />
      <h1>The Matrix Debate</h1>
      
      <form onSubmit={handleSubmit} className="debate-form">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic to simulate..."
          className="topic-input"
          disabled={loading}
        />
        <button type="submit" className="start-btn" disabled={loading || !topic.trim()}>
          {loading ? 'Simulating...' : 'Enter Matrix'}
        </button>
      </form>

      {error && <div className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</div>}
      
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      {/* Rounds Rendering */}
      {[1, 2].map(round => {
          // Check if this round has any turns
          const hasTurns = result?.transcript.some(t => t.round === round);
          // If round 2 has no turns yet, don't render it
          if (round > 1 && !hasTurns) return null;

          return (
            <React.Fragment key={round}>
                {round > 1 && (
                    <div className="fight-separator">
                        <div className="fight-line"></div>
                        <div className="fight-text">FIGHT</div>
                        <div className="fight-line"></div>
                    </div>
                )}
                
                <div className="debate-grid">
                    {/* Neo */}
                    <div className="debate-column column-neo">
                        {round === 1 && <h2 className="speaker-header speaker-neo">Neo</h2>}
                        {getTurnsBySpeakerAndRound('Neo', round).map((turn, i) => (
                            <div key={i} className="turn-card speaker-neo">
                                <div className="turn-content">
                                    <TypewriterText text={turn.content} speed={20} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Morpheus */}
                    <div className="debate-column column-morpheus">
                        {round === 1 && <h2 className="speaker-header speaker-morpheus">Morpheus</h2>}
                        {getTurnsBySpeakerAndRound('Morpheus', round).map((turn, i) => (
                            <div key={i} className="turn-card speaker-morpheus">
                                <div className="turn-content">
                                    <TypewriterText text={turn.content} speed={20} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Smith */}
                    <div className="debate-column column-smith">
                        {round === 1 && <h2 className="speaker-header speaker-smith">Agent Smith</h2>}
                        {getTurnsBySpeakerAndRound('Smith', round).map((turn, i) => (
                            <div key={i} className="turn-card speaker-smith">
                                <div className="turn-content">
                                    <TypewriterText text={turn.content} speed={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </React.Fragment>
          );
      })}

      {result?.winner && (
        <div className="verdict-card visible">
          <div className="verdict-title">The Oracle's Verdict</div>
          <div className="verdict-winner">{result.winner}</div>
          <div className="verdict-reason">
             <TypewriterText text={result.reason} speed={30} />
          </div>
          <div style={{marginTop: '1rem', color: '#00ff41', fontSize: '1.2rem'}}>
            Confidence: {result.confidence > 1 ? result.confidence : Math.round(result.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateInterface;
