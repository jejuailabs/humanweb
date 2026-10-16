import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { analyzeName } from "@/lib/name";
import { aiJson, GLOSSARY, TONE_RULES } from "@/lib/server/ai";
import { handler, json, parseBody, requireUser } from "@/lib/server/http";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { loadUser, recomputeStats, userRef } from "@/lib/server/profile";
import { generateReport } from "@/lib/server/report";

export const maxDuration = 60;

const bodySchema = z.object({
  surname: z.string().regex(/^[가-힣]{1,2}$/),
  given: z.string().regex(/^[가-힣]{1,3}$/),
});
const textSchema = z.object({
  title: z.string().min(2).max(40),
  summary: z.string().min(20),
  points: z.array(z.string().min(5)).min(2).max(4),
});

// 이름 풀이: 발음오행·획수 4격은 코드로 계산 (절대 규칙 1)
// 절대 규칙 9: 이름 원문은 저장하지 않고 AI에도 보내지 않는다. 계산 결과만 넘긴다
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { surname, given } = await parseBody(req, bodySchema);
  const result = analyzeName(surname, given);
  const { settings } = await loadUser(uid);
  const lang = settings.lang;

  const text = await aiJson({
    feature: "name",
    name: "name_reading",
    schema: textSchema,
    lang,
    retries: 1,
    system: `You interpret Korean name readings (성명학) for fun and self-reflection, not prediction. Write in ${lang === "ko" ? "Korean" : "English"}.\n${TONE_RULES(lang)}\nGlossary: ${GLOSSARY}`,
    user: `The name itself is private and not given. Computed results (JSON): ${JSON.stringify({
      characters: result.chars,
      soundElementsInOrder: result.soundElements,
      elementRatio: result.elements,
      flowBetweenChars: result.flow,
      strokeGrids: result.grids,
    })}
- soundElements: Five Elements of each syllable's initial sound (surname first). flow: generate = mutually supportive, control = tension, same = same element.
- strokeGrids: 원격(won, youth), 형격(hyeong, young adult), 이격(i, middle years), 정격(jeong, overall) stroke sums.
Write: title (short phrase), summary (3-4 sentences about the name's energy and personality tendencies), points (2-4 short observations; phrase tension as balance tips, never as bad luck).
Do not label any number or element as unlucky.`,
  });

  await userRef(uid)
    .collection("analyses")
    .doc("name")
    .set({ ...result, ...text, lang, updatedAt: FieldValue.serverTimestamp() });
  await bumpAdminCounter("analysis_name");
  await recomputeStats(uid);
  after(() => generateReport(uid).catch((e) => console.error("report", e)));
  return json({ ...result, ...text });
});
