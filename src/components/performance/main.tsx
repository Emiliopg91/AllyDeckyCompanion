import { FC } from 'react';

import { PerformanceProvider } from '../../contexts/performanceContext';
import { CpuBlock } from './cpuBlock';
import { GpuBlock } from './gpuBlock';
import { HeaderBlock } from './headerBlock';
import { ModeBlock } from './modeBlock';
import { PowerBlock } from './powerBlock';

export const PerformanceBlock: FC = () => {
  return (
    <PerformanceProvider>
      <>
        <HeaderBlock />
        <ModeBlock />
        <CpuBlock />
        <PowerBlock />
        <GpuBlock />
      </>
    </PerformanceProvider>
  );
};
