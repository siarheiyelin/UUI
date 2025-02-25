import { withMods } from '@epam/uui-core';
import * as uuiComponents from '@epam/uui-components';
import { systemIcons } from '../../icons/icons';
import css from './Accordion.module.scss';

export interface AccordionMods {
    /** @default 'block' */
    mode?: 'block' | 'inline';
    padding?: '0' | '6' | '12' | '18';
}

export type AccordionProps = AccordionMods & uuiComponents.AccordionProps;

const getMode = (mode: AccordionMods['mode']) => {
    return mode || 'block';
};

function applyAccordionMods(mods: AccordionProps) {
    return [
        css.root,
        css['mode-' + getMode(mods.mode)],
        mods.padding && css['padding-' + mods.padding],
    ];
}

export const Accordion = withMods<uuiComponents.AccordionProps, AccordionMods>(uuiComponents.Accordion, applyAccordionMods, (mods) => ({
    dropdownIcon: mods.dropdownIcon !== null && systemIcons[getMode(mods.mode) === 'block' ? '60' : '30'].foldingArrow,
}));
