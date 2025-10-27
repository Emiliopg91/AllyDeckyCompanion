import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../../contexts/performanceContext';
import { Epp } from '../../../utils/models';

export const AdvancedBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

  /*
  const governorLabels: NotchLabel[] = [];
  let governorNotchIdx = 0;
  Object.entries(Governor)
    .filter(([key]) => !isNaN(Number(key)))
    .map(([_, value]) => {
      governorLabels.push({
        notchIndex: governorNotchIdx,
        value: governorNotchIdx,
        label: Translator.translate('governor.' + String(value).toLocaleLowerCase())
      });
      governorNotchIdx++;
    });
  */

  const eppLabels: NotchLabel[] = [];
  let eppNotchIdx = 0;
  Object.entries(Epp)
    .filter(([key]) => !isNaN(Number(key)))
    .map(([_, value]) => {
      eppLabels.push({
        notchIndex: eppNotchIdx,
        value: eppNotchIdx,
        label: Translator.translate('epp.' + String(value).toLocaleLowerCase())
      });
      eppNotchIdx++;
    });

  /*
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
  };*/

  const onEppChange = (newVal: number): void => {
    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        epp: newVal
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
        <SliderField
          label={Translator.translate('cpu.epp')}
          value={profile.cpu.epp}
          min={0}
          max={eppLabels.length - 1}
          step={1}
          notchCount={eppLabels.length}
          notchLabels={eppLabels}
          notchTicksVisible={true}
          showValue={false}
          onChange={onEppChange}
        />
      </PanelSectionRow>
      {/*<PanelSectionRow>
        <ToggleField
          label="SMT"
          description={Translator.translate('smt.description')}
          checked={profile.cpu.smt}
          onChange={onSmtChange}
          highlightOnFocus
        />
      </PanelSectionRow>
      */}
      <PanelSectionRow>
        <ToggleField
          label="CPU Boost"
          description={Translator.translate('cpu.boost.description')}
          checked={profile.cpu.boost}
          onChange={onCpuBoostChange}
          bottomSeparator={'none'}
          highlightOnFocus
        />
      </PanelSectionRow>
      {/*<PanelSectionRow>
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
          onChange={onGovernorChange}
        />
      </PanelSectionRow>
      */}
    </PanelSection>
  );
};
