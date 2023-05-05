import { LabIcon } from '@jupyterlab/ui-components';
import codeGuruIconSVG from '../../style/icons/cg-icon.svg';
import checkmarkIconBlueSVG from '../../style/icons/checkmark-blue.svg';
import circlePartialIconBlueSVG from '../../style/icons/circle-partial-blue.svg';
import missingPermissionsOrCredsIconRedSVG from '../../style/icons/missing-permissions-or-credentials-red.svg';

const codeGuruIcon = new LabIcon({
  name: 'codeGuruIcon',
  svgstr: codeGuruIconSVG
});

const checkmarkIconBlue = new LabIcon({
  name: 'checkmarkIcon:blue',
  svgstr: checkmarkIconBlueSVG
});

const circlePartialIconBlue = new LabIcon({
  name: 'circlePartialIcon:blue',
  svgstr: circlePartialIconBlueSVG
});

const missingPermissionsOrCredsIconRed = new LabIcon({
  name: 'missingPermissionsOrCredsIcon:red',
  svgstr: missingPermissionsOrCredsIconRedSVG
});

export {
  checkmarkIconBlue,
  circlePartialIconBlue,
  codeGuruIcon,
  missingPermissionsOrCredsIconRed
};
