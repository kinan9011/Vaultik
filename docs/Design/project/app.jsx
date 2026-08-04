/* App entry — composes all Vaultik screens into a design canvas */
const { DesignCanvas, DCSection, DCArtboard } = window;
const S = window.Screens;

const App = () => (
  <DesignCanvas
    title="Vaultik"
    subtitle="Encrypted backups, beautifully simple — full app design"
  >
    <DCSection
      id="onboarding"
      title="Onboarding"
      subtitle="The first 3 minutes — welcome, wizard, review"
    >
      <DCArtboard id="empty"   label="Welcome (no profiles)" width={1280} height={800}>
        <S.DashboardEmpty />
      </DCArtboard>
      <DCArtboard id="wiz-2"   label="Wizard · step 2 (storage)" width={1280} height={800}>
        <S.WizardStorage />
      </DCArtboard>
      <DCArtboard id="wiz-6"   label="Wizard · step 6 (review)" width={1280} height={800}>
        <S.WizardReview />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="core"
      title="Core app"
      subtitle="Dashboard, snapshots, history, editor, settings"
    >
      <DCArtboard id="dash"     label="Dashboard · live backup running" width={1280} height={800}>
        <S.Dashboard />
      </DCArtboard>
      <DCArtboard id="snaps"    label="Snapshot browser" width={1280} height={800}>
        <S.SnapshotBrowser />
      </DCArtboard>
      <DCArtboard id="history"  label="Run history" width={1280} height={800}>
        <S.RunHistory />
      </DCArtboard>
      <DCArtboard id="editor"   label="Profile editor · Repository panel" width={1280} height={800}>
        <S.ProfileEditor />
      </DCArtboard>
      <DCArtboard id="settings" label="Settings" width={1280} height={800}>
        <S.Settings />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
