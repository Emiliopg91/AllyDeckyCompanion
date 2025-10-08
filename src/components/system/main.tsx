import { FC } from 'react';

import { BiosBlock } from './biosBlock';

/*import { BootBlock } from './bootBlock';*/
import { PluginBlock } from './pluginBlock';

export const SystemBlock: FC = () => {
  return (
    <>
      {/* <BootBlock /> */}
      <BiosBlock />
      <PluginBlock />
    </>
  );
};
