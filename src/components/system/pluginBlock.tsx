import { ButtonItem, Field, PanelSection, PanelSectionRow } from '@decky/ui';
import { Toast, Translator } from 'decky-plugin-framework';
import { FC, useState } from 'react';

import { BackendUtils } from '../../utils/backend';
import { Constants } from '../../utils/constants';
import { WhiteBoardUtils } from '../../utils/whiteboard';

export const PluginBlock: FC = () => {
  const [isPluginDoingThings, setIsPluginDoingThings] = useState(false);

  return (
    <PanelSection title={Translator.translate('plugin')}>
      <PanelSectionRow>
        <Field label={Translator.translate('installed.version')} bottomSeparator="none">
          {Constants.PLUGIN_VERSION}
        </Field>
      </PanelSectionRow>
      {WhiteBoardUtils.getPluginLatestVersion() && (
        <PanelSectionRow>
          <Field label={Translator.translate('latest.version')} bottomSeparator="none">
            {WhiteBoardUtils.getPluginLatestVersion()}
          </Field>
        </PanelSectionRow>
      )}
      {WhiteBoardUtils.getPluginLatestVersion() && (
        <>
          <PanelSectionRow>
            <ButtonItem
              onClick={() => {
                Toast.toast(
                  Constants.PLUGIN_VERSION === WhiteBoardUtils.getPluginLatestVersion() &&
                    Boolean(WhiteBoardUtils.getPluginLatestVersion())
                    ? Translator.translate('reinstalling.plugin')
                    : Translator.translate('updating.plugin')
                );
                setIsPluginDoingThings(true);
                BackendUtils.otaUpdate();
              }}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              disabled={isPluginDoingThings}
            >
              {Constants.PLUGIN_VERSION === WhiteBoardUtils.getPluginLatestVersion() &&
              Boolean(WhiteBoardUtils.getPluginLatestVersion())
                ? Translator.translate('reinstall.plugin')
                : Translator.translate('update.to', {
                    version: WhiteBoardUtils.getPluginLatestVersion()
                  })}
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
};
