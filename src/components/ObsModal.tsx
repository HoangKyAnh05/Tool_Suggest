import React, { useState } from 'react';
import { X, Radio, CheckCircle2, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import type { ObsConnectionConfig, ObsState } from '../types';

interface ObsModalProps {
  isOpen: boolean;
  onClose: () => void;
  obsState: ObsState;
  onConnect: (config: ObsConnectionConfig) => Promise<boolean>;
  onDisconnect: () => void;
}

export const ObsModal: React.FC<ObsModalProps> = ({
  isOpen,
  onClose,
  obsState,
  onConnect,
  onDisconnect
}) => {
  if (!isOpen) return null;

  const [host, setHost] = useState(obsState.config.host || '127.0.0.1');
  const [port, setPort] = useState(obsState.config.port || 4455);
  const [password, setPassword] = useState(obsState.config.password || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onConnect({ host, port: Number(port), password, autoConnect: true });
    setIsLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={22} color="#3b82f6" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              Cấu Hình OBS Studio (WebSocket v5)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Connection Status */}
        <div style={{
          background: obsState.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          border: obsState.connected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {obsState.connected ? (
            <>
              <CheckCircle2 size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  Đã kết nối thành công với OBS Studio!
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Sẵn sàng nhận lệnh Record/Stream 2 chiều từ App và iPhone.
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={20} color="#ef4444" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>
                  Chưa kết nối với OBS Studio
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {obsState.error || 'Vui lòng kiểm tra OBS Studio đã bật WebSocket Server.'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Địa chỉ IP (Host)
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="127.0.0.1"
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Cổng (Port)
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="4455"
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Mật khẩu WebSocket (Bỏ trống nếu không đặt)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {obsState.connected ? (
              <button
                type="button"
                onClick={onDisconnect}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Ngắt Kết Nối OBS
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                {isLoading ? 'Đang kết nối...' : 'Kết Nối OBS Ngay'}
              </button>
            )}
          </div>
        </form>

        {/* Helpful Tip */}
        <div style={{
          marginTop: '20px',
          background: '#090d16',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
          color: '#94a3b8',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={13} /> Cách bật WebSocket trên OBS Studio:
          </div>
          Vào OBS Studio → menu <strong>Công cụ (Tools)</strong> → <strong>Cài đặt máy chủ WebSocket (WebSocket Server Settings)</strong> → Tích chọn <strong>Bật máy chủ WebSocket</strong> (Cổng mặc định là 4455).
        </div>

      </div>
    </div>
  );
};
