import "server-only";
import { z, type ZodType } from "zod";
import { findForbidden } from "@/lib/fortune/guard";
import { bumpAdminCounter } from "./metrics";

// 절대 규칙 4·5: AI 호출은 서버에서만, 출력은 JSON 스키마로 검증 후 사용
export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";

type Content = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
type Msg = { role: "system" | "user" | "assistant"; content: Content };

async function callOpenAI(messages: Msg[], jsonSchema?: { name: string; schema: object }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      ...(jsonSchema && {
        response_format: { type: "json_schema", json_schema: { name: jsonSchema.name, schema: jsonSchema.schema, strict: false } },
      }),
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? "");
}

// JSON 응답 + zod 검증 + 금지어 검사. 실패하면 재시도(기본 2회), 그래도 실패하면 throw → 호출부가 예비 문장 사용
export async function aiJson<T>(opts: {
  feature: "daily" | "report" | "chat" | "palm" | "face" | "name" | "tojeong" | "memory";
  name: string;
  schema: ZodType<T>;
  system: string;
  user: Content;
  lang: string;
  retries?: number;
}): Promise<T> {
  const jsonSchema = z.toJSONSchema(opts.schema) as object;
  let lastError: unknown;
  for (let attempt = 0; attempt <= (opts.retries ?? 2); attempt++) {
    try {
      await bumpAdminCounter(`ai_${opts.feature}`);
      const raw = await callOpenAI(
        [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        { name: opts.name, schema: jsonSchema },
      );
      const parsed = opts.schema.parse(JSON.parse(raw));
      const bad = findForbidden(JSON.stringify(parsed), opts.lang);
      if (bad) throw new Error(`forbidden word: ${bad}`);
      return parsed;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

// 대화용 자유 문장 응답 (금지어 검사만)
export async function aiText(opts: { system: string; messages: Msg[]; lang: string }) {
  await bumpAdminCounter("ai_chat");
  const text = await callOpenAI([{ role: "system", content: opts.system }, ...opts.messages]);
  return { text, forbidden: findForbidden(text, opts.lang) };
}

// 모든 프롬프트에 넣는 용어집 (00_OVERVIEW.md)
export const GLOSSARY = `사주(Four Pillars, Saju) / 일간(Day Master) / 일진(Daily Pillar) / 오행(Five Elements: 목 Wood, 화 Fire, 토 Earth, 금 Metal, 수 Water) / 십신(Ten Gods) / 토정비결(Tojeong Bigyeol) / 띠(Chinese Zodiac Animal) / 스탯(Stat) / 신뢰도(Completeness) / 한 줄 일기(One-line Diary) / 인연선(Connection Line)`;

export const TONE_RULES = (lang: string) =>
  lang === "ko"
    ? `존댓말. 따뜻하고 담백하게, "나를 잘 아는 친구 같은 상담가" 말투. 조언형·제안형으로 쓰고 단정하지 않는다.
금지: 죽음·사고·질병·수명·"흉하다"·"불길하다" 등 공포를 주는 표현, 투자 결과·건강 예언, 중요한 결정을 대신 내리는 말.`
    : `Warm, calm, friendly counselor tone. Suggest rather than predict. Never mention death, accidents, illness, lifespan, "ominous" or fearful certainty; never predict health or investment outcomes or make big life decisions for the user.`;
