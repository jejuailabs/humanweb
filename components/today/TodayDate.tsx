"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";

// "오늘" = 사용자 기기 현지 날짜 (07_I18N_THEME.md). 서버에서는 비워 두고 브라우저에서 채운다
const noop = () => () => {};

export function TodayDate() {
  const locale = useLocale();
  const label = useSyncExternalStore(
    noop,
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date()),
    () => "",
  );
  return <span className="min-h-[1.2em] font-display text-3xl text-text">{label}</span>;
}
