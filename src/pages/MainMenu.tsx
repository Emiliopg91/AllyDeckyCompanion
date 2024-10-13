import { FC } from 'react';

import { ContributeBlock } from '../components/others/contributeBlock';
import { MenuBlock } from '../components/others/menuBlock';
import { WarningBlock } from '../components/others/warningBlock';
import { PerformanceBlock } from '../components/performance/main';
import { SettingsBlock } from '../components/settings/main';
import { SystemBlock } from '../components/system/main';
import { PerformanceProvider } from '../contexts/performanceContext';
import { WhiteBoardUtils } from '../utils/whiteboard';

export const MainMenu: FC = () => {
  return (
    <>
      <WarningBlock />
      <MenuBlock />
      {WhiteBoardUtils.getTab() === 'performance' && (
        <PerformanceProvider>
          <PerformanceBlock />
        </PerformanceProvider>
      )}
      {WhiteBoardUtils.getTab() === 'settings' && <SettingsBlock />}
      {WhiteBoardUtils.getTab() === 'system' && <SystemBlock />}
      <ContributeBlock />
    </>
  );
};
