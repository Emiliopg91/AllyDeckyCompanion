import { NotchLabel, PanelSection, PanelSectionRow, SliderField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useState } from 'react';

import { SystemSettings } from '../../settings/system';

export const HardwareBlock: FC = () => {
  const batLimitIndexes: Array<number> = [100, 95, 90, 85, 80];
  const batLimitTags: Array<string> = [];
  const batLimitNotchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  batLimitIndexes.forEach((idx) => {
    batLimitTags.push(String(idx) + '%');
    batLimitNotchLabels.push({
      notchIndex: notchIdx,
      value: notchIdx,
      label: String(idx) + '%'
    });
    notchIdx++;
  });

  const [limitBattery, setLimitBattery] = useState(
    batLimitIndexes.indexOf(SystemSettings.getLimitBattery())
  );

  const onLimitBatteryChange = (newVal: number): void => {
    SystemSettings.setLimitBattery(batLimitIndexes[newVal]);
    setLimitBattery(newVal);
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <SliderField
          value={limitBattery}
          min={0}
          max={batLimitIndexes.length - 1}
          step={1}
          label={Translator.translate('limit.battery')}
          description={Translator.translate('limit.battery.desc')}
          notchCount={batLimitTags.length}
          notchLabels={batLimitNotchLabels}
          notchTicksVisible={true}
          showValue={false}
          bottomSeparator={'none'}
          onChange={onLimitBatteryChange}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
