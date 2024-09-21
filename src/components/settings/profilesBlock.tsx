import { ButtonItem, PanelSection, PanelSectionRow, Router, ToggleField } from "@decky/ui"
import { FC, useContext, useState } from "react"
import { SystemSettings } from "../../settings/system";
import { Translator } from "decky-plugin-framework";
import { Toast } from "../../utils/toast";
import { State } from "../../utils/state";
import { Constants } from "../../utils/constants";
import { Profiles } from "../../settings/profiles";
import { GlobalContext } from "../../contexts/globalContext";

export const ProfilesBlock: FC = () => {
  const {profilePerGame, setProfilePerGame} = useContext(GlobalContext)
  const [isDoingThings, setIsDoingThings] = useState(false);

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
    <PanelSection>
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
  );
};