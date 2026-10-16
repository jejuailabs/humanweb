import { LANGS } from "@/lib/fortune/keys";
import { CATEGORIES } from "@/lib/fortune/scores";
import { getDaily } from "@/lib/server/daily";
import { json } from "@/lib/server/http";

export const maxDuration = 300;

// 매일 00:00 KST(15:00 UTC) Vercel Cron → 오늘·내일(D+1) 공용 운세 미리 생성 (04_DAILY_ENGINE.md)
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "forbidden" }, 403);
  }
  const kst = new Date(Date.now() + 9 * 3600000);
  const dates = [0, 1].map((d) => new Date(kst.getTime() + d * 86400000).toISOString().slice(0, 10));
  const results: Record<string, string> = {};
  for (const date of dates) {
    await Promise.all(
      LANGS.flatMap((lang) =>
        CATEGORIES.map(async (c) => {
          const doc = await getDaily(date, lang, c);
          results[`${date}_${lang}_${c}`] = doc.source;
        }),
      ),
    );
  }
  return json({ ok: true, results });
}
