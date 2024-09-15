import { NotchLabel, PanelSection, PanelSectionRow, SliderField, ToggleField, Field, Router } from "decky-frontend-lib"
import { FC, useEffect, useState } from "react"
import { AppOverviewExt } from '../utils/models'

import { Game, Logger, Translator } from "decky-plugin-framework";
import { Profiles } from "../settings/profiles";
import { BackendUtils } from "../utils/backend";
import { Mode } from "../utils/mode";
import { debounce } from 'lodash'
import { State } from "../utils/state";
import { FaBatteryFull, FaSteamSquare } from "react-icons/fa";
import { PiPlugFill } from "react-icons/pi";
import { Constants } from "../utils/constants";


const saveSettings = debounce((id: string, name: string, mode: Number, spl: Number, sppl: Number, fppl: Number, cpuBoost: Boolean, smtEnabled: Boolean) => {
  Logger.info("Saving profile " + id + " (" + name + ")")
  Profiles.saveProfileForId(id, mode, spl, sppl, fppl, cpuBoost, smtEnabled)
  BackendUtils.setTdpProfile(Profiles.getProfileForId(id))
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

  const getAppId = (id: string, bat: boolean) => {
    if (!bat && id.endsWith(Constants.SUFIX_AC)) {
      return id.substring(0, id.lastIndexOf("."))
    }
    return id;
  }

  const getAppName = (id: string, bat: boolean) => {
    const appId = getAppId(id, bat);
    if (appId == Constants.DEFAULT_ID) {
      return Translator.translate("main.menu")
    } else {
      return Game.getGameDetails(Number(appId)).getDisplayName()
    }
  }

  const [bat, setBat] = useState(State.ON_BATTERY);
  const [id, setId] = useState(State.RUNNING_GAME_ID);
  const [name, setName] = useState(getAppName(id, bat));

  const [iconSrc, setIconSrc] = useState<string | undefined>(undefined)

  const profile = Profiles.getProfileForId(id);

  const [mode, setMode] = useState(profile.mode)
  const [spl, setSpl] = useState(profile.spl)
  const [sppl, setSppl] = useState(profile.sppl)
  const [fppl, setFppl] = useState(profile.fppl)
  const [cpuBoost, setCpuBoost] = useState(profile.cpuBoost)
  const [smtEnabled, setSmt] = useState(profile.smtEnabled)

  const loadSettings = debounce((id, name) => {
    Logger.info("Loading profile " + id + " (" + name + ")")
    const profile = Profiles.getProfileForId(id);
    setMode(profile.mode)
    setSpl(profile.spl)
    setSppl(profile.sppl)
    setFppl(profile.fppl)
    setCpuBoost(profile.cpuBoost)
    setSmt(profile.smtEnabled)
  }, 100)

  const loadIcon = debounce(() => {
    let newIconSrc: string | undefined = undefined;
    (Router.RunningApps as AppOverviewExt[]).filter((app) => {
      if (!newIconSrc && app.icon_data && String(app.appid) == (bat ? id : id.substring(0, id.lastIndexOf('.')))) {
        newIconSrc = "data:image/" + app.icon_data_format + ";base64," + app.icon_data
      }
    });
    setIconSrc(newIconSrc)
  }, 100)

  const profRefreshFn = () => {
    setBat(bat => (bat != State.ON_BATTERY) ? State.ON_BATTERY : bat)
    setId(id => (id != State.RUNNING_GAME_ID) ? State.RUNNING_GAME_ID : id)
    setName(getAppName(id, bat))
  }

  useEffect(() => {
    loadSettings(id, name);
    loadIcon()
    const profRefresh = setInterval(() => profRefreshFn(), 500)

    return () => {
      clearInterval(profRefresh)
    }
  }, [])

  useEffect(() => {
    loadSettings(id, name);
    loadIcon()
  }, [id])

  const onModeChange = (newVal: number) => {
    let tdps = Profiles.getTdpForMode(newVal)

    saveSettings(id, name, newVal, tdps[0], tdps[1], tdps[2], cpuBoost, smtEnabled)

    setSpl(tdps[0])
    setSppl(tdps[1])
    setFppl(tdps[2])
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
    <PanelSection >
      <PanelSectionRow>
        <Field label={Translator.translate("profile.for")} bottomSeparator="standard">
          {bat &&
            <FaBatteryFull />
          }
          {!bat &&
            <PiPlugFill />
          }
          {(id != Constants.DEFAULT_ID && id != Constants.DEFAULT_ID_AC && iconSrc) &&
            <>
              <span> </span>
              <img
                style={{ maxWidth: 16, maxHeight: 16 }}
                src={iconSrc}
              />
            </>
          }
          {(id == Constants.DEFAULT_ID || id == Constants.DEFAULT_ID_AC) &&
            <FaSteamSquare />
          }
          <span> </span>
          {name}
        </Field>
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
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
      </PanelSectionRow>
      {mode == 3 &&
        <>
          <PanelSectionRow>
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
          </PanelSectionRow>
          <PanelSectionRow>
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
          </PanelSectionRow>
          <PanelSectionRow>
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
        </>
      }
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
    </PanelSection>
  );
};