import { Field, PanelSection, PanelSectionRow } from '@decky/ui';
import { Translator } from 'decky-plugin-framework';
import { FC } from 'react';

import { WhiteBoardUtils } from '../../utils/whiteboard';

export const BiosBlock: FC = () => {
  return (
    <PanelSection title={Translator.translate('bios')}>
      <PanelSectionRow>
        <Field label={Translator.translate('installed.version')} bottomSeparator="none">
          {WhiteBoardUtils.getBiosVersion()}
        </Field>
      </PanelSectionRow>
      {WhiteBoardUtils.getBiosLatestVersion() && (
        <PanelSectionRow>
          <Field label={Translator.translate('latest.version')} bottomSeparator="none">
            {WhiteBoardUtils.getBiosLatestVersion()}
          </Field>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
