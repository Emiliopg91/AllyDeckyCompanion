import { DropdownItem } from "@decky/ui"
import { FC } from "react"

import { Translator } from "decky-plugin-framework";
import { State } from "../../utils/state";

export const MenuBlock: FC = () => {

  return (
    <div>
      <DropdownItem selectedOption={State.CURRENT_TAB}
        rgOptions={[
          {
            data: "cpu",
            label: Translator.translate("performance.settings")
          },
          {
            data: "settings",
            label: Translator.translate("settings.info")
          },
          {
            data: "system",
            label: Translator.translate("system.info")
          }
        ]}
        onChange={(newVal) => { State.CURRENT_TAB = newVal.data }}
      />
    </div>
  );
};