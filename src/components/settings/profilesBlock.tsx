import { PanelSection, PanelSectionRow, ToggleField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { GlobalContext } from '../../contexts/globalContext';
import { SystemSettings } from '../../settings/system';

export const ProfilesBlock: FC = () => {
  const { profilePerGame, setProfilePerGame } = useContext(GlobalContext);

  const onProfilePerGameChange = (newVal: boolean): void => {
    SystemSettings.setProfilePerGame(newVal);
    setProfilePerGame(newVal);
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <ToggleField
          label={Translator.translate('profile.per.game')}
          description={Translator.translate('profile.per.game.desc')}
          checked={profilePerGame}
          onChange={onProfilePerGameChange}
          highlightOnFocus
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
