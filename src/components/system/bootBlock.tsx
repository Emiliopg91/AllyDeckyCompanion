import { ButtonItem, PanelSection, PanelSectionRow } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC, useEffect, useState } from 'react';

import { BackendUtils } from '../../utils/backend';

export const BootBlock: FC = () => {
  const [windows, setWindows] = useState<boolean>(false);

  useEffect(() => {
    BackendUtils.isWindowsPresent().then(setWindows);
  });

  return (
    <PanelSection title={Translator.translate('boot')}>
      <PanelSectionRow>
        <ButtonItem
          onClick={() => {
            BackendUtils.bootBios();
          }}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {Translator.translate('boot.bios')}
        </ButtonItem>
      </PanelSectionRow>
      {windows && (
        <PanelSectionRow>
          <ButtonItem
            onClick={() => {
              BackendUtils.bootWindows();
            }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {Translator.translate('boot.windows')}
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
