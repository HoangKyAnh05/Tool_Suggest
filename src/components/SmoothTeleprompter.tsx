import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FlipHorizontal, 
  Sliders, 
  Type, 
  FastForward,
  Video
} from 'lucide-react';
import type { ScriptCue } from '../types';

interface SmoothTeleprompterProps {
  cues: ScriptCue[];
  rawText: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  isObsRecording: boolean;
  onToggleObsRecord: () => void;
  wpm: number;
  onChangeWpm: (wpm: number) => void;
}

export const SmoothTeleprompter: React.FC<SmoothTeleprompterProps> = ({
  cues,
  rawText,
  isPlaying,
  onTogglePlay,
  onReset,
  isObsRecording,
  onToggleObsRecord,
  wpm,
  onChangeWpm
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(36);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const scrollAnimRef = useRef<number | null>(null);

  // Text to render: either from cues joined or raw text
  const displayText = cues.length > 0 ? cues.map(c => c.text).join('\n\n') : rawText;

  // Pixel scroll speed based on WPM:
  // ~140 WPM = ~35-45 pixels per second at 36px font
  const scrollSpeedPxPerSec = (wpm / 140) * (fontSize * 1.15);

  useEffect(() => {
    let lastTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying && containerRef.current) {
        containerRef.current.scrollTop += scrollSpeedPxPerSec * deltaTime;
      }

      if (isPlaying) {
        scrollAnimRef.current = requestAnimationFrame(step);
      }
    };

    if (isPlaying) {
      scrollAnimRef.current = requestAnimationFrame(step);
    } else {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    }

    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isPlaying, scrollSpeedPxPerSec]);

  const handleResetScroll = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onReset();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* Top Teleprompter Config Ribbon */}
      <div className="glass-panel" style={{
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Speed Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FastForward size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Tốc độ đọc:</span>
          <input
            type="range"
            min="80"
            max="220"
            step="5"
            value={wpm}
            onChange={(e) => onChangeWpm(Number(e.target.value))}
            style={{ width: '130px', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <span className="font-mono-num" style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', minWidth: '65px' }}>
            {wpm} WPM
          </span>
        </div>

        {/* Font Size Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Type size={16} color="#94a3b8" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Cỡ chữ:</span>
          <input
            type="range"
            min="24"
            max="60"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '100px', accentColor: '#3b82f6', cursor: 'pointer' }}
          />
          <span className="font-mono-num" style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', minWidth: '40px' }}>
            {fontSize}px
          </span>
        </div>

        {/* Mirror Flip Toggle */}
        <button
          onClick={() => setIsMirrored(!isMirrored)}
          title="Lật gương 180° (khi dùng kính teleprompter quang học)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: isMirrored ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
            background: isMirrored ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
            color: isMirrored ? '#38bdf8' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <FlipHorizontal size={14} />
          <span>Lật Gương (Mirror)</span>
        </button>
      </div>

      {/* Main Teleprompter Stage Screen */}
      <div className="glass-panel" style={{
        flex: 1,
        background: '#04070d',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isObsRecording ? '2px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        
        {/* Eye Focus Level Marker (at 38% height) */}
        <div style={{
          position: 'absolute',
          top: '38%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.6) 20%, rgba(56, 189, 248, 0.9) 50%, rgba(56, 189, 248, 0.6) 80%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.8)'
        }}>
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '-10px',
            background: '#090d16',
            color: '#38bdf8',
            fontSize: '10px',
            fontWeight: 800,
            padding: '1px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            VỊ TRÍ MẮT NHÌN (EYE-LEVEL)
          </div>
        </div>

        {/* Scrollable Prompter Body */}
        <div
          ref={containerRef}
          className={isMirrored ? 'prompter-mirrored' : ''}
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '240px 48px',
            color: '#ffffff',
            fontSize: `${fontSize}px`,
            lineHeight: 1.6,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '-0.2px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {displayText || 'Chưa có nội dung kịch bản để chạy chữ. Vui lòng nhập nội dung ở ô bên trái.'}
        </div>

      </div>

      {/* Dock Controller */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* OBS Master Record Button */}
        <button
          onClick={onToggleObsRecord}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            background: isObsRecording 
              ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' 
              : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: isObsRecording ? 'none' : '0 6px 20px rgba(239, 68, 68, 0.45)',
            outline: isObsRecording ? '2px solid #ef4444' : 'none'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: isObsRecording ? '2px' : '50%',
            background: '#ffffff'
          }} className={isObsRecording ? 'animate-rec-pulse' : ''} />
          <span>{isObsRecording ? 'DỪNG QUAY OBS' : 'BẤM QUAY OBS NGAY'}</span>
        </button>

        {/* Play / Pause / Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onTogglePlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '14px',
              border: 'none',
              background: isPlaying
                ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'TẠM DỪNG' : 'CHẠY CHỮ NGAY'}</span>
          </button>

          <button
            onClick={handleResetScroll}
            title="Cuộn về đầu kịch bản"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#1e293b',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          ⌨️ <strong>Phím Space:</strong> Bật/Tắt chạy chữ | <strong>Lăn chuột:</strong> Tự cuộn nhanh
        </div>
      </div>

    </div>
  );
};
