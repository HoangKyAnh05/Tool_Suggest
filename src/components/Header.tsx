import React from 'react';
import { 
  Tv, 
  Radio, 
  Smartphone, 
  Clock, 
  ScrollText, 
  ExternalLink, 
  Pin, 
  Settings,
  Sparkles,
  Layers,
  Film
} from 'lucide-react';
import type { ObsState, PrompterMode } from '../types';

interface HeaderProps {
  mode: PrompterMode;
  setMode: (mode: PrompterMode) => void;
  obsState: ObsState;
  onOpenObsModal: () => void;
  onOpenQrModal: () => void;
  onOpenVideoReview: () => void;
  mobileCount: number;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
  onToggleFloatingHud: () => void;
  isFloatingHudActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  obsState,
  onOpenObsModal,
  onOpenQrModal,
  onOpenVideoReview,
  mobileCount,
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  onToggleFloatingHud,
  isFloatingHudActive
}) => {
  return (
    <header className="glass-panel" style={{ margin: '16px 20px 0 20px', padding: '12px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
          }}>
            <Tv size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
                StreamCue
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '6px',
                letterSpacing: '0.5px'
              }}>
                STUDIO PRO
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Kịch Bản Theo Giây & Trợ Lý OBS Studio
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: '#090d16',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setMode('timeline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'timeline' ? '#2563eb' : 'transparent',
              color: mode === 'timeline' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'timeline' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            <Clock size={15} />
            <span>Nhắc Theo Giây</span>
          </button>
          
          <button
            onClick={() => setMode('teleprompter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'teleprompter' ? '#2563eb' : 'transparent',
              color: mode === 'teleprompter' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: mode === 'teleprompter' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
            }}
          >
            <ScrollText size={15} />
            <span>Teleprompter Chạy Chữ</span>
          </button>
        </div>

        {/* Studio Integrations & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* OBS Studio Status Indicator */}
          <button
            onClick={onOpenObsModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: obsState.recording 
                ? '1px solid #ef4444' 
                : obsState.connected 
                  ? '1px solid rgba(16, 185, 129, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
              background: obsState.recording 
                ? 'rgba(239, 68, 68, 0.2)' 
                : obsState.connected 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : '#1e293b',
              color: obsState.recording ? '#ff4d4f' : obsState.connected ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            {obsState.recording ? (
              <>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} className="animate-rec-pulse" />
                <span>OBS REC: {obsState.recordTimecode}</span>
              </>
            ) : obsState.connected ? (
              <>
                <Radio size={14} color="#10b981" />
                <span>OBS ĐÃ KẾT NỐI</span>
              </>
            ) : (
              <>
                <Radio size={14} color="#64748b" />
                <span>KẾT NỐI OBS STUDIO</span>
              </>
            )}
            <Settings size={13} style={{ opacity: 0.6 }} />
          </button>

          {/* Quick Review Recorded Video */}
          <button
            onClick={onOpenVideoReview}
            title="Xem lại video vừa quay trong thư mục E:\OBSVID"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ff4d4f',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Film size={14} />
            <span>Xem Lại Video</span>
          </button>

          {/* iPhone Remote Hub Button */}
          <button
            onClick={onOpenQrModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: mobileCount > 0 ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: mobileCount > 0 ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
              color: mobileCount > 0 ? '#38bdf8' : '#cbd5e1',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Smartphone size={15} />
            <span>iPhone Remote</span>
            {mobileCount > 0 ? (
              <span style={{
                background: '#38bdf8',
                color: '#090d16',
                borderRadius: '9999px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 900
              }}>
                {mobileCount}
              </span>
            ) : (
              <span style={{ fontSize: '11px', opacity: 0.7 }}>Mã QR</span>
            )}
          </button>

          {/* Floating HUD toggle */}
          <button
            onClick={onToggleFloatingHud}
            title="Mở cửa sổ nổi sát webcam"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: isFloatingHudActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: isFloatingHudActive ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              color: isFloatingHudActive ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={16} />
          </button>

          {/* Pin Always on top */}
          <button
            onClick={onToggleAlwaysOnTop}
            title={isAlwaysOnTop ? 'Đang ghim trên cùng' : 'Ghim cửa sổ trên cùng'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: isAlwaysOnTop ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
              background: isAlwaysOnTop ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
              color: isAlwaysOnTop ? '#f59e0b' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Pin size={16} />
          </button>

        </div>
      </div>
    </header>
  );
};
