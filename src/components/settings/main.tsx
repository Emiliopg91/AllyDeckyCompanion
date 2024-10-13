import { FC } from 'react';

import { HardwareBlock } from './hardwareBlock';
import { ProfilesBlock } from './profilesBlock';

export const SettingsBlock: FC = () => {
  return (
    <>
      <HardwareBlock />
      <ProfilesBlock />
    </>
  );
};
