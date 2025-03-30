import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { debounce } from 'lodash';
import { FC, useCallback, useState } from 'react';

import { SystemSettings } from '../../settings/system';

const saveBatterySettings = debounce((newVal: number): void => {
  SystemSettings.setLimitBattery(newVal);
}, 500);
const saveMcuPowersave = debounce((newVal: boolean): void => {
  SystemSettings.setMcuPowersave(newVal);
}, 500);
export const HardwareBlock: FC = () => {
  const min = 60;
  const max = 100;
  const step = 5;

  const batLimitNotchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  for (let i = min; i <= max; i = i + step) {
    const label = i == max || i == min ? String(i) + '%' : '';
    batLimitNotchLabels.push({
      notchIndex: notchIdx,
      value: notchIdx,
      label
    });
    notchIdx++;
  }

  const [limitBattery, setLimitBattery] = useState(SystemSettings.getLimitBattery());
  const onLimitBatteryChange = useCallback((newVal: number) => {
    setLimitBattery(newVal);
    saveBatterySettings(newVal);
  }, []);

  const [mcuPowersave, setMcuPowersave] = useState(SystemSettings.getMcuPowersave());
  const onMcuPowersaveChange = useCallback((newVal: boolean) => {
    setMcuPowersave(newVal);
    saveMcuPowersave(newVal);
  }, []);

  return (
    <PanelSection>
      <PanelSectionRow>
        <SliderField
          value={limitBattery}
          min={min}
          max={max}
          step={5}
          label={Translator.translate('limit.battery')}
          description={Translator.translate('limit.battery.desc')}
          notchCount={batLimitNotchLabels.length}
          notchLabels={batLimitNotchLabels}
          notchTicksVisible={true}
          showValue
          valueSuffix="%"
          bottomSeparator={'none'}
          onChange={onLimitBatteryChange}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label={Translator.translate('mcu.powersave')}
          description={Translator.translate('mcu.powersave.desc')}
          checked={mcuPowersave}
          onChange={onMcuPowersaveChange}
          highlightOnFocus
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
