import { ButtonItem, NotchLabel, PanelSection, PanelSectionRow, Router, SliderField, ToggleField } from "@decky/ui"
import { FC, useState } from "react"
import { SystemSettings } from "../settings/system";
import { Toast, Translator } from "decky-plugin-framework";
import { State } from "../utils/state";
import { Constants } from "../utils/constants";
import { Profiles } from "../settings/profiles";

export const SystemBlock: FC = () => {
  const batLimitIndexes: Array<number> = [100, 95, 90, 85, 80]
  const batLimitTags: Array<String> = []
  const batLimitNotchLabels: NotchLabel[] = [];

  let notchIdx = 0;
  batLimitIndexes.forEach((idx) => {
    batLimitTags.push(String(idx) + "%")
    batLimitNotchLabels.push({
      notchIndex: notchIdx,
      value: notchIdx,
      label: String(idx) + "%"
    });
    notchIdx++;
  })

  const [limitBattery, setLimitBattery] = useState(batLimitIndexes.indexOf(SystemSettings.getLimitBattery()))
  const [profilePerGame, setProfilePerGame] = useState(State.PROFILE_PER_GAME)
  const [isDoingThings, setIsDoingThings] = useState(false);



  const onLimitBatteryChange = (newVal: number) => {
    SystemSettings.setLimitBattery(batLimitIndexes[newVal]);
    setLimitBattery(newVal)
  }

  const onProfilePerGameChange = (newVal: boolean) => {
    SystemSettings.setProfilePerGame(newVal);

    if (newVal) {
      State.RUNNING_GAME_ID = Router.MainRunningApp
        ? Router.MainRunningApp.appid + (State.ON_BATTERY ? Constants.SUFIX_BAT : Constants.SUFIX_AC)
        : (State.ON_BATTERY ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC)
    } else {
      State.RUNNING_GAME_ID = State.ON_BATTERY ? Constants.DEFAULT_ID : Constants.DEFAULT_ID_AC
    }
    Profiles.applyGameProfile(State.RUNNING_GAME_ID)

    setProfilePerGame(newVal)
  }

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <PanelSectionRow>
            <SliderField
              value={limitBattery}
              min={0}
              max={batLimitIndexes.length - 1}
              step={1} 
              label={Translator.translate("limit.battery")}
              description={Translator.translate("limit.battery.desc")}
              notchCount={batLimitTags.length}
              notchLabels={batLimitNotchLabels}
              notchTicksVisible={true}
              showValue={false}
              bottomSeparator={"none"}
              onChange={onLimitBatteryChange}
            />
          </PanelSectionRow>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={Translator.translate("profile.per.game")}
            description={Translator.translate("profile.per.game.desc")}
            checked={profilePerGame}
            onChange={onProfilePerGameChange}
            highlightOnFocus
          />
        </PanelSectionRow>
        {State.SDTDP_SETTINGS_PRESENT &&
          <PanelSectionRow>
            <ButtonItem
              onClick={() => {
                Toast.toast(Translator.translate("import.sdtdp.settings.in.progress"))
                setIsDoingThings(true)
                Profiles.importFromSDTDP().then(() => {
                  setIsDoingThings(false)
                  Toast.toast(Translator.translate("import.sdtdp.settings.finished"))
                })
              }}
              disabled={isDoingThings}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {Translator.translate("import.sdtdp.settings")}
            </ButtonItem>
          </PanelSectionRow>
        }
      </PanelSection>
    </>
  );
};