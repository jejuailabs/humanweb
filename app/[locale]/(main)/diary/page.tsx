import { TodaySwitch } from "@/components/layout/TodaySwitch";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export default function Page() {
  return (
    <>
      <TodaySwitch />
      <PagePlaceholder page="diary" />
    </>
  );
}
