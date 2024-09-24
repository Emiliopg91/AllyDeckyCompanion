import { NotchLabel, PanelSection, PanelSectionRow, SliderField } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useContext } from 'react';

import { PerformanceContext } from '../../contexts/performanceContext';
import { Governor } from '../../utils/models';

export const PowerBlock: FC = () => {
  const modeIndexes: Array<number> = [];
  const modeTags: Array<string> = [];
  const notchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  Object.entries(Governor)
    .filter(([key]) => !isNaN(Number(key)))
    .map(([key, value]) => {
      modeIndexes.push(Number(key));
      modeTags.push(String(value));

      notchLabels.push({
        notchIndex: notchIdx,
        value: notchIdx,
        label: Translator.translate('governor.' + String(value).toLocaleLowerCase())
      });
      notchIdx++;
    });

  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext);

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

  return (
    <>
      {profile.mode == 3 && (
        <>
          <PanelSection>
            <PanelSectionRow>
              <SliderField
                label={Translator.translate('cpu.governor')}
                value={profile.cpu.governor}
                min={0}
                max={notchLabels.length - 1}
                step={1}
                notchCount={notchLabels.length}
                notchLabels={notchLabels}
                notchTicksVisible={true}
                showValue={false}
                bottomSeparator={'none'}
                onChange={onGovernorChange}
              />
            </PanelSectionRow>
          </PanelSection>
        </>
      )}
    </>
  );
};
