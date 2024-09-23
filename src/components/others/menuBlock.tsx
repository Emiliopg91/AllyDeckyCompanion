import { DropdownItem } from "@decky/ui";
import { FC } from "react";

import { Translator } from "decky-plugin-framework";
import { WhiteBoardUtils } from "../../utils/whiteboard";

export const MenuBlock: FC = () => {
  return (
    <div>
      <DropdownItem
        selectedOption={WhiteBoardUtils.getTab()}
        rgOptions={[
          {
            data: "performance",
            label: Translator.translate("performance.settings"),
          },
          {
            data: "settings",
            label: Translator.translate("settings.info"),
          },
          {
            data: "system",
            label: Translator.translate("system.info"),
          },
        ]}
        onChange={(newVal) => {
          WhiteBoardUtils.setTab(newVal.data);
        }}
      />
    </div>
  );
};
