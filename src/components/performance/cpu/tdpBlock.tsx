import { PanelSection, PanelSectionRow, SliderField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../../contexts/performanceContext';

export const TdpBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

  const onSplChange = (newVal: number): void => {
    const newSppl = newVal > profile.cpu.tdp.sppl ? newVal : profile.cpu.tdp.sppl;
    const newFppl = newVal > profile.cpu.tdp.fppl ? newVal : profile.cpu.tdp.fppl;

    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        tdp: { spl: newVal, sppl: newSppl, fppl: newFppl }
      }
    };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  const onSpplChange = (newVal: number): void => {
    if (newVal < profile.cpu.tdp.spl) newVal = profile.cpu.tdp.spl;
    const newFppl = newVal > profile.cpu.tdp.fppl ? newVal : profile.cpu.tdp.fppl;

    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        tdp: { ...profile.cpu.tdp, sppl: newVal, fppl: newFppl }
      }
    };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  const onFpplChange = (newVal: number): void => {
    if (newVal < profile.cpu.tdp.sppl) newVal = profile.cpu.tdp.sppl;

    const newProf = {
      ...profile,
      cpu: { ...profile.cpu, tdp: { ...profile.cpu.tdp, fppl: newVal } }
    };
    saveProfile(id, name, newProf);
    setProfile(newProf);
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <SliderField
          label={Translator.translate('spl.desc')}
          value={profile.cpu.tdp.spl}
          showValue
          step={1}
          valueSuffix="W"
          min={5}
          max={30}
          validValues="range"
          bottomSeparator="none"
          onChange={onSplChange}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label={Translator.translate('sppl.desc')}
          value={profile.cpu.tdp.sppl}
          showValue
          step={1}
          valueSuffix="W"
          min={5}
          max={30}
          validValues="range"
          bottomSeparator="none"
          onChange={onSpplChange}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label={Translator.translate('fppl.desc')}
          value={profile.cpu.tdp.fppl}
          showValue
          step={1}
          valueSuffix="W"
          min={5}
          max={30}
          validValues="range"
          bottomSeparator="none"
          onChange={onFpplChange}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
