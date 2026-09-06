import type { ScriptCue, ScriptProject } from '../types';

/**
 * Tốc độ nói tiếng Việt chuẩn:
 * - Chậm & Rõ ràng (Đào tạo / Diễn thuyết): 120 wpm (2 từ/giây)
 * - Tự nhiên / Vừa phải (Review / Vấn đáp): 140 wpm (2.33 từ/giây)
 * - Nhanh & Năng lượng (TikTok / Bán hàng): 160-180 wpm (2.8 từ/giây)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateDurationSeconds(text: string, wpm = 135): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.ceil((words / wpm) * 60);
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function autoSliceScriptToCues(
  rawText: string,
  targetDurationSeconds?: number,
  wpm = 135
): ScriptCue[] {
  if (!rawText.trim()) return [];

  // Split by newlines or punctuation marks
  const rawSegments = rawText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (rawSegments.length === 0) return [];

  const initialCues: { text: string; words: number }[] = [];

  for (const seg of rawSegments) {
    const lines = seg.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 0) {
        initialCues.push({
          text: line,
          words: countWords(line),
        });
      }
    }
  }

  const totalWords = initialCues.reduce((acc, c) => acc + c.words, 0);

  // If a fixed target duration is specified (e.g. 30s or 60s), scale time proportionally
  const effectiveTotalSeconds = targetDurationSeconds && targetDurationSeconds > 0
    ? targetDurationSeconds
    : Math.max(10, Math.ceil((totalWords / wpm) * 60));

  let currentStart = 0;
  const cues: ScriptCue[] = [];

  initialCues.forEach((item, index) => {
    let duration: number;
    if (targetDurationSeconds && targetDurationSeconds > 0 && totalWords > 0) {
      // Proportional distribution
      duration = Math.max(3, Math.round((item.words / totalWords) * effectiveTotalSeconds));
    } else {
      // Natural cadence based on WPM
      duration = Math.max(3, Math.ceil((item.words / wpm) * 60));
    }

    const startSecond = currentStart;
    const endSecond = startSecond + duration;
    currentStart = endSecond;

    cues.push({
      id: `cue-${Date.now()}-${index}`,
      order: index + 1,
      text: item.text,
      startSecond,
      endSecond,
      durationSeconds: duration,
      sectionTitle: index === 0 ? 'Mở đầu (Hook)' : index === initialCues.length - 1 ? 'Kêu gọi hành động (CTA)' : `Phần ${index + 1}`
    });
  });

  return cues;
}

export const PRESET_SCRIPTS: ScriptProject[] = [
  {
    id: 'preset-tiktok-60s',
    title: '🔥 TikTok Review Công Nghệ 60s (Giữ chân người xem)',
    targetPlatform: 'shorts_60s',
    totalSeconds: 60,
    wpm: 140,
    updatedAt: Date.now(),
    rawText: `Dừng lại 3 giây! Đừng bao giờ quay video nếu bạn chưa biết bí quyết này.
Hầu hết mọi người khi quay video bằng OBS hay điện thoại đều gặp lỗi mắt đảo liên tục vì nhìn kịch bản.
Kết quả là video trông thiếu tự nhiên và người xem sẽ lướt qua ngay sau 5 giây đầu.
Nhưng với giải pháp Teleprompter thông minh này, kịch bản sẽ tự cuộn sát mép camera theo đúng từng giây bạn nói.
Đặc biệt, bạn chỉ cần cầm chiếc iPhone là có thể bấm quay OBS từ xa mà không cần chạm vào chuột máy tính!
Hãy bấm lưu video này lại và dùng thử ngay hôm nay để nâng cấp chất lượng video của bạn lên chuẩn chuyên nghiệp!`,
    cues: [
      {
        id: 'c1',
        order: 1,
        sectionTitle: 'Mở đầu (Hook 3s)',
        text: 'Dừng lại 3 giây! Đừng bao giờ quay video nếu bạn chưa biết bí quyết này.',
        startSecond: 0,
        endSecond: 8,
        durationSeconds: 8
      },
      {
        id: 'c2',
        order: 2,
        sectionTitle: 'Nỗi đau (Vấn đề mắt đảo)',
        text: 'Hầu hết mọi người khi quay video bằng OBS hay điện thoại đều gặp lỗi mắt đảo liên tục vì nhìn kịch bản.',
        startSecond: 8,
        endSecond: 18,
        durationSeconds: 10
      },
      {
        id: 'c3',
        order: 3,
        sectionTitle: 'Hậu quả (Mất người xem)',
        text: 'Kết quả là video trông thiếu tự nhiên và người xem sẽ lướt qua ngay sau 5 giây đầu.',
        startSecond: 18,
        endSecond: 28,
        durationSeconds: 10
      },
      {
        id: 'c4',
        order: 4,
        sectionTitle: 'Giải pháp (Chạy chữ sát camera)',
        text: 'Nhưng với giải pháp Teleprompter thông minh này, kịch bản sẽ tự cuộn sát mép camera theo đúng từng giây bạn nói.',
        startSecond: 28,
        endSecond: 42,
        durationSeconds: 14
      },
      {
        id: 'c5',
        order: 5,
        sectionTitle: 'Tính năng độc bản (iPhone Remote OBS)',
        text: 'Đặc biệt, bạn chỉ cần cầm chiếc iPhone là có thể bấm quay OBS từ xa mà không cần chạm vào chuột máy tính!',
        startSecond: 42,
        endSecond: 52,
        durationSeconds: 10
      },
      {
        id: 'c6',
        order: 6,
        sectionTitle: 'Kêu gọi hành động (CTA)',
        text: 'Hãy bấm lưu video này lại và dùng thử ngay hôm nay để nâng cấp chất lượng video của bạn lên chuẩn chuyên nghiệp!',
        startSecond: 52,
        endSecond: 60,
        durationSeconds: 8
      }
    ]
  },
  {
    id: 'preset-livestream-sales',
    title: '🛒 Livestream Bán Hàng & Chốt Deal Đỉnh Cao',
    targetPlatform: 'standard_3m',
    totalSeconds: 180,
    wpm: 150,
    updatedAt: Date.now(),
    rawText: `Chào mừng tất cả các anh chị em đã có mặt trong phiên Livestream đặc biệt hôm nay!
Hôm nay em mang đến một ưu đãi chưa từng có: Chỉ duy nhất 20 suất quà đặc biệt cho ai nhanh tay nhất!
Hãy nhìn vào tính năng vượt trội này: Toàn bộ quy trình điều khiển quay hình, nhắc chữ kịch bản đều tự động hóa 100%.
Anh chị không còn lo quên bài, không sợ nói vấp, chỉ cần tự tin tỏa sáng trước ống kính.
Em vừa ghim deal ở góc trái màn hình, chỉ còn đúng 5 phút để nhận mã giảm 50%!
Ai đã đặt thành công hãy bình luận số 1 để em tặng thêm quà độc quyền ngay trên sóng nhé!`,
    cues: [
      {
        id: 'ls-1',
        order: 1,
        sectionTitle: 'Khai màn Livestream',
        text: 'Chào mừng tất cả các anh chị em đã có mặt trong phiên Livestream đặc biệt hôm nay!',
        startSecond: 0,
        endSecond: 15,
        durationSeconds: 15
      },
      {
        id: 'ls-2',
        order: 2,
        sectionTitle: 'Tung Deal Giới Hạn',
        text: 'Hôm nay em mang đến một ưu đãi chưa từng có: Chỉ duy nhất 20 suất quà đặc biệt cho ai nhanh tay nhất!',
        startSecond: 15,
        endSecond: 45,
        durationSeconds: 30
      },
      {
        id: 'ls-3',
        order: 3,
        sectionTitle: 'Demo Tính Năng Đắt Giá',
        text: 'Hãy nhìn vào tính năng vượt trội này: Toàn bộ quy trình điều khiển quay hình, nhắc chữ kịch bản đều tự động hóa 100%.',
        startSecond: 45,
        endSecond: 90,
        durationSeconds: 45
      },
      {
        id: 'ls-4',
        order: 4,
        sectionTitle: 'Lợi Ích Thực Tế',
        text: 'Anh chị không còn lo quên bài, không sợ nói vấp, chỉ cần tự tin tỏa sáng trước ống kính.',
        startSecond: 90,
        endSecond: 125,
        durationSeconds: 35
      },
      {
        id: 'ls-5',
        order: 5,
        sectionTitle: 'Đếm Lùi Chốt Đơn',
        text: 'Em vừa ghim deal ở góc trái màn hình, chỉ còn đúng 5 phút để nhận mã giảm 50%!',
        startSecond: 125,
        endSecond: 155,
        durationSeconds: 30
      },
      {
        id: 'ls-6',
        order: 6,
        sectionTitle: 'Tương Tác & Tặng Quà',
        text: 'Ai đã đặt thành công hãy bình luận số 1 để em tặng thêm quà độc quyền ngay trên sóng nhé!',
        startSecond: 155,
        endSecond: 180,
        durationSeconds: 25
      }
    ]
  }
];
