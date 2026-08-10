import AccountPanel from "../../../components/AccountPanel";
import SectionIntro from "../../../components/SectionIntro";
import DataBackupPanel from "../../../components/settings/DataBackupPanel";

export default function SettingsPage() {
  return <><SectionIntro title="Settings" description="Manage application, account, and data preferences." /><AccountPanel /><DataBackupPanel /></>;
}
