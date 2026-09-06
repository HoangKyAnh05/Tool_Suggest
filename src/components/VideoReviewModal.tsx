import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle2, 
  FolderOpen, 
  RotateCcw, 
  Film, 
  HardDrive,
  Clock,
  Sparkles
} from 'lucide-react';

interface VideoInfo {
  exists: boolean;
  filename?: string;
  filePath?: string;
  sizeBytes?: number;
  sizeFormatted?: string;
  modifiedTime?: string;
}

interface VideoReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
}

export const VideoReviewModal: React.FC<VideoReviewModalProps> = ({
  isOpen,
  onClose,
  onRetake
}) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchVideoInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:49200/api/video/info');
      if (res.ok) {
        const data = await res.json();
        setVideoInfo(data);
        setCacheBuster(Date.now());
      }
    } catch (e) {
      console.error('Error fetching video info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVideoInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleDeleteAndRetake = async () => {
    if (window.confirm('Chủ tịch có chắc muốn xóa video take này để quay lại từ đầu không?')) {
      setIsDeleting(true);
      try {
        await fetch('http://localhost:49200/api/video/delete', { method: 'POST' });
      } catch (e) {
        console.error(e);
      } finally {
        setIsDeleting(false);
        onClose();
        onRetake(); // Resets timer and starts new take
      }
    }
  };

  const handleOpenFolder = async () => {
    try {
      if ((window as any).electronAPI?.openVideoFolder) {
        await (window as any).electronAPI.openVideoFolder();
      } else {
        await fetch('http://localhost:49200/api/video/open-folder');
      }
    } catch (e) {
      console.error(e);
      await fetch('http://localhost:49200/api/video/open-folder').catch(() => {});
    }
  };

  const streamUrl = `http://localhost:49200/api/video/stream?t=${cacheBuster}`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}>
              <Film size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Xem Lại Video Vừa Quay (Take Review)
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Kiểm tra hình ảnh, âm thanh và khẩu hình trước khi quyết định lưu hoặc quay lại
              </p>
            </div>
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

        {/* Video Player Screen */}
        <div style={{
          flex: 1,
          minHeight: '340px',
          maxHeight: '460px',
          background: '#000000',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '16px'
        }}>
          {isLoading ? (
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Đang nạp video vừa quay...</div>
          ) : videoInfo && videoInfo.exists ? (
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '460px',
                objectFit: 'contain',
                outline: 'none'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <Film size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '15px' }}>Chưa tìm thấy video nào vừa quay trong thư mục <strong>E:\OBSVID</strong></p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Hãy bấm nút <strong>"BẮT ĐẦU QUAY OBS"</strong> để ghi hình kịch bản đầu tiên!</p>
            </div>
          )}
        </div>

        {/* Video Metadata Pills */}
        {videoInfo && videoInfo.exists && (
          <div style={{
            background: '#090d16',
            borderRadius: '12px',
            padding: '10px 16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700 }}>
              <HardDrive size={14} />
              <span>{videoInfo.filename}</span>
            </div>
            <div style={{ color: '#94a3b8' }}>
              Dung lượng: <strong style={{ color: '#f8fafc' }}>{videoInfo.sizeFormatted}</strong>
            </div>
            <div style={{ color: '#94a3b8' }}>
              Thời gian: <strong style={{ color: '#f8fafc' }}>{videoInfo.modifiedTime}</strong>
            </div>
          </div>
        )}

        {/* Decision Actions Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          
          {/* Discard & Retake Button */}
          <button
            onClick={handleDeleteAndRetake}
            disabled={isDeleting || !videoInfo?.exists}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Đang xóa...' : 'Quay Lại Take Mới (Xóa File Này)'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Open Folder in Windows Explorer */}
            <button
              onClick={handleOpenFolder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: '#1e293b',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <FolderOpen size={16} />
              <span>Mở Thư Mục Ổ E</span>
            </button>

            {/* Accept & Keep Video Button */}
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>Đạt Chuẩn - Giữ Lại Video</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
