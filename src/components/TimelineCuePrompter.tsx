import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Video, 
  Timer, 
  AlertCircle,
  Eye
} from 'lucide-react';
import type { ScriptCue } from '../types';
import { formatTimecode } from '../utils/scriptPacing';

interface TimelineCuePrompterProps {
  cues: ScriptCue[];
  currentCueIndex: number;
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  countdown: number | null;
  isObsRecording: boolean;
  onTogglePlay: () => void;
  onNextCue: () => void;
  onPrevCue: () => void;
  onReset: () => void;
  onTriggerCountdown: () => void;
  onToggleObsRecord: () => void;
}

export const TimelineCuePrompter: React.FC<TimelineCuePrompterProps> = ({
  cues,
  currentCueIndex,
  currentTime,
  totalTime,
  isPlaying,
  countdown,
  isObsRecording,
  onTogglePlay,
  onNextCue,
  onPrevCue,
  onReset,
  onTriggerCountdown,
  onToggleObsRecord
}) => {
  const currentCue = cues[currentCueIndex] || null;
  const nextCue = cues[currentCueIndex + 1] || null;

  // Cue specific countdown
  let cueRemaining = 0;
  let cueProgress = 0;
  if (currentCue) {
    const elapsedInCue = Math.max(0, currentTime - currentCue.startSecond);
    cueRemaining = Math.max(0, Math.ceil(currentCue.durationSeconds - elapsedInCue));
    cueProgress = Math.min(100, (elapsedInCue / currentCue.durationSeconds) * 100);
  }

  // Visual warning color based on remaining time in this cue
  const isDanger = cueRemaining <= 2 && cueRemaining > 0;
  const isWarning = cueRemaining <= 4 && cueRemaining > 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      
      {/* 3-2-1 Fullscreen / Overlay Countdown if active */}
      {countdown !== null && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(9, 13, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px'
        }}>
          <div style={{ fontSize: '20px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
            Chuẩn bị quay hình...
          </div>
          <div style={{
            fontSize: '120px',
            fontWeight: 900,
            color: '#ef4444',
            lineHeight: 1,
            textShadow: '0 0 40px rgba(239, 68, 68, 0.8)'
          }} className="animate-rec-pulse">
            {countdown === 0 ? 'REC!' : countdown}
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
            Mắt nhìn thẳng vào camera, tự tin hít thở sâu!
          </div>
        </div>
      )}

      {/* Main Focus Stage Box */}
      <div className="glass-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        border: isObsRecording ? '2px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isObsRecording ? '0 0 35px rgba(239, 68, 68, 0.2)' : 'none'
      }}>
        
        {/* Cue Progress & Timer Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: '#1e293b',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '8px'
            }}>
              CÂU {cues.length > 0 ? currentCueIndex + 1 : 0} / {cues.length}
            </span>
            <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>
              {currentCue?.sectionTitle || 'Nội dung'}
            </span>
          </div>

          {/* Master & Cue Timers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Thời Lượng Câu Này
              </div>
              <div className="font-mono-num" style={{
                fontSize: '22px',
                fontWeight: 900,
                color: isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8'
              }}>
                {cueRemaining}s <span style={{ fontSize: '14px', color: '#64748b' }}>/ {currentCue?.durationSeconds || 0}s</span>
              </div>
            </div>

            <div style={{
              height: '34px',
              width: '1px',
              background: 'rgba(255, 255, 255, 0.1)'
            }} />

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Đồng Hồ Tổng
              </div>
              <div className="font-mono-num" style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                {formatTimecode(currentTime)} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {formatTimecode(totalTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Cue Segment Progress Line */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${cueProgress}%`,
            height: '100%',
            background: isDanger 
              ? '#ef4444' 
              : isWarning 
                ? '#f59e0b' 
                : 'linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)',
            transition: 'width 0.1s linear'
          }} />
        </div>

        {/* GIANT FOCAL PROMPTER TEXT */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '12px 16px'
        }}>
          {currentCue ? (
            <div style={{
              fontSize: '34px',
              fontWeight: 800,
              lineHeight: 1.45,
              color: '#ffffff',
              letterSpacing: '-0.3px',
              textAlign: 'left',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}>
              {currentCue.text}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '18px' }}>
              Chưa có kịch bản. Vui lòng thêm câu hoặc chọn mẫu kịch bản ở tab bên trái.
            </div>
          )}
        </div>

        {/* PREVIEW NEXT CUE */}
        {nextCue && (
          <div style={{
            marginTop: 'auto',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Eye size={18} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>
                Chuẩn bị đọc tiếp theo [{formatTimecode(nextCue.startSecond)}]:
              </div>
              <div style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: 600, lineHeight: 1.4 }}>
                {nextCue.text}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Controller Dock */}
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

        {/* Prompter Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          <button
            onClick={onPrevCue}
            title="Câu trước đó (Mũi tên trái)"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#1e293b',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <SkipBack size={18} />
          </button>

          {/* Master Play / Pause */}
          <button
            onClick={onTogglePlay}
            title="Chạy / Tạm dừng (Phím Space)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
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
            <span>{isPlaying ? 'TẠM DỪNG' : 'CHẠY KỊCH BẢN'}</span>
          </button>

          <button
            onClick={onNextCue}
            title="Câu kế tiếp (Mũi tên phải)"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#1e293b',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <SkipForward size={18} />
          </button>

          <button
            onClick={onReset}
            title="Quay về 00:00 (Phím R)"
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

        {/* 3-2-1 Countdown Trigger */}
        <button
          onClick={onTriggerCountdown}
          title="Kích hoạt đếm ngược 3...2...1 trước khi quay"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Timer size={16} />
          <span>Đếm 3..2..1</span>
        </button>

      </div>

    </div>
  );
};
