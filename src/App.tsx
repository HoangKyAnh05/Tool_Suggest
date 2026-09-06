import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { TimelineCuePrompter } from './components/TimelineCuePrompter';
import { SmoothTeleprompter } from './components/SmoothTeleprompter';
import { ObsModal } from './components/ObsModal';
import { MobileQrModal } from './components/MobileQrModal';
import { FloatingHud } from './components/FloatingHud';
import { VideoReviewModal } from './components/VideoReviewModal';

import { obsService } from './services/obsService';
import { remoteClient } from './services/remoteClient';
import { PRESET_SCRIPTS } from './utils/scriptPacing';
import type { ObsConnectionConfig, ObsState, PrompterMode, RemoteHubInfo, ScriptProject } from './types';

export function App() {
  const isHudMode = window.location.hash === '#hud';

  // Core State
  const [project, setProject] = useState<ScriptProject>(PRESET_SCRIPTS[0]);
  const [mode, setMode] = useState<PrompterMode>('timeline');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentCueIndex, setCurrentCueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Video Review State
  const [isVideoReviewOpen, setIsVideoReviewOpen] = useState<boolean>(false);

  // OBS State
  const [obsState, setObsState] = useState<ObsState>(obsService.state);

  // iPhone Remote Hub State
  const [remoteInfo, setRemoteInfo] = useState<RemoteHubInfo>(remoteClient.info);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Modals & Window Controls
  const [isObsModalOpen, setIsObsModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false);
  const [isFloatingHudActive, setIsFloatingHudActive] = useState<boolean>(false);

  // Layout View State: 'split' or 'focus'
  const [isFocusStage, setIsFocusStage] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const prevObsRecordingRef = useRef<boolean>(false);

  // Generate QR Code for Mobile Remote
  const updateQrCode = useCallback(async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 240,
        color: { dark: '#090d16', light: '#ffffff' }
      });
      setQrCodeUrl(dataUrl);
    } catch (e) {
      console.error('Error generating QR code:', e);
    }
  }, []);

  // Initialize OBS and Remote Hub listeners
  useEffect(() => {
    const unsubObs = obsService.subscribe((state) => {
      setObsState(state);

      // 2-Way Sync: If OBS started recording externally, auto-start prompter!
      if (state.recording && !prevObsRecordingRef.current) {
        setIsPlaying(true);
      } else if (!state.recording && prevObsRecordingRef.current) {
        setIsPlaying(false);
      }
      prevObsRecordingRef.current = state.recording;
    });

    // Auto-connect to OBS on start
    obsService.connect();

    // Check remote info
    remoteClient.fetchInfo().then(info => {
      setRemoteInfo(info);
      if (info.mobileUrl) {
        updateQrCode(info.mobileUrl);
      }
    });

    const unsubMobileCount = remoteClient.onMobileCountChange((count) => {
      setRemoteInfo(prev => ({ ...prev, mobileCount: count }));
    });

    // Check Electron window state
    if (window.electronAPI?.onFloatingHudClosed) {
      window.electronAPI.onFloatingHudClosed(() => {
        setIsFloatingHudActive(false);
      });
    }

    return () => {
      unsubObs();
      unsubMobileCount();
    };
  }, [updateQrCode]);

  // Handle Commands sent from iPhone Remote
  useEffect(() => {
    const unsubCmd = remoteClient.onCommand((msg) => {
      switch (msg.command) {
        case 'toggle_play':
          handleTogglePlay();
          break;
        case 'next_cue':
          handleNextCue();
          break;
        case 'prev_cue':
          handlePrevCue();
          break;
        case 'reset':
          handleReset();
          break;
        case 'toggle_obs_record':
          handleToggleObsRecord();
          break;
        case 'speed_up':
          setProject(p => ({ ...p, wpm: Math.min(240, p.wpm + 10) }));
          break;
        case 'speed_down':
          setProject(p => ({ ...p, wpm: Math.max(70, p.wpm - 10) }));
          break;
        case 'countdown_321':
          handleTriggerCountdown();
          break;
      }
    });

    return () => {
      unsubCmd();
    };
  });

  // Master Clock Timer Loop
  useEffect(() => {
    if (isPlaying) {
      const interval = 100; // 100ms resolution
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          const totalSec = project.totalSeconds || 60;
          if (next >= totalSec) {
            // Reached end of script
            setIsPlaying(false);
            return totalSec;
          }
          return next;
        });
      }, interval);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, project.totalSeconds]);

  // Sync active cue index based on current time
  useEffect(() => {
    if (project.cues.length === 0) return;
    const foundIndex = project.cues.findIndex(
      (c) => currentTime >= c.startSecond && currentTime < c.endSecond
    );
    if (foundIndex !== -1 && foundIndex !== currentCueIndex) {
      setCurrentCueIndex(foundIndex);
    }
  }, [currentTime, project.cues, currentCueIndex]);

  // Broadcast state updates to iPhone Remote Hub
  useEffect(() => {
    const activeCue = project.cues[currentCueIndex] || null;
    const nextCue = project.cues[currentCueIndex + 1] || null;

    remoteClient.syncState({
      isPlaying,
      currentTime,
      currentCueIndex,
      totalCues: project.cues.length,
      activeCue,
      nextCue,
      wpm: project.wpm,
      mode,
      isObsConnected: obsState.connected,
      isObsRecording: obsState.recording,
      isObsStreaming: obsState.streaming,
      obsRecordTimecode: obsState.recordTimecode,
      cues: project.cues,
      scriptTitle: project.title,
      fullText: project.rawText
    });
  }, [isPlaying, currentTime, currentCueIndex, project, mode, obsState]);

  // Handlers
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleNextCue = useCallback(() => {
    if (currentCueIndex < project.cues.length - 1) {
      const nextIdx = currentCueIndex + 1;
      setCurrentCueIndex(nextIdx);
      setCurrentTime(project.cues[nextIdx].startSecond);
    }
  }, [currentCueIndex, project.cues]);

  const handlePrevCue = useCallback(() => {
    if (currentCueIndex > 0) {
      const prevIdx = currentCueIndex - 1;
      setCurrentCueIndex(prevIdx);
      setCurrentTime(project.cues[prevIdx].startSecond);
    }
  }, [currentCueIndex, project.cues]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentCueIndex(0);
  }, []);

  const handleToggleObsRecord = useCallback(async () => {
    if (!obsState.connected) {
      setIsObsModalOpen(true);
      return;
    }
    try {
      await obsService.toggleRecord();
    } catch (e) {
      console.error('Failed to toggle OBS record:', e);
    }
  }, [obsState.connected]);

  const handleTriggerCountdown = useCallback(() => {
    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          // Start OBS record & prompter
          if (obsState.connected && !obsState.recording) {
            obsService.startRecord().catch(console.error);
          }
          setIsPlaying(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [obsState.connected, obsState.recording]);

  const handleToggleAlwaysOnTop = useCallback(async () => {
    const nextFlag = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextFlag);
    if (window.electronAPI?.setAlwaysOnTop) {
      await window.electronAPI.setAlwaysOnTop(nextFlag);
    }
  }, [isAlwaysOnTop]);

  const handleToggleFloatingHud = useCallback(async () => {
    if (window.electronAPI?.toggleFloatingHud) {
      const active = await window.electronAPI.toggleFloatingHud();
      setIsFloatingHudActive(active);
    } else {
      // Fallback in web preview: open popout window
      window.open('#hud', 'StreamCue_HUD', 'width=650,height=180,top=50,left=300');
      setIsFloatingHudActive(true);
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCue();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCue();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        handleToggleObsRecord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleNextCue, handlePrevCue, handleReset, handleToggleObsRecord]);

  // If in Floating HUD Mode (#hud in URL)
  if (isHudMode) {
    return (
      <FloatingHud
        cues={project.cues}
        currentCueIndex={currentCueIndex}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isObsRecording={obsState.recording}
        obsRecordTimecode={obsState.recordTimecode}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#090d16',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <Header
        mode={mode}
        setMode={setMode}
        obsState={obsState}
        onOpenObsModal={() => setIsObsModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenVideoReview={() => setIsVideoReviewOpen(true)}
        mobileCount={remoteInfo.mobileCount}
        isAlwaysOnTop={isAlwaysOnTop}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
        onToggleFloatingHud={handleToggleFloatingHud}
        isFloatingHudActive={isFloatingHudActive}
      />

      {/* Main Studio Body Workspace */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isFocusStage ? '1fr' : '450px 1fr',
        gap: '20px',
        padding: '16px 20px 20px 20px',
        overflow: 'hidden'
      }}>
        
        {/* Left Column: Script Editor & AI Auto-Slice (Hidden in full focus stage) */}
        {!isFocusStage && (
          <section style={{ height: '100%', overflow: 'hidden' }}>
            <ScriptEditor
              project={project}
              onChangeProject={setProject}
              onApplyToStage={() => setIsFocusStage(true)}
            />
          </section>
        )}

        {/* Right Column: Stage Prompter (Timeline vs Smooth Teleprompter) */}
        <section style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          
          {/* Quick toggle to show/hide Script Editor */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            zIndex: 30
          }}>
            <button
              onClick={() => setIsFocusStage(!isFocusStage)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '5px 12px',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isFocusStage ? '📑 Hiện Bảng Soạn Kịch Bản' : '🎯 Toàn Màn Hình Quay'}
            </button>
          </div>

          {mode === 'timeline' ? (
            <TimelineCuePrompter
              cues={project.cues}
              currentCueIndex={currentCueIndex}
              currentTime={currentTime}
              totalTime={project.totalSeconds}
              isPlaying={isPlaying}
              countdown={countdown}
              isObsRecording={obsState.recording}
              onTogglePlay={handleTogglePlay}
              onNextCue={handleNextCue}
              onPrevCue={handlePrevCue}
              onReset={handleReset}
              onTriggerCountdown={handleTriggerCountdown}
              onToggleObsRecord={handleToggleObsRecord}
            />
          ) : (
            <SmoothTeleprompter
              cues={project.cues}
              rawText={project.rawText}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              isObsRecording={obsState.recording}
              onToggleObsRecord={handleToggleObsRecord}
              wpm={project.wpm}
              onChangeWpm={(wpm) => setProject({ ...project, wpm })}
            />
          )}
        </section>

      </main>

      {/* OBS Configuration Modal */}
      <ObsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        obsState={obsState}
        onConnect={(cfg) => obsService.connect(cfg)}
        onDisconnect={() => obsService.disconnect()}
      />

      {/* iPhone Remote QR Code Modal */}
      <MobileQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        remoteInfo={remoteInfo}
        qrCodeUrl={qrCodeUrl}
      />

      {/* Instant Video Review Player Modal */}
      <VideoReviewModal
        isOpen={isVideoReviewOpen}
        onClose={() => setIsVideoReviewOpen(false)}
        onRetake={() => {
          handleReset();
          handleTriggerCountdown();
        }}
      />

    </div>
  );
}

export default App;
