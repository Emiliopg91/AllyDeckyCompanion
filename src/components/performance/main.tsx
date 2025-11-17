import { FC, useContext } from 'react';

import { PerformanceContext } from '../../contexts/performanceContext';
import { CpuImpl, Mode } from '../../utils/models';
import { WhiteBoardUtils } from '../../utils/whiteboard';
import { CpuBlock } from './cpu/main';
import { GpuBlock } from './gpuBlock';
import { HeaderBlock } from './headerBlock';
import { ModeBlock } from './modeBlock';

export const PerformanceBlock: FC = () => {
  const { profile } = useContext(PerformanceContext);

  return (
    <>
      <HeaderBlock />
      <ModeBlock />
      {(profile.mode == Mode.CUSTOM || WhiteBoardUtils.getCpuImpl() == CpuImpl.RYZENADJ) && (
        <>
          <CpuBlock />
          <GpuBlock />
        </>
      )}
    </>
  );
};
