import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Wand2, 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText, 
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';
import type { ScriptCue, ScriptProject } from '../types';
import { 
  autoSliceScriptToCues, 
  countWords, 
  estimateDurationSeconds, 
  formatTimecode, 
  PRESET_SCRIPTS 
} from '../utils/scriptPacing';

interface ScriptEditorProps {
  project: ScriptProject;
  onChangeProject: (updated: ScriptProject) => void;
  onApplyToStage: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  project,
  onChangeProject,
  onApplyToStage
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'cues'>('text');
  const [rawInput, setRawInput] = useState(project.rawText);
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const wordCount = countWords(rawInput);
  const estimatedSeconds = estimateDurationSeconds(rawInput, project.wpm);

  const handleSlice = (targetSeconds?: number, targetPlatform: ScriptProject['targetPlatform'] = 'custom') => {
    const cues = autoSliceScriptToCues(rawInput, targetSeconds, project.wpm);
    const totalSec = cues.length > 0 ? cues[cues.length - 1].endSecond : 0;

    onChangeProject({
      ...project,
      rawText: rawInput,
      cues,
      totalSeconds: totalSec,
      targetPlatform,
      updatedAt: Date.now()
    });
    setActiveTab('cues');
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SCRIPTS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setRawInput(preset.rawText);
    onChangeProject({
      ...preset,
      updatedAt: Date.now()
    });
    setActiveTab('cues');
  };

  const handleUpdateCueDuration = (index: number, delta: number) => {
    const cues = [...project.cues];
    if (!cues[index]) return;

    const newDur = Math.max(2, cues[index].durationSeconds + delta);
    cues[index].durationSeconds = newDur;

    // Recalculate start and end times for all subsequent cues
    let currentStart = 0;
    cues.forEach(c => {
      c.startSecond = currentStart;
      c.endSecond = currentStart + c.durationSeconds;
      currentStart = c.endSecond;
    });

    onChangeProject({
      ...project,
      cues,
      totalSeconds: cues[cues.length - 1].endSecond,
      updatedAt: Date.now()
    });
  };

  const handleUpdateCueText = (index: number, newText: string) => {
    const cues = [...project.cues];
    if (!cues[index]) return;
    cues[index].text = newText;
    onChangeProject({
      ...project,
      cues,
      updatedAt: Date.now()
    });
  };

  const handleDeleteCue = (index: number) => {
    const cues = project.cues.filter((_, i) => i !== index);
    let currentStart = 0;
    cues.forEach((c, idx) => {
      c.order = idx + 1;
      c.startSecond = currentStart;
      c.endSecond = currentStart + c.durationSeconds;
      currentStart = c.endSecond;
    });

    onChangeProject({
      ...project,
      cues,
      totalSeconds: cues.length > 0 ? cues[cues.length - 1].endSecond : 0,
      updatedAt: Date.now()
    });
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Top Bar: Title & Stats */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} color="#38bdf8" />
          <input
            type="text"
            value={project.title}
            onChange={(e) => onChangeProject({ ...project, title: e.target.value })}
            placeholder="Tên kịch bản..."
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid transparent',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              outline: 'none',
              width: '260px'
            }}
          />
        </div>

        {/* Stats Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>
            Tổng từ: <strong style={{ color: '#f8fafc' }}>{wordCount}</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            Thời lượng dự kiến: <strong style={{ color: '#38bdf8' }}>{formatTimecode(project.totalSeconds || estimatedSeconds)}</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            Số câu/cảnh: <strong style={{ color: '#10b981' }}>{project.cues.length}</strong>
          </span>
        </div>
      </div>

      {/* Preset & AI Auto-Slice Quick Toolbar */}
      <div style={{
        padding: '12px 20px',
        background: '#0a101d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* Preset selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={14} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Mẫu có sẵn:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handleLoadPreset(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Chọn kịch bản chuẩn mẫu --</option>
            {PRESET_SCRIPTS.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* AI Auto-Slice Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} /> AI Phân Chia Giây:
          </span>

          <button
            onClick={() => handleSlice(30, 'tiktok_30s')}
            title="Tự động cân bằng thời lượng đúng 30 giây chuẩn TikTok"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚡ TikTok 30s
          </button>

          <button
            onClick={() => handleSlice(60, 'shorts_60s')}
            title="Tự động cân bằng thời lượng đúng 60 giây chuẩn Shorts/Reels"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚡ Shorts 60s
          </button>

          <button
            onClick={() => handleSlice(180, 'standard_3m')}
            title="Tự động cân bằng thời lượng 3 phút video bán hàng / livestream"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚡ Video 3 Phút
          </button>

          <button
            onClick={() => handleSlice(undefined, 'custom')}
            title="Tự động chia theo dấu chấm câu và tốc độ nói WPM tự nhiên"
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🎯 Tự Nhiên (Theo WPM)
          </button>
        </div>
      </div>

      {/* Editor Subtabs */}
      <div style={{
        display: 'flex',
        padding: '8px 20px 0 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.3)'
      }}>
        <button
          onClick={() => setActiveTab('text')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'text' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'text' ? '#38bdf8' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📝 Nhập Nội Dung Thô
        </button>
        <button
          onClick={() => setActiveTab('cues')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'cues' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'cues' ? '#38bdf8' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⏱️ Danh Sách Phân Đoạn Giây ({project.cues.length})
        </button>
      </div>

      {/* Body Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {activeTab === 'text' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Dán hoặc gõ toàn bộ kịch bản tại đây... Sau đó bấm nút 'AI Phân Chia Giây' ở trên để hệ thống tự chia từng câu ứng với giây máy quay tới!"
              style={{
                flex: 1,
                width: '100%',
                minHeight: '260px',
                background: '#070b12',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: '#f8fafc',
                fontSize: '15px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleSlice(60, 'shorts_60s')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Wand2 size={16} />
                <span>Tạo Phân Cảnh & Chia Giây Ngay</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {project.cues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '15px', marginBottom: '12px' }}>Chưa có phân đoạn giây nào được tạo.</p>
                <button
                  onClick={() => handleSlice(60, 'shorts_60s')}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Nhấn vào đây để AI tự động chia từ nội dung
                </button>
              </div>
            ) : (
              project.cues.map((cue, index) => (
                <div
                  key={cue.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#0d1525',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px'
                  }}
                >
                  {/* Time Badge */}
                  <div style={{
                    minWidth: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#131e33',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 8px'
                  }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                      CÂU {cue.order}
                    </span>
                    <span className="font-mono-num" style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      {formatTimecode(cue.startSecond)} → {formatTimecode(cue.endSecond)}
                    </span>
                  </div>

                  {/* Text Edit Input */}
                  <input
                    type="text"
                    value={cue.text}
                    onChange={(e) => handleUpdateCueText(index, e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '6px 4px',
                      outline: 'none'
                    }}
                  />

                  {/* Duration Adjuster */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', borderRadius: '8px', padding: '4px 8px' }}>
                    <button
                      onClick={() => handleUpdateCueDuration(index, -1)}
                      title="Giảm 1 giây"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#334155',
                        color: 'white',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <span className="font-mono-num" style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', minWidth: '32px', textAlign: 'center' }}>
                      {cue.durationSeconds}s
                    </span>
                    <button
                      onClick={() => handleUpdateCueDuration(index, 1)}
                      title="Tăng 1 giây"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#334155',
                        color: 'white',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteCue(index)}
                    title="Xóa câu này"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      opacity: 0.6,
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          💡 Nhấn <strong>"Lên Sàn Quay"</strong> để kích hoạt bộ nhắc chữ và tay cầm điều khiển.
        </div>
        <button
          onClick={onApplyToStage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 22px',
            color: 'white',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          <span>Lên Sàn Quay Ngay</span>
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
};
