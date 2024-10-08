import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../../contexts/performanceContext';
import { Governor } from '../../../utils/models';

export const AdvancedBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

  const governorIndexes: Array<number> = [];
  const governorTags: Array<string> = [];
  const governorLabels: NotchLabel[] = [];

  let notchIdx = 0;
  Object.entries(Governor)
    .filter(([key]) => !isNaN(Number(key)))
    .map(([key, value]) => {
      governorIndexes.push(Number(key));
      governorTags.push(String(value));

      governorLabels.push({
        notchIndex: notchIdx,
        value: notchIdx,
        label: Translator.translate('governor.' + String(value).toLocaleLowerCase())
      });
      notchIdx++;
    });

  const onGovernorChange = (newVal: number): void => {
    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        governor: newVal
      }
    };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  const onCpuBoostChange = (newVal: boolean): void => {
    const newProf = { ...profile, cpu: { ...profile.cpu, boost: newVal } };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  const onSmtChange = (newVal: boolean): void => {
    const newProf = { ...profile, cpu: { ...profile.cpu, smt: newVal } };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <ToggleField
          label="SMT"
          description={Translator.translate('smt.description')}
          checked={profile.cpu.smt}
          onChange={onSmtChange}
          highlightOnFocus
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="CPU Boost"
          description={Translator.translate('cpu.boost.description')}
          checked={profile.cpu.boost}
          onChange={onCpuBoostChange}
          highlightOnFocus
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label={Translator.translate('cpu.governor')}
          value={profile.cpu.governor}
          min={0}
          max={governorLabels.length - 1}
          step={1}
          notchCount={governorLabels.length}
          notchLabels={governorLabels}
          notchTicksVisible={true}
          showValue={false}
          bottomSeparator={'none'}
          onChange={onGovernorChange}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
