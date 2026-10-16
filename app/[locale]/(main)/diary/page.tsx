import { DiaryView } from "@/components/diary/DiaryView";
import { TodaySwitch } from "@/components/layout/TodaySwitch";

// 한 줄 일기장 (02_SCREENS.md 4)
export default function Page() {
  return (
    <div className="flex flex-col">
      <TodaySwitch />
      <DiaryView />
    </div>
  );
}
