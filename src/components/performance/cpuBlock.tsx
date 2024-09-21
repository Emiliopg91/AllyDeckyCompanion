import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui"
import { FC, useContext } from "react"

import { Logger, Translator } from "decky-plugin-framework";
import { Profiles } from "../../settings/profiles";
import { Mode } from "../../utils/mode";
import { debounce } from 'lodash'
import { PerformanceContext } from "../../contexts/performanceContext";


const saveSettings = debounce((id: string, name: string, mode: Number, spl: Number, sppl: Number, fppl: Number, cpuBoost: Boolean, smtEnabled: Boolean) => {
  Logger.info("Saving profile " + id + " (" + name + ")")
  Profiles.saveProfileForId(id, mode, spl, sppl, fppl, cpuBoost, smtEnabled)
  Profiles.applyGameProfile(id)
}, 500)

export const CpuBlock: FC = () => {
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

  const { id, name, profile, setProfile } = useContext(PerformanceContext)

  const onModeChange = (newVal: number) => {
    saveSettings(id, name, newVal, profile.spl, profile.sppl, profile.fppl, profile.cpuBoost, profile.smtEnabled)
    setProfile({ ...profile, mode: newVal })
  }

  const onSplChange = (newVal: number) => {
    let newSppl = (newVal > profile.sppl) ? newVal : profile.sppl;
    let newFppl = (newVal > profile.fppl) ? newVal : profile.fppl;

    saveSettings(id, name, profile.mode, newVal, newSppl, newFppl, profile.cpuBoost, profile.smtEnabled)
    setProfile({ ...profile, spl: newVal, sppl: newSppl, fppl: newFppl })
  }

  const onSpplChange = (newVal: number) => {
    if (newVal < profile.spl)
      newVal = profile.spl;
    let newFppl = (newVal > profile.fppl) ? newVal : profile.fppl;

    saveSettings(id, name, profile.mode, profile.spl, newVal, newFppl, profile.cpuBoost, profile.smtEnabled)
    setProfile({ ...profile, sppl: newVal, fppl: newFppl })
  }

  const onFpplChange = (newVal: number) => {
    if (newVal < profile.sppl)
      newVal = profile.sppl;

    saveSettings(id, name, profile.mode, profile.spl, profile.sppl, newVal, profile.cpuBoost, profile.smtEnabled)
    setProfile({ ...profile, fppl: newVal })
  }

  const onCpuBoostChange = (newVal: boolean) => {
    saveSettings(id, name, profile.mode, profile.spl, profile.sppl, profile.fppl, newVal, profile.smtEnabled)
    setProfile({ ...profile, cpuBoost: newVal })
  }

  const onSmtChange = (newVal: boolean) => {
    saveSettings(id, name, profile.mode, profile.spl, profile.sppl, profile.fppl, profile.cpuBoost, newVal)
    setProfile({ ...profile, smtEnabled: newVal })
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
      {profile.mode == 3 &&
        <>
          <PanelSectionRow>
            <SliderField
              label={Translator.translate("spl.desc")}
              value={profile.spl}
              disabled={profile.mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
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
              label={Translator.translate("sppl.desc")}
              value={profile.sppl}
              disabled={profile.mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
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
              label={Translator.translate("fppl.desc")}
              value={profile.fppl}
              disabled={profile.mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
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
          <PanelSectionRow>
            <ToggleField
              label="SMT"
              description={Translator.translate('smt.description')}
              checked={profile.smtEnabled}
              onChange={onSmtChange}
              highlightOnFocus
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label="CPU Boost"
              description={Translator.translate("cpu.boost.description")}
              checked={profile.cpuBoost}
              onChange={onCpuBoostChange}
              highlightOnFocus
            />
          </PanelSectionRow>
        </>
      }
    </PanelSection>
  );
};