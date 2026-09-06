import React, { useEffect, useState } from 'react';
import type { ScriptCue } from '../types';
import { formatTimecode } from '../utils/scriptPacing';

interface FloatingHudProps {
  cues: ScriptCue[];
  currentCueIndex: number;
  currentTime: number;
  isPlaying: boolean;
  isObsRecording: boolean;
  obsRecordTimecode: string;
}

export const FloatingHud: React.FC<FloatingHudProps> = ({
  cues,
  currentCueIndex,
  currentTime,
  isPlaying,
  isObsRecording,
  obsRecordTimecode
}) => {
  const currentCue = cues[currentCueIndex] || null;
  const nextCue = cues[currentCueIndex + 1] || null;

  let cueRemaining = 0;
  let cueProgress = 0;
  if (currentCue) {
    const elapsed = Math.max(0, currentTime - currentCue.startSecond);
    cueRemaining = Math.max(0, Math.ceil(currentCue.durationSeconds - elapsed));
    cueProgress = Math.min(100, (elapsed / currentCue.durationSeconds) * 100);
  }

  const isDanger = cueRemaining <= 2 && cueRemaining > 0;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'rgba(9, 13, 22, 0.92)',
      borderRadius: '16px',
      border: isObsRecording ? '2px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.4)',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 18px',
      color: '#ffffff',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitAppRegion: 'drag' // Makes window draggable in Electron
    } as React.CSSProperties}>
      
      {/* HUD Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 800,
        marginBottom: '6px',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: isObsRecording ? '#ef4444' : '#1e293b',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            {isObsRecording ? `REC ${obsRecordTimecode}` : 'HUD WEBCAM'}
          </span>
          <span style={{ color: '#38bdf8' }}>
            CÂU {currentCueIndex + 1}/{cues.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono-num" style={{ color: isDanger ? '#ef4444' : '#f59e0b', fontSize: '13px' }}>
            Còn: {cueRemaining}s
          </span>
          <span className="font-mono-num" style={{ color: '#94a3b8' }}>
            Tổng: {formatTimecode(currentTime)}
          </span>
        </div>
      </div>

      {/* Progress line */}
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        marginBottom: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${cueProgress}%`,
          height: '100%',
          background: isDanger ? '#ef4444' : '#38bdf8',
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* Prompter Main Text */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: 800,
        lineHeight: 1.35,
        color: '#ffffff',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        {currentCue ? currentCue.text : 'Đang chờ kịch bản...'}
      </div>

      {/* Tiny Next Cue Indicator */}
      {nextCue && (
        <div style={{
          fontSize: '11px',
          color: '#94a3b8',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: '4px'
        }}>
          Tiếp theo: {nextCue.text}
        </div>
      )}

    </div>
  );
};
