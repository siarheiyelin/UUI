import { withMods } from '@epam/uui-core';
import { RadioInput as uuiRadioInput, RadioInputProps as UuiRadioInputProps } from '@epam/uui-components';
import css from './RadioInput.module.scss';
import { ReactComponent as RadioPoint } from '../../icons/radio-point.svg';

type RadioInputMods = {
    /**
     * Defines component size.
     * @default '18'
     */
    size?: '12' | '18';
};

/** Represents the properties of a RadioInput component. */
export type RadioInputProps = RadioInputMods & UuiRadioInputProps;

function applyRadioInputMods(mods: RadioInputProps) {
    return [
        css.root,
        css['size-' + (mods.size || '18')],
        'uui-radio-input-container',
        'uui-color-primary',
    ];
}

export const RadioInput = withMods<UuiRadioInputProps, RadioInputMods>(
    uuiRadioInput,
    applyRadioInputMods,
    (props) => ({ icon: props.icon ? props.icon : RadioPoint }),
);
