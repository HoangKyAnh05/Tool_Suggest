import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, Wifi, Sparkles } from 'lucide-react';
import type { RemoteHubInfo } from '../types';

interface MobileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteInfo: RemoteHubInfo;
  qrCodeUrl: string;
}

export const MobileQrModal: React.FC<MobileQrModalProps> = ({
  isOpen,
  onClose,
  remoteInfo,
  qrCodeUrl
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (remoteInfo.mobileUrl) {
      navigator.clipboard.writeText(remoteInfo.mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
        maxWidth: '460px',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        textAlign: 'center'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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

        {/* Title */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 20px rgba(56, 189, 248, 0.35)'
        }}>
          <Smartphone size={28} color="#ffffff" />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
          Kết Nối Điều Khiển Bằng iPhone
        </h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
          Biến chiếc iPhone thành <strong>Tay Cầm Bấm Quay OBS</strong> và <strong>Kính Nhắc Chữ Bỏ Túi</strong>
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          display: 'inline-block',
          margin: '0 auto 18px auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}>
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Mã QR kết nối iPhone"
              style={{ width: '200px', height: '200px', display: 'block' }}
            />
          ) : (
            <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#090d16' }}>
              Đang tạo mã QR...
            </div>
          )}
        </div>

        {/* Connected devices badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: remoteInfo.mobileCount > 0 ? 'rgba(16, 185, 129, 0.15)' : '#131b2e',
          color: remoteInfo.mobileCount > 0 ? '#10b981' : '#94a3b8',
          border: remoteInfo.mobileCount > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          padding: '6px 16px',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: remoteInfo.mobileCount > 0 ? '#10b981' : '#64748b'
          }} />
          <span>{remoteInfo.mobileCount} thiết bị iPhone đang kết nối</span>
        </div>

        {/* URL Box & Copy */}
        <div style={{
          background: '#090d16',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {remoteInfo.mobileUrl || 'http://localhost:49200/remote'}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : '#1e293b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        {/* Step by step */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          textAlign: 'left',
          fontSize: '11px',
          color: '#cbd5e1',
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wifi size={14} color="#38bdf8" /> Hướng dẫn kết nối nhanh:
          </div>
          1. Đảm bảo iPhone và máy tính kết nối <strong>cùng mạng Wi-Fi</strong>.<br />
          2. Mở ứng dụng <strong>Camera</strong> trên iPhone và hướng vào mã QR phía trên.<br />
          3. Chạm vào liên kết màu vàng hiển thị trên màn hình iPhone để mở bộ điều khiển!
        </div>

      </div>
    </div>
  );
};
