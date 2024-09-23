import { PanelSection, PanelSectionRow, SliderField } from "@decky/ui";
import { FC, useContext } from "react";

import { Translator } from "decky-plugin-framework";
import { PerformanceContext } from "../../contexts/performanceContext";
import { Profile } from "../../utils/models";
import { WhiteBoardUtils } from "../../utils/whiteboard";

export const GpuBlock: FC = () => {
  const { id, name, profile, setProfile, saveProfile } =
    useContext(PerformanceContext);

  const onMinFreqChange = (newVal: number): void => {
    if (newVal <= profile.gpu.frequency.max) {
      const newProf: Profile = {
        ...profile,
        gpu: {
          ...profile.gpu,
          frequency: { ...profile.gpu.frequency, min: newVal },
        },
      };
      saveProfile(id, name, newProf);
      setProfile(newProf);
    }
  };

  const onMaxFreqChange = (newVal: number): void => {
    if (newVal >= profile.gpu.frequency.min) {
      const newProf: Profile = {
        ...profile,
        gpu: {
          ...profile.gpu,
          frequency: { ...profile.gpu.frequency, max: newVal },
        },
      };
      saveProfile(id, name, newProf);
      setProfile(newProf);
    }
  };

  return (
    <PanelSection>
      {profile.mode == 3 && (
        <>
          <PanelSectionRow>
            <SliderField
              label={Translator.translate("gpu.min.freq")}
              value={profile.gpu.frequency.min}
              showValue
              step={100}
              valueSuffix=" MHz"
              min={WhiteBoardUtils.getGpuMinFreq()}
              max={WhiteBoardUtils.getGpuMaxFreq()}
              validValues="range"
              bottomSeparator="none"
              onChange={onMinFreqChange}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <SliderField
              label={Translator.translate("gpu.max.freq")}
              value={profile.gpu.frequency.max}
              showValue
              step={100}
              valueSuffix=" MHz"
              min={WhiteBoardUtils.getGpuMinFreq()}
              max={WhiteBoardUtils.getGpuMaxFreq()}
              validValues="range"
              bottomSeparator="none"
              onChange={onMaxFreqChange}
            />
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
};
