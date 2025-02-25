import * as React from 'react';
import { ButtonBaseProps, ButtonBase } from './ButtonBase';
import { IconContainer } from '../layout';
import css from './Button.module.scss';

export type IconButtonBaseProps = ButtonBaseProps & {};

export class IconButton extends ButtonBase<IconButtonBaseProps> {
    constructor(props: IconButtonBaseProps) {
        super(props);
    }

    getClassName() {
        return [css.container];
    }

    getChildren() {
        return <IconContainer key="icon" icon={ this.props.icon } />;
    }
}
