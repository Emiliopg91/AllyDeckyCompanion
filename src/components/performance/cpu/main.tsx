import { FC } from 'react';

import { AdvancedBlock } from './advancedBlock';
import { TdpBlock } from './tdpBlock';

export const CpuBlock: FC = () => {
  return (
    <>
      <TdpBlock />
      <AdvancedBlock />
    </>
  );
};
