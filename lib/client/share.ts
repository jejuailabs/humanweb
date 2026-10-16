"use client";

import { track } from "@/lib/firebase/client";

// 공유 카드 이미지를 받아 공유 시트로 보내고, 안 되면 파일로 저장
export async function shareCard(params: { kind: "fortune" | "diary"; lang: string; date: string; text: string; score?: number }) {
  const q = new URLSearchParams({ kind: params.kind, lang: params.lang, date: params.date, text: params.text });
  if (params.score !== undefined) q.set("score", String(params.score));
  const blob = await (await fetch(`/api/share-card?${q}`)).blob();
  const file = new File([blob], `yeon-${params.kind}-${params.date}.png`, { type: "image/png" });
  track("share_card", { kind: params.kind });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "YEON" });
      return;
    } catch {
      // 사용자가 취소하면 저장으로 넘어가지 않는다
      return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
