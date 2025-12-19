import { Field, PanelSection, PanelSectionRow, Router } from '@decky/ui';
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App';
import { Logger, Translator } from 'decky-plugin-framework';
import { FC, useContext, useEffect, useState } from 'react';
import { FaBatteryFull, FaSteamSquare } from 'react-icons/fa';
import { PiPlugFill } from 'react-icons/pi';

import { PerformanceContext } from '../../contexts/performanceContext';
import { Profiles } from '../../settings/profiles';
import { BackendUtils } from '../../utils/backend';
import { Constants } from '../../utils/constants';
import { CorsClient } from '../../utils/cors';
import { AppOverviewExt } from '../../utils/models';

declare const appStore: any;

const loadIcon = async (appId: number, setIcon: (icon: string) => void): Promise<void> => {
  let appDetail: AppOverviewExt | undefined = undefined;
  (Router.RunningApps as AppOverviewExt[]).forEach((app: AppOverviewExt) => {
    if (app.appid == appId) {
      appDetail = app;
    }
  });

  if (appDetail) {
    const app = appDetail as AppOverviewExt;
    if (app.icon_data) {
      setIcon('data:image/' + app.icon_data_format + ';base64,' + app.icon_data);
    } else {
      if (app.icon_hash) {
        const icon = await BackendUtils.getIconForApp(String(appId));
        if (icon) {
          setIcon(icon);
        } else {
          try {
            const iconUrl = appStore.GetIconURLForApp(app as SteamAppOverview);
            const response = await CorsClient.fetchUrl(iconUrl);
            if (response.ok) {
              const reader = new FileReader();
              reader.onload = (): void => {
                const newIconSrc = reader.result as string;
                BackendUtils.setIconForApp(String(appId), newIconSrc);
                setIcon(newIconSrc);
              };
              reader.readAsDataURL(await response.blob());
            } else {
              throw new Error(response.statusText);
            }
          } catch (e) {
            Logger.error('Error getting icon from URL: ', e);
            setIcon('');
          }
        }
      } else {
        setIcon('');
      }
    }
  }
};

export const HeaderBlock: FC = () => {
  const { onBattery, name } = useContext(PerformanceContext);
  const [icon, setIcon] = useState<string>('');

  useEffect(() => {
    if (name == Constants.DEFAULT_DEFAULT) {
      setIcon('');
      return;
    }

    loadIcon(Profiles.getAppId(name), setIcon);
  }, []);

  useEffect(() => {
    if (name == Constants.DEFAULT_DEFAULT) {
      setIcon('');
      return;
    }

    loadIcon(Profiles.getAppId(name), setIcon);
  }, [name]);

  return (
    <PanelSection>
      <PanelSectionRow>
        <Field label={Translator.translate('profile.for')} bottomSeparator="standard">
          {onBattery && <FaBatteryFull />}
          {!onBattery && <PiPlugFill />}
          {name != Constants.DEFAULT_DEFAULT && icon != '' && (
            <>
              <span> </span>
              <img
                style={{
                  maxWidth: 16,
                  maxHeight: 16,
                  border: '1px solid gray'
                }}
                src={icon}
              />
            </>
          )}
          {name == Constants.DEFAULT_DEFAULT && <FaSteamSquare />}
          <span> </span>
          {name}
        </Field>
      </PanelSectionRow>
    </PanelSection>
  );
};
