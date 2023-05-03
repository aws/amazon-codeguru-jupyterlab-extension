import { LabIcon } from '@jupyterlab/ui-components';
import codeGuruIconGraySVG from '../../style/icons/cg-icon-gray.svg';
import codeGuruIconWhiteSVG from '../../style/icons/cg-icon-white.svg';
import checkmarkIconBlueSVG from '../../style/icons/checkmark-blue.svg';
import checkmarkIconWhiteSVG from '../../style/icons/checkmark-white.svg';
import circlePartialIconWhiteSVG from '../../style/icons/circle-partia-white.svg';
import circlePartialIconBlueSVG from '../../style/icons/circle-partial-blue.svg';
import missingPermissionsOrCredsIconRedSVG from '../../style/icons/missing-permissions-or-credentials-red.svg';
import missingPermissionsOrCredsIconWhiteSVG from '../../style/icons/missing-permissions-or-credentials-white.svg';

const codeGuruIconGray = new LabIcon({
  name: 'codeGuruIcon:gray',
  svgstr: codeGuruIconGraySVG
});
const codeGuruIconWhite = new LabIcon({
  name: 'codeGuruIcon:white',
  svgstr: codeGuruIconWhiteSVG
});

const checkmarkIconBlue = new LabIcon({
  name: 'checkmarkIcon:blue',
  svgstr: checkmarkIconBlueSVG
});
const checkmarkIconWhite = new LabIcon({
  name: 'checkmarkIcon:white',
  svgstr: checkmarkIconWhiteSVG
});

const circlePartialIconBlue = new LabIcon({
  name: 'circlePartialIcon:blue',
  svgstr: circlePartialIconBlueSVG
});
const circlePartialIconWhite = new LabIcon({
  name: 'circlePartialIcon:white',
  svgstr: circlePartialIconWhiteSVG
});

const missingPermissionsOrCredsIconRed = new LabIcon({
  name: 'missingPermissionsOrCredsIcon:red',
  svgstr: missingPermissionsOrCredsIconRedSVG
});
const missingPermissionsOrCredsIconWhite = new LabIcon({
  name: 'missingPermissionsOrCredsIcon:white',
  svgstr: missingPermissionsOrCredsIconWhiteSVG
});

export {
  checkmarkIconBlue,
  checkmarkIconWhite,
  circlePartialIconBlue,
  circlePartialIconWhite,
  codeGuruIconGray,
  codeGuruIconWhite,
  missingPermissionsOrCredsIconRed,
  missingPermissionsOrCredsIconWhite
};
