import React from 'react';
import { Dropdown } from '@epam/uui-components';

import {
    createPluginFactory,
    getPluginOptions,
    getPreventDefaultHandler,
    PlateEditor,
    insertElements,
    ToolbarButton as PlateToolbarButton,
} from "@udecode/plate";

import { isPluginActive, isTextSelected } from '../../../helpers';

import { ToolbarButton } from '../../../implementation/ToolbarButton';

import { PlaceholderBlock } from './PlaceholderBlock';

import css from './PlaceholderPlugin.scss';

const KEY = 'placeholder';
const noop = () => {};

export interface PlaceholderPluginParams {
    items: {
        name: string;
        [key: string]: any;
    }[];
}

export const placeholderPlugin = (params: PlaceholderPluginParams) => {
    const createPlaceholderPlugin = createPluginFactory({
        key: KEY,
        isElement: true,
        isInline: true,
        isVoid: true,
        options: {
            params,
        },
        component: PlaceholderBlock,
    });

    return createPlaceholderPlugin();
};

interface IPlaceholderButton {
    editor: PlateEditor;
}

export const PlaceholderButton = ({ editor }: IPlaceholderButton): any => {

    if (!isPluginActive(KEY)) return null;
    const { params }: { params: PlaceholderPluginParams} = getPluginOptions(editor, KEY);

    const renderDropdownBody = () => {
        return (
            <div className={ css.dropdownContainer }>
                { params.items.map(i =>
                    <div className={ css.dropdownItem }
                         key={ i.name }
                         onMouseDown={ () => insertElements(
                             editor,
                             {
                                 data: i,
                                 type: 'placeholder',
                                 children: [{ text: '' }] ,
                             },
                         ) }
                    >
                        { i.name }
                    </div>,
                ) }
            </div>
        );
    };

    return (
        <Dropdown
            renderTarget={ (props) => (
                <PlateToolbarButton
                    styles={ { root: {width: 'auto', cursor: 'pointer', padding: '0px' }} }
                    active={ true }
                    onMouseDown={
                        editor
                            ? getPreventDefaultHandler()
                            : undefined
                    }
                    icon={ <ToolbarButton
                        onClick={ noop }
                        caption={ <div style={ { height: 42, display: 'flex', alignItems: 'center' } }>Insert Placeholder</div> }
                        isDisabled={ isTextSelected(editor, true) }
                        { ...props }
                    /> }
                />
            ) }
            renderBody={ renderDropdownBody }
            placement='top-start'
            modifiers={ [{ name: 'offset', options: { offset: [0, 3] } }] }
        />
    );
};
