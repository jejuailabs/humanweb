// AI 생성이 끝내 실패했을 때 쓰는 예비 문장 풀 (절대 규칙 5). 점수 구간별로 시드에 따라 고른다
import { seeded } from "./scores";

const POOL = {
  ko: {
    high: [
      ["생각해 둔 일을 시작하기 좋은 날이에요.", "오늘은 흐름이 부드럽게 이어져요. 미뤄 둔 일을 하나 꺼내 가볍게 시작해 보세요. 작은 진전이 하루를 든든하게 만들어 줄 거예요."],
      ["주변과 마음이 잘 맞는 날이에요.", "대화가 자연스럽게 풀리는 하루예요. 먼저 안부를 건네 보면 반가운 이야기가 돌아올 수 있어요."],
      ["작은 용기가 좋은 기회로 이어지는 날이에요.", "평소보다 한 걸음만 더 나서 보세요. 망설이던 제안이나 질문이 생각보다 반갑게 받아들여질 수 있어요."],
    ],
    mid: [
      ["서두르기보다 한 번 더 확인하면 좋은 날이에요.", "큰 변화보다 정리와 점검이 잘 어울리는 하루예요. 할 일을 짧게 적어 두면 마음이 한결 가벼워져요."],
      ["나만의 속도를 지키면 편안한 날이에요.", "다른 사람의 속도에 맞추느라 지치지 않도록 해 보세요. 잠깐의 휴식이 오후의 집중을 도와줄 거예요."],
      ["익숙한 것에서 작은 즐거움을 찾는 날이에요.", "새로운 것보다 늘 하던 일 속에서 의미를 찾아보세요. 좋아하는 음악 한 곡이 기분을 바꿔 줄 수 있어요."],
    ],
    low: [
      ["오늘은 쉼표를 하나 찍어 두면 좋은 날이에요.", "에너지를 아껴 두는 것도 좋은 선택이에요. 중요한 결정은 하루 미뤄 두고, 스스로를 조금 더 챙겨 보세요."],
      ["천천히 가도 괜찮은 날이에요.", "모든 걸 오늘 끝내지 않아도 괜찮아요. 꼭 필요한 일 하나에만 집중해 보세요."],
      ["마음을 정리하기 좋은 조용한 날이에요.", "생각이 많을 땐 짧게 적어 보는 게 도움이 돼요. 한 줄 일기로 오늘을 남겨 보는 건 어때요?"],
    ],
  },
  en: {
    high: [
      ["A good day to start what you've been planning.", "Things flow smoothly today. Pick up one task you've been putting off and begin lightly — a small step will make the day feel solid."],
      ["A day when you click with the people around you.", "Conversations open up naturally today. Reach out first and you may hear something that makes you smile."],
      ["A little courage turns into a good opportunity.", "Take one step further than usual. A question or idea you've been holding back may be welcomed more warmly than you expect."],
    ],
    mid: [
      ["A day to double-check rather than rush.", "Organizing suits today better than big changes. Jot down your to-dos and your mind will feel lighter."],
      ["Keep your own pace and the day stays calm.", "Don't wear yourself out matching others' speed. A short break will help you focus later."],
      ["Find small joys in familiar things.", "Look for meaning in your usual routine today. One favorite song might lift your mood."],
    ],
    low: [
      ["A good day to pause and recharge.", "Saving your energy is a fine choice. Let big decisions wait a day and take a little extra care of yourself."],
      ["It's okay to go slowly today.", "You don't have to finish everything today. Focus on just the one thing that matters most."],
      ["A quiet day to sort out your thoughts.", "When your mind is busy, writing a few words helps. How about leaving today in a one-line diary?"],
    ],
  },
} as const;

export function backupText(lang: string, seed: string, total: number) {
  const pool = POOL[lang as keyof typeof POOL] ?? POOL.en;
  const band = total >= 75 ? pool.high : total >= 60 ? pool.mid : pool.low;
  const [summary, detail] = band[Math.floor(seeded(seed)() * band.length)];
  return { summary, detail };
}
