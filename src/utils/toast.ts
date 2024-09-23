import { toaster } from "@decky/api";
import { RogIcon } from "../components/icons/rogIcon";
import { Constants } from "./constants";

/**
 * Represents a toast notification utility.
 */
export class Toast {
  private constructor() {}

  /**
   * Icon for the toast notification.
   */
  private static ico = window.SP_REACT.createElement(RogIcon, {
    width: 30,
    height: 30,
  });

  /**
   * Displays a toast notification.
   * @param msg - The message to display.
   * @param ms - The duration of the toast notification in milliseconds (default is 2000).
   * @param clickAction - The action to perform when the toast notification is clicked (default is an empty function).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function
  public static toast(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any,
    ms: number = 2000,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    clickAction = (): void => {},
  ): void {
    toaster.toast({
      title: Constants.PLUGIN_NAME,
      body: msg,
      duration: ms,
      logo: Toast.ico,
      onClick: clickAction,
    });
  }
}
