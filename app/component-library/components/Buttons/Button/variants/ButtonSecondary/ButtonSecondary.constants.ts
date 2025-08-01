/* eslint-disable import/prefer-default-export */

// External dependencies.
import { SAMPLE_BUTTONBASE_PROPS } from '../../foundation/ButtonBase/ButtonBase.constants';
import { TextColor, TextVariant } from '../../../../Texts/Text';

// Internal dependencies.
import { ButtonSecondaryProps } from './ButtonSecondary.types';

// Defaults
export const DEFAULT_BUTTONSECONDARY_LABEL_TEXTVARIANT =
  TextVariant.BodyMDMedium;
export const DEFAULT_BUTTONSECONDARY_LABEL_COLOR = TextColor.Primary;
export const DEFAULT_BUTTONSECONDARY_LABEL_COLOR_PRESSED = TextColor.Inverse;
export const DEFAULT_BUTTONSECONDARY_LABEL_COLOR_ERROR = TextColor.Error;
export const DEFAULT_BUTTONSECONDARY_LABEL_COLOR_ERROR_PRESSED =
  TextColor.Inverse;

// Samples
export const SAMPLE_BUTTONSECONDARY_PROPS: ButtonSecondaryProps = {
  ...SAMPLE_BUTTONBASE_PROPS,
};
