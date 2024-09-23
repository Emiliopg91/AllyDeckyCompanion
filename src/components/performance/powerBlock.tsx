import {
  NotchLabel,
  PanelSection,
  PanelSectionRow,
  SliderField,
} from "@decky/ui";
import { FC, useContext } from "react";

import { PerformanceContext } from "../../contexts/performanceContext";
import { WhiteBoardUtils } from "../../utils/whiteboard";
import { Translator } from "decky-plugin-framework";

export const PowerBlock: FC = () => {
  const notchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  WhiteBoardUtils.getAvailableGovernors().forEach((value: string) => {
    notchLabels.push({
      notchIndex: notchIdx,
      value: notchIdx,
      label: value,
    });
    notchIdx++;
  });

  const { id, name, profile, setProfile, saveProfile } =
    useContext(PerformanceContext);

  const onGovernorChange = (newVal: number): void => {
    const newProf = {
      ...profile,
      cpu: {
        ...profile.cpu,
        governor: WhiteBoardUtils.getAvailableGovernors()[newVal],
      },
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
                label={Translator.translate("cpu.governor")}
                value={WhiteBoardUtils.getAvailableGovernors().indexOf(
                  profile.cpu.governor,
                )}
                min={0}
                max={notchLabels.length - 1}
                step={1}
                notchCount={notchLabels.length}
                notchLabels={notchLabels}
                notchTicksVisible={true}
                showValue={false}
                bottomSeparator={"none"}
                onChange={onGovernorChange}
              />
            </PanelSectionRow>
          </PanelSection>
        </>
      )}
    </>
  );
};
