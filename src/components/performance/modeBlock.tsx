import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui"
import { FC, useContext } from "react"

import { Translator } from "decky-plugin-framework";
import { Mode } from "../../utils/mode";
import { PerformanceContext } from "../../contexts/performanceContext";


export const ModeBlock: FC = () => {
  const modeIndexes: Array<Number> = []
  const modeTags: Array<String> = []
  const notchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  Object.entries(Mode)
    .filter(([key]) => !isNaN(Number(key)))  // Filtra los valores numéricos
    .map(([key, value]) => {
      modeIndexes.push(Number(key))
      modeTags.push(String(value))

      notchLabels.push({
        notchIndex: notchIdx,
        value: notchIdx,
        label: Translator.translate("mode." + String(value))
      });
      notchIdx++;
    });

  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext)

  const onModeChange = (newVal: number) => {
    const newProf = { ...profile, mode: newVal }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  return (
    <PanelSection >
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
          bottomSeparator={"none"}
          onChange={onModeChange}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};