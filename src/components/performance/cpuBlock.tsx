import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField } from "@decky/ui"
import { FC, useContext } from "react"

import { Translator } from "decky-plugin-framework";
import { Mode } from "../../utils/mode";
import { PerformanceContext } from "../../contexts/performanceContext";


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

  const { id, name, profile, setProfile, saveProfile } = useContext(PerformanceContext)

  const onSplChange = (newVal: number) => {
    let newSppl = (newVal > profile.cpu.tdp.sppl) ? newVal : profile.cpu.tdp.sppl;
    let newFppl = (newVal > profile.cpu.tdp.fppl) ? newVal : profile.cpu.tdp.fppl;

    const newProf = { ...profile, cpu: { ...profile.cpu, tdp: { spl: newVal, sppl: newSppl, fppl: newFppl } } }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  const onSpplChange = (newVal: number) => {
    if (newVal < profile.cpu.tdp.spl)
      newVal = profile.cpu.tdp.spl;
    let newFppl = (newVal > profile.cpu.tdp.fppl) ? newVal : profile.cpu.tdp.fppl;

    const newProf = { ...profile, cpu: { ...profile.cpu, tdp: { ...profile.cpu.tdp, sppl: newVal, fppl: newFppl } } }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  const onFpplChange = (newVal: number) => {
    if (newVal < profile.cpu.tdp.sppl)
      newVal = profile.cpu.tdp.sppl;

    const newProf = { ...profile, cpu: { ...profile.cpu, tdp: { ...profile.cpu.tdp, fppl: newVal } } }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  const onCpuBoostChange = (newVal: boolean) => {
    const newProf = { ...profile, cpu: { ...profile.cpu, boost: newVal } }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  const onSmtChange = (newVal: boolean) => {
    const newProf = { ...profile, cpu: { ...profile.cpu, smt: newVal } }
    saveProfile(id, name, newProf)
    setProfile(newProf)
  }

  return (
    <PanelSection>
      {profile.mode == 3 &&
        <>
          <PanelSectionRow>
            <SliderField
              label={Translator.translate("spl.desc")}
              value={profile.cpu.tdp.spl}
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
              value={profile.cpu.tdp.sppl}
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
              value={profile.cpu.tdp.fppl}
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
              checked={profile.cpu.smt}
              onChange={onSmtChange}
              highlightOnFocus
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label="CPU Boost"
              description={Translator.translate("cpu.boost.description")}
              checked={profile.cpu.boost}
              onChange={onCpuBoostChange}
              highlightOnFocus
            />
          </PanelSectionRow>
        </>
      }
    </PanelSection>
  );
};