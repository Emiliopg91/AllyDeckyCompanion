import { NotchLabel, PanelSectionRow, SliderField, ToggleField } from "decky-frontend-lib"
import { useEffect, useState, VFC } from "react"

import { useProfile } from "../hooks/useProfile";
import { Logger, Translator } from "decky-plugin-framework";
import { Profiles } from "../settings/profiles";
import { BackendUtils } from "../utils/backend";
import { Mode } from "../utils/mode";
import { debounce } from 'lodash'
import { CollapsibleItem } from "./collapsibleItem";


const saveSettings = debounce((id: string, name: string, mode: Number, spl: Number, sppl: Number, fppl: Number, cpuBoost: Boolean, smtEnabled: Boolean) => {
  Logger.info("Saving profile " + id + " (" + name + ")")
  Profiles.saveProfileForId(id, mode, spl, sppl, fppl, cpuBoost, smtEnabled)
  BackendUtils.setTdpProfile(Profiles.getProfileForId(id))
}, 500)

export const CpuBlock: VFC<{ collapsed: boolean, onCollapse: () => void }> = ({ collapsed, onCollapse }) => {
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
        label: String(value).substring(0, 1) + String(value).substring(1).toLowerCase()
      });
      notchIdx++;
    });

  const [id, name] = useProfile()

  const profile = Profiles.getProfileForId(id);

  const [mode, setMode] = useState(profile.mode)
  const [spl, setSpl] = useState(profile.spl)
  const [sppl, setSppl] = useState(profile.sppl)
  const [fppl, setFppl] = useState(profile.fppl)
  const [cpuBoost, setCpuBoost] = useState(profile.cpuBoost)
  const [smtEnabled, setSmt] = useState(profile.smtEnabled)

  const loadSettings = () => {
    Logger.info("Loading profile " + id + " (" + name + ")")
    const profile = Profiles.getProfileForId(id);
    setSpl(profile.spl)
    setSppl(profile.sppl)
    setFppl(profile.fppl)
    setCpuBoost(profile.cpuBoost)
    setSmt(profile.smtEnabled)
  }

  useEffect(() => {
    loadSettings();
  }, [])

  useEffect(() => {
    loadSettings();
  }, [id])

  const onModeChange = (newVal: number) => {
    if (newVal == modeTags.indexOf(Mode[Mode.CUSTOM])) {
      saveSettings(id, name, newVal, spl, sppl, fppl, cpuBoost, smtEnabled)
    } else {
      const tdps = Profiles.getTdpForMode(newVal)
      saveSettings(id, name, newVal, tdps[0], tdps[1], tdps[2], cpuBoost, smtEnabled)

      setSpl(tdps[0])
      setSppl(tdps[1])
      setFppl(tdps[2])
    }
    setMode(newVal)
  }

  const onSplChange = (newVal: number) => {
    let newSppl = (newVal > sppl) ? newVal : sppl;
    let newFppl = (newVal > fppl) ? newVal : fppl;

    saveSettings(id, name, mode, newVal, newSppl, newFppl, cpuBoost, smtEnabled)

    setSpl(newVal)
    setSppl(newSppl)
    setFppl(newFppl)
  }

  const onSpplChange = (newVal: number) => {
    if (newVal < spl)
      newVal = spl;
    let newFppl = (newVal > fppl) ? newVal : fppl;

    saveSettings(id, name, mode, spl, newVal, newFppl, cpuBoost, smtEnabled)

    setSppl(newVal)
    setFppl(newFppl)
  }

  const onFpplChange = (newVal: number) => {
    if (newVal < sppl)
      newVal = sppl;

    saveSettings(id, name, mode, spl, sppl, newVal, cpuBoost, smtEnabled)

    setFppl(newVal)
  }

  const onCpuBoostChange = (newVal: boolean) => {
    saveSettings(id, name, mode, spl, sppl, fppl, newVal, smtEnabled)

    setCpuBoost(newVal)
  }

  const onSmtChange = (newVal: boolean) => {
    saveSettings(id, name, mode, spl, sppl, fppl, cpuBoost, newVal)

    setSmt(newVal)
  }

  return (
    <CollapsibleItem title={Translator.translate("performance.settings")} collapsed={collapsed} onCollapse={onCollapse}>
      <PanelSectionRow>
        <span>Profile for {name}</span>
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label={Translator.translate("performance.mode")}
          value={mode}
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
        <SliderField
          label={Translator.translate("spl.desc")}
          value={spl}
          disabled={mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
          showValue
          step={1}
          valueSuffix="W"
          min={5}
          max={30}
          validValues="range"
          bottomSeparator="none"
          onChange={onSplChange}
        />
        <SliderField
          label={Translator.translate("sppl.desc")}
          value={sppl}
          disabled={mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
          showValue
          step={1}
          valueSuffix="W"
          min={5}
          max={30}
          validValues="range"
          bottomSeparator="none"
          onChange={onSpplChange}
        />
        <SliderField
          label={Translator.translate("fppl.desc")}
          value={fppl}
          disabled={mode !== modeTags.indexOf(Mode[Mode.CUSTOM].substring(0, 1) + Mode[Mode.CUSTOM].substring(1))}
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
          checked={smtEnabled}
          onChange={onSmtChange}
          highlightOnFocus
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="CPU Boost"
          description={Translator.translate("cpu.boost.description")}
          checked={cpuBoost}
          onChange={onCpuBoostChange}
          highlightOnFocus
        />
      </PanelSectionRow>
    </CollapsibleItem>
  );
};