"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Gate, Loading } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { api, useApi } from "@/lib/client/api";

// AI 기억 보기 · 개별 삭제 · 전체 삭제
export function MemoryView() {
  const t = useTranslations("pages.memory");
  return (
    <div className="flex flex-col gap-5">
      <BackHeader href="/chat" title={t("title")} />
      <Gate>{() => <MemoryInner />}</Gate>
    </div>
  );
}

function MemoryInner() {
  const t = useTranslations("pages.memory");
  const tc = useTranslations("common");
  const { data, isLoading, mutate } = useApi<{ items: { id: string; text: string }[] }>("/api/memory");
  if (isLoading) return <Loading />;
  const items = data?.items ?? [];

  async function remove(id?: string) {
    if (!id && !confirm(t("deleteAllConfirm"))) return;
    await api("/api/memory", { method: "DELETE", json: id ? { id } : {} });
    mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t("desc")}</p>
      {items.length === 0 ? (
        <GlassCard className="py-8 text-center text-sm text-muted">{t("empty")}</GlassCard>
      ) : (
        <>
          <GlassCard className="flex flex-col divide-y divide-border !py-2">
            {items.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <span className="flex-1 text-sm text-text">{m.text}</span>
                <button type="button" onClick={() => remove(m.id)} aria-label={tc("delete")} className="text-muted hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </GlassCard>
          <button type="button" onClick={() => remove()} className={BUTTON_CLASS.ghost}>{t("deleteAll")}</button>
        </>
      )}
    </div>
  );
}
