import { Field, PanelSection, PanelSectionRow } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';
import { FaBatteryFull, FaSteamSquare } from 'react-icons/fa';
import { PiPlugFill } from 'react-icons/pi';

import { PerformanceContext } from '../../contexts/performanceContext';
import { Constants } from '../../utils/constants';

export const HeaderBlock: FC = () => {
  const { onBattery, name, icon } = useContext(PerformanceContext);

  return (
    <PanelSection>
      <PanelSectionRow>
        <Field label={Translator.translate('profile.for')} bottomSeparator="standard">
          {onBattery && <FaBatteryFull />}
          {!onBattery && <PiPlugFill />}
          {name != Constants.DEFAULT_DEFAULT && icon && (
            <>
              <span> </span>
              <img
                style={{
                  maxWidth: 16,
                  maxHeight: 16,
                  border: '1px solid gray'
                }}
                src={icon}
              />
            </>
          )}
          {name == Constants.DEFAULT_DEFAULT && <FaSteamSquare />}
          <span> </span>
          {name}
        </Field>
      </PanelSectionRow>
    </PanelSection>
  );
};
