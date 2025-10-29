import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../../contexts/performanceContext';
import { Epp } from '../../../utils/models';
import { WhiteBoardUtils } from '../../../utils/whiteboard';

export const AdvancedBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

  const scxLabels: NotchLabel[] = [];
  let scxNotchIdx = 0;
  scxLabels.push({
    notchIndex: scxNotchIdx,
    value: scxNotchIdx,
    label: Translator.translate('none')
  });
  scxNotchIdx++;
  let scxSelected = 0;
  WhiteBoardUtils.getSchedulers().map((value) => {
    scxLabels.push({
      notchIndex: scxNotchIdx,
      value: scxNotchIdx,
      label: String(value)
    });
    if (profile.cpu.scheduler == String(value)) scxSelected = scxNotchIdx;
    scxNotchIdx++;
  });

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

  const onScxChange = (newVal: number): void => {
    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        scheduler: newVal == 0 ? '' : WhiteBoardUtils.getSchedulers()[newVal - 1]
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
      {scxLabels.length > 0 && (
        <PanelSectionRow>
          <SliderField
            label={Translator.translate('cpu.scheduler')}
            value={scxSelected}
            min={0}
            max={scxLabels.length - 1}
            step={1}
            notchCount={scxLabels.length}
            notchLabels={scxLabels}
            notchTicksVisible={true}
            showValue={false}
            onChange={onScxChange}
          />
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ToggleField
          label={Translator.translate('cpu.boost')}
          description={Translator.translate('cpu.boost.description')}
          checked={profile.cpu.boost}
          onChange={onCpuBoostChange}
          bottomSeparator={'none'}
          highlightOnFocus
        />
      </PanelSectionRow>
    </PanelSection>
  );
};
