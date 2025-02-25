import React from 'react';
import {
    TSkin,
    TDocsGenExportedType,
} from '../../types';
import {
    DocBuilder,
} from '../../DocBuilder';
import {
    IAnalyticableClick,
    ICanBeInvalid,
    IDropdownToggler,
    IHasCaption,
    IHasCX,
    IHasForwardedRef,
    IHasPlaceholder,
    IHasRawProps,
    TextInputCoreProps,
} from '@epam/uui-core';
import { pickerBaseOptionsDoc } from '../../commonDocs';
import { TPropDocBuilder } from '../docBuilderGenTypes';
import {
    getRawPropsExamples,
    getReactNodeExamples,
    getReactRefExamples,
    getTextExamplesNoUndefined,
} from './shared/reusableExamples';
import { iCanRedirectDoc, iEditable, iHasLabelDoc } from '../../commonDocs';

const BY_PROP_FROM_REF: { [typeRef in TDocsGenExportedType]?: (skin?: TSkin) => DocBuilder<any> } = {
    '@epam/uui-core:ButtonCoreProps': () => {
        return new DocBuilder<any>({ name: '' }).prop('count', {
            examples: [0,
                1,
                123,
                { name: '"This is a string"', value: 'This is a string' },
                { name: '<i>This is React.ReactElement</i>', value: <i>This is React.ReactElement</i> }],
            editorType: 'MultiUnknownEditor',
        });
    },
    '@epam/uui-components:ButtonProps': () => {
        return new DocBuilder<any>({ name: '' }).prop('countIndicator', {
            examples: [
                { name: 'null', value: null },
                { name: '(props: IHasCaption) => <i>{props.caption}</i>', value: (props: IHasCaption) => <i>{props.caption}</i> },
            ],
            editorType: 'MultiUnknownEditor',
        });
    },
    '@epam/uui-core:IDropdownToggler': () => new DocBuilder<IDropdownToggler>({ name: '' }).prop('ref', {
        examples: getReactRefExamples('ref'),
    }),
    '@epam/uui-core:IHasForwardedRef': () => new DocBuilder<IHasForwardedRef<any>>({ name: '' }).prop('forwardedRef', {
        examples: getReactRefExamples('ref'),
    }),
    '@epam/uui-core:IHasLabel': () => iHasLabelDoc,
    '@epam/uui-core:IHasCX': () => new DocBuilder<IHasCX>({ name: '' }).prop('cx', {
        editorType: 'CssClassEditor',
        examples: [],
    }),
    '@epam/uui-core:IHasCaption': () => new DocBuilder<IHasCaption>({ name: '' })
        .prop('caption', {
            examples: [
                { value: undefined, name: '' },
                ...getTextExamplesNoUndefined(true),
            ],
            editorType: 'StringWithExamplesEditor',
        }),
    '@epam/uui-core:IHasPlaceholder': () => new DocBuilder<IHasPlaceholder>({ name: '' })
        .prop('placeholder', {
            examples: getTextExamplesNoUndefined(),
            editorType: 'StringWithExamplesEditor',
        }),
    '@epam/uui-core:IHasRawProps': () => {
        return new DocBuilder<IHasRawProps<any>>({ name: '' })
            .prop('rawProps', {
                editorType: 'JsonEditor',
                examples: getRawPropsExamples(),
            });
    },
    '@epam/uui-core:TextInputCoreProps': () => {
        return new DocBuilder<TextInputCoreProps>({ name: '' })
            .prop('type', {
                editorType: 'StringWithExamplesEditor',
                examples: [
                    // See also: https://www.w3schools.com/tags/att_input_type.asp
                    'text',
                    'radio',
                    'password',
                    'number',
                    'hidden',
                    'tel',
                    'email',
                    'date',
                    'datetime-local',
                    'month',
                    'time',
                    'week',
                    'range',
                    'checkbox',
                    'button',
                    'color',
                    'file',
                    'image',
                    'reset',
                    'search',
                    'url',
                    'submit',
                ],
            })
            .prop('autoComplete', {
                editorType: 'StringWithExamplesEditor',
                examples: [
                    // See also: https://www.w3schools.com/tags/att_input_autocomplete.asp
                    'on',
                    'off',
                ],
            });
    },
    '@epam/uui-core:ICanBeInvalid': () => new DocBuilder<ICanBeInvalid>({ name: 'isInvalid' })
        .prop('isInvalid', { examples: [true] })
        .prop('validationProps', {
            editorType: 'JsonEditor',
            examples: [
                {
                    name: 'Inner props',
                    value: {
                        prop_1: { isInvalid: true, validationMessage: 'Msg' },
                        prop_2: { isInvalid: false },
                    },
                },
            ],
        })
        .prop('validationMessage', {
            examples: getReactNodeExamples('Err msg'),
        }),
    '@epam/uui-core:IAnalyticableClick': () => new DocBuilder<IAnalyticableClick>({ name: '' })
        .prop('clickAnalyticsEvent', {
            examples: [
                { name: 'simple', value: { name: 'Some name' } },
                {
                    name: 'complex',
                    value: {
                        name: 'Some name',
                        otherProp1: 'test 1',
                        otherProp2: 'test 2',

                    },
                },
            ],
            editorType: 'JsonEditor',
        }),
    '@epam/uui-core:ICanRedirect': () => iCanRedirectDoc,
    '@epam/uui-core:PickerBaseOptions': () => pickerBaseOptionsDoc,
    '@epam/uui-core:IEditable': () => {
        return new DocBuilder<any>({ name: '' }).implements([iEditable]);
    },
};

/**
 * Resolve the prop editor based on the type it's inherited from.
 * See "public/docs/docsGenOutput/docsGenOutput.json" for details.
 */
export const buildByPropFromRef: TPropDocBuilder = (params) => {
    const { prop, skin } = params;
    const db: DocBuilder<any> = BY_PROP_FROM_REF[prop.from as TDocsGenExportedType]?.(skin);
    if (db) {
        const found = db.props.find((p) => p.name === prop.name);
        if (found) {
            const { name, ...details } = found;
            return details;
        }
    }
};
