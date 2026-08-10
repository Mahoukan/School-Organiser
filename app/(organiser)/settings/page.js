import AccountPanel from "../../../components/AccountPanel";
import SectionIntro from "../../../components/SectionIntro";
import DataBackupPanel from "../../../components/settings/DataBackupPanel";
import AppearancePanel from "../../../components/settings/AppearancePanel";

export default function SettingsPage() {
  return <><SectionIntro title="Settings" description="Manage application, account, and data preferences." /><AppearancePanel /><AccountPanel /><DataBackupPanel /></>;
}
