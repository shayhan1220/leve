import type { LoveDnaProfile } from '@/lib/supabase/database.types';

export const axisLabels = {
  S: '연애 속도',
  D: '관계 방향',
  A: '마음의 거리',
  V: '가치관',
  M: '성향',
} as const;

export const clanPresentation: Record<
  LoveDnaProfile['clan'],
  { korean: string; tagline: string; description: string }
> = {
  Explorer: {
    korean: '탐험가',
    tagline: '새로운 가능성을 함께 여는 사람',
    description: '관계 속에서도 호기심을 잃지 않는 당신. 함께 경험하고 성장하는 연결에 끌려요.',
  },
  Dreamer: {
    korean: '몽상가',
    tagline: '감정의 깊이를 좇는 사람',
    description: '새로운 감정과 가능성에 설레는 당신. 깊은 정서적 교감을 가장 소중히 여겨요.',
  },
  Thinker: {
    korean: '사색가',
    tagline: '진솔한 대화로 가까워지는 사람',
    description: '서로의 생각을 깊이 이해할 때 마음이 열리는 당신. 선명하고 진실한 대화를 원해요.',
  },
  Caregiver: {
    korean: '돌봄가',
    tagline: '다정한 안정감을 건네는 사람',
    description: '작은 마음까지 세심하게 살피는 당신. 서로 기대고 돌보는 따뜻한 관계를 만들어요.',
  },
  Protector: {
    korean: '수호자',
    tagline: '믿음으로 관계를 지키는 사람',
    description:
      '한번 맺은 인연을 소중히 지키는 당신. 신뢰와 책임이 쌓이는 관계에서 편안함을 느껴요.',
  },
  Builder: {
    korean: '설계자',
    tagline: '균형 잡힌 관계를 함께 만드는 사람',
    description: '감정과 현실 사이의 균형을 찾는 당신. 서로 맞춰가며 단단해지는 관계를 원해요.',
  },
};

export function displayLoveDnaCode(profile: LoveDnaProfile) {
  const axes = [
    ['S', profile.axis_s],
    ['D', profile.axis_d],
    ['A', profile.axis_a],
    ['V', profile.axis_v],
    ['M', profile.axis_m],
  ] as const;
  return axes.map(([axis, value]) => `${axis}${Math.round(Number(value) / 10)}`).join(' ');
}
