import React from 'react';
import { uuiSkin } from '@epam/uui-core';
import {
    findNodePath,
    setNodes,
    TTodoListItemElement,
} from '@udecode/plate';

import css from './ToDoItem.module.scss';
import { useReadOnly } from 'slate-react';

const { Checkbox, FlexRow } = uuiSkin;

export function ToDoItem(props: any): any {
    const isReadonly = useReadOnly();
    const { element, editor, attributes, children } = props;

    const checked = element.data?.checked || false;

    return (
        <FlexRow rawProps={ attributes }  >
            <div className={ css.checkboxContainer } style={ { userSelect: 'none' } } >
                <Checkbox
                    isReadonly={ isReadonly }
                    isDisabled={ false }
                    value={ checked }
                    rawProps={ { style: { userSelect: 'none' } } }
                    onValueChange={ (value) => {
                        if (isReadonly) return;
                        const path = findNodePath(editor, element);
                        if (!path) return;

                        setNodes<TTodoListItemElement>(
                            editor,
                            { data: { checked: value } },
                            {
                                at: path,
                            }
                        );
                    } }
                />
            </div>
            <div className={ css.textContainer }>
                { children }
            </div>
        </FlexRow>
    );
}