import { NotchLabel, PanelSection, PanelSectionRow, SliderField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../contexts/performanceContext';
import { Mode } from '../../utils/models';

export const ModeBlock: FC = () => {
  const modeIndexes: Array<number> = [];
  const modeTags: Array<string> = [];
  const notchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  Object.entries(Mode)
    .filter(([key]) => !isNaN(Number(key))) // Filtra los valores numéricos
    .map(([key, value]) => {
      modeIndexes.push(Number(key));
      modeTags.push(String(value));

      notchLabels.push({
        notchIndex: notchIdx,
        value: notchIdx,
        label: Translator.translate('mode.' + String(value))
      });
      notchIdx++;
    });

  const { onBattery, id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

  const onModeChange = (newVal: number): void => {
    const newProf = { ...profile, mode: newVal };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <SliderField
          value={profile.mode}
          min={0}
          max={modeIndexes.length - 1}
          step={1}
          notchCount={modeTags.length}
          notchLabels={notchLabels}
          notchTicksVisible={true}
          showValue={false}
          bottomSeparator={'none'}
          onChange={onModeChange}
          disabled={!onBattery}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
