import { FC } from 'react';

import { CpuImpl } from '../../../utils/models';
import { WhiteBoardUtils } from '../../../utils/whiteboard';
import { AdvancedBlock } from './advancedBlock';
import { TdpBlock } from './tdpBlock';

export const CpuBlock: FC = () => {
  return (
    <>
      {WhiteBoardUtils.getCpuImpl() != CpuImpl.RYZENADJ && <TdpBlock />}
      <AdvancedBlock />
    </>
  );
};
