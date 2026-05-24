import { Settings as SettingsIcon } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SettingsNav from "@/components/settings/SettingsNav";

export const metadata = { title: "Settings — SnapFix" };

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin"
        icon={SettingsIcon}
        title="Organisation settings"
        pitch="Profile · brand · decisions · rates · presets"
      />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
