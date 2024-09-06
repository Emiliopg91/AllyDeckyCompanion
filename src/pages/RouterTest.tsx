import { DialogButton, Navigation } from "decky-frontend-lib";
import { VFC } from "react";
import { Translator } from "decky-plugin-framework";

export const RouterTest: VFC = () => {
    return (
      <div style={{ marginTop: "50px", color: "white" }}>
        {Translator.translate("hello.world")}
        <DialogButton onClick={() => Navigation.NavigateToLibraryTab()}>
          {Translator.translate("go.to.library")}
        </DialogButton>
      </div>
    );
  };