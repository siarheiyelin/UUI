import * as React from 'react';
import { CX } from '../types';
import { forwardRef } from './forwardRef';

type OmitUnion<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export type OmitForwardedRef<TProps> = 'forwardedRef' extends keyof TProps
    ? OmitUnion<TProps, 'forwardedRef'> & { ref?: TProps['forwardedRef'] | undefined }
    : TProps;

export function withMods<TProps, TMods = {}>(
    Component: React.ComponentType<TProps> | React.NamedExoticComponent<TProps>,
    getCx?: (props: Readonly<OmitForwardedRef<TProps> & TMods>) => CX,
    getProps?: (props: Readonly<OmitForwardedRef<TProps> & TMods>) => Partial<TProps>,
) {
    const wrappedComponent = forwardRef<any, OmitForwardedRef<TProps> & TMods>((props, ref) => {
        // Most components are wrapped in withMods component.
        // Please keep this method simple, and performant
        // Don't clone objects/arrays if not needed

        const allProps: any = { ...props };

        if (getProps) {
            Object.assign(allProps, getProps?.(props));
        }

        const getCxResult = getCx?.(props);

        if (getCxResult) {
            allProps.cx = [getCxResult, (props as any).cx];
        }

        if (Component.prototype instanceof React.Component) {
            allProps.forwardedRef = ref;
        } else {
            allProps.ref = ref;
        }

        return React.createElement(Component, allProps);
    });

    (wrappedComponent as any).displayName = `${Component?.displayName || Component?.name || 'unknown'} (withMods)`;

    return wrappedComponent;
}
