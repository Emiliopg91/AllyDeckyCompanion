import { ButtonItem, PanelSection, PanelSectionRow, Router, ToggleField } from '@decky/ui';
import { Toast, Translator } from 'decky-plugin-framework';
import { FC, useContext, useState } from 'react';

import { GlobalContext } from '../../contexts/globalContext';
import { Profiles } from '../../settings/profiles';
import { SystemSettings } from '../../settings/system';
import { Constants } from '../../utils/constants';
import { WhiteBoardUtils } from '../../utils/whiteboard';

export const ProfilesBlock: FC = () => {
  const { profilePerGame, setProfilePerGame } = useContext(GlobalContext);
  const [isDoingThings, setIsDoingThings] = useState(false);

  const onProfilePerGameChange = (newVal: boolean): void => {
    SystemSettings.setProfilePerGame(newVal);

    if (newVal) {
      WhiteBoardUtils.getRunningGameId() == Router.MainRunningApp?.appid
        ? Router.MainRunningApp?.appid +
          (WhiteBoardUtils.getOnBattery() ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
        : WhiteBoardUtils.getOnBattery()
          ? Constants.DEFAULT_ID
          : Constants.DEFAULT_ID_AC;
    } else {
      WhiteBoardUtils.setRunningGameId(
        WhiteBoardUtils.getOnBattery() ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC
      );
    }

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
      {WhiteBoardUtils.getSdtdpSettingsPresent() && (
        <PanelSectionRow>
          <ButtonItem
            onClick={() => {
              Toast.toast(Translator.translate('import.sdtdp.settings.in.progress'));
              setIsDoingThings(true);
              Profiles.importFromSDTDP().then(() => {
                setIsDoingThings(false);
                Toast.toast(Translator.translate('import.sdtdp.settings.finished'));
              });
            }}
            disabled={isDoingThings}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {Translator.translate('import.sdtdp.settings')}
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
