import type { GatheringStatus } from '@/lib/supabase/database.types';

export function formatCommunityDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTimeInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function parseDateTimeInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) throw new Error('날짜는 YYYY-MM-DD HH:mm 형식으로 입력해 주세요.');
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new Error('현재보다 이후 날짜와 시간을 선택해 주세요.');
  }
  return date.toISOString();
}

export function gatheringStatusLabel(status: GatheringStatus) {
  const labels: Record<GatheringStatus, string> = {
    pending_review: '검토 중',
    open: '모집 중',
    full: '마감',
    closed: '종료',
    canceled: '취소',
  };
  return labels[status];
}
