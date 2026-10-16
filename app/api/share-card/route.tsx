import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// 공유 카드 (01_FEATURES.md F. 공유 카드 P1): 오늘의 운세 / 한 줄 일기를 1080×1920 스토리 이미지로
// 이미지 렌더러는 CSS 변수를 읽지 못해 app/globals.css의 다크 토큰 값을 그대로 옮겨 쓴다
const TOKEN = {
  bg: "#0b0e1a",
  bgDeep: "#070914",
  text: "#eceaf6",
  muted: "#9a97b5",
  gold: "#e8c468",
  primary: "#8b7cf6",
  nebula: "rgba(110, 80, 200, 0.35)",
};

// 한글 글꼴: 카드에 들어갈 글자만 잘라 받는다 (Google Fonts text 파라미터)
async function loadFont(family: string, weight: number, text: string) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("font not found");
  return (await fetch(url)).arrayBuffer();
}

const clip = (v: string | null, max: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = routing.locales.includes(url.searchParams.get("lang") as "ko") ? (url.searchParams.get("lang") as "ko" | "en") : "ko";
  const kind = url.searchParams.get("kind") === "diary" ? "diary" : "fortune";
  const date = clip(url.searchParams.get("date"), 10).replace(/[^\d-]/g, "");
  const text = clip(url.searchParams.get("text"), 120);
  const scoreRaw = Number(url.searchParams.get("score"));
  const score = Number.isFinite(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 100 ? Math.round(scoreRaw) : null;

  const t = await getTranslations({ locale: lang, namespace: "shareCard" });
  const caption = kind === "fortune" ? t("fortune") : t("diary");
  const glyphs = `YEON${caption}${text}${date}${score ?? ""}${t("footer")}/100`;
  const [serif, sans] = await Promise.all([loadFont("Noto+Serif+KR", 600, glyphs), loadFont("Noto+Sans+KR", 400, glyphs)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "140px 100px",
          color: TOKEN.text,
          backgroundColor: TOKEN.bg,
          backgroundImage: `radial-gradient(circle at 80% 10%, ${TOKEN.nebula}, transparent 45%), radial-gradient(circle at 10% 70%, ${TOKEN.nebula}, transparent 40%), linear-gradient(180deg, ${TOKEN.bg}, ${TOKEN.bgDeep})`,
          fontFamily: "Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: 72, letterSpacing: 24, color: TOKEN.text }}>YEON</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 34, letterSpacing: 10, color: TOKEN.muted }}>{date}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", fontSize: 36, letterSpacing: 14, color: TOKEN.gold }}>{caption}</div>
          {score !== null && (
            <div
              style={{
                marginTop: 60,
                width: 460,
                height: 460,
                borderRadius: 9999,
                border: `6px solid ${TOKEN.gold}`,
                boxShadow: `0 0 80px ${TOKEN.gold}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: 200, color: TOKEN.gold, lineHeight: 1 }}>{score}</div>
              <div style={{ display: "flex", fontSize: 40, color: TOKEN.muted }}>/100</div>
            </div>
          )}
          <div style={{ display: "flex", marginTop: 80, fontFamily: "Serif", fontSize: kind === "diary" ? 76 : 60, lineHeight: 1.45, maxWidth: 860 }}>
            {kind === "diary" ? `“${text}”` : text}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: TOKEN.primary }}>{t("footer")}</div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: "Serif", data: serif, weight: 600, style: "normal" },
        { name: "Sans", data: sans, weight: 400, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
