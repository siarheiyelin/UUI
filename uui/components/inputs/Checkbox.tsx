import { withMods } from '@epam/uui-core';
import * as uuiComponents from '@epam/uui-components';
import { ReactComponent as Check_12 } from '../../icons/check-12.svg';
import { ReactComponent as Check_18 } from '../../icons/check-18.svg';
import { ReactComponent as PartlySelect_12 } from '../../icons/partly-select-12.svg';
import { ReactComponent as PartlySelect_18 } from '../../icons/partly-select-18.svg';
import css from './Checkbox.module.scss';

export interface CheckboxMods {
    size?: '12' | '18';
    mode?: 'form' | 'cell';
}

export type CheckboxProps = CheckboxMods & uuiComponents.CheckboxProps;

export function applyCheckboxMods(mods: CheckboxMods) {
    return [
        css.root,
        css['size-' + (mods.size || '18')],
        css['mode-' + (mods.mode || 'form')],
        'uui-color-primary',
    ];
}

const applyUUICheckboxProps = (props: CheckboxMods) => ({
    icon: props.size === '12' ? Check_12 : Check_18,
    indeterminateIcon: props.size === '12' ? PartlySelect_12 : PartlySelect_18,
});

export const Checkbox = withMods<uuiComponents.CheckboxProps, CheckboxMods>(uuiComponents.Checkbox, applyCheckboxMods, applyUUICheckboxProps);
