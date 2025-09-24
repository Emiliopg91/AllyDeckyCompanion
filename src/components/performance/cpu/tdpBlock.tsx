import { PanelSection, PanelSectionRow, SliderField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext, useEffect } from 'react';

import { PerformanceContext } from '../../../contexts/performanceContext';

export const TdpBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile, tdpRange } = useContext(PerformanceContext);

  useEffect(() => {}, [id]);

  const onSplChange = (newVal: number): void => {
    newVal = Math.min(Math.max(newVal, tdpRange['spl'][0]), tdpRange['spl'][1]);
    const newSppl = Math.min(
      Math.max(newVal, profile.cpu.tdp.sppl, tdpRange['sppt'][0]),
      tdpRange['sppt'][1]
    );
    const newFppl = Math.min(Math.max(newVal, profile.cpu.tdp.fppl), tdpRange['fppt'][1]);

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
    newVal = Math.min(
      Math.max(newVal, profile.cpu.tdp.spl, tdpRange['sppt'][0]),
      tdpRange['sppt'][1]
    );
    const newFppl = Math.min(Math.max(newVal, profile.cpu.tdp.fppl), tdpRange['fppt'][1]);

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
    newVal = Math.min(
      Math.max(newVal, profile.cpu.tdp.sppl, tdpRange['fppt'][0]),
      tdpRange['fppt'][1]
    );
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
          min={0}
          max={tdpRange['fppt'][1]}
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
          min={0}
          max={tdpRange['fppt'][1]}
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
          min={0}
          max={tdpRange['fppt'][1]}
          validValues="range"
          bottomSeparator="none"
          onChange={onFpplChange}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
