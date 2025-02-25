import * as React from 'react';
import { DataRowProps, DataSourceListProps, DropdownBodyProps, isMobile } from '@epam/uui-core';
import { PickerBodyBaseProps, PickerInputBaseProps, usePickerInput } from '@epam/uui-components';
import { DataPickerRow, PickerItem, DataPickerBody, DataPickerFooter, PickerInputProps } from '../pickers';

const pickerHeight = 300;

type FilterPickerBodyProps<TItem, TId> = DropdownBodyProps & PickerInputBaseProps<TItem, TId> & {
    showSearch?: boolean;
};

export function FilterPickerBody<TItem, TId>(props: FilterPickerBodyProps<TItem, TId>) {
    const shouldShowBody = () => props.isOpen;

    const {
        getName,
        isSingleSelect,
        getRows,
        dataSourceState,
        getFooterProps,
        getPickerBodyProps,
        getListProps,
        handleDataSourceValueChange,
    } = usePickerInput<TItem, TId, PickerInputProps>({ ...props, shouldShowBody });

    const renderItem = (item: TItem, rowProps: DataRowProps<TItem, TId>) => {
        return <PickerItem title={ getName(item) } size="36" { ...rowProps } />;
    };

    const onSelect = (row: DataRowProps<TItem, TId>) => {
        props.onClose();
        handleDataSourceValueChange({ ...dataSourceState, search: '', selectedId: row.id });
    };

    const renderRow = (rowProps: DataRowProps<TItem, TId>) => {
        if (rowProps.isSelectable && isSingleSelect() && props.editMode !== 'modal') {
            rowProps.onSelect = onSelect;
        }

        return props.renderRow ? (
            props.renderRow(rowProps, dataSourceState)
        ) : (
            <DataPickerRow { ...rowProps } key={ rowProps.rowKey } borderBottom="none" size="36" padding="12" renderItem={ renderItem } />
        );
    };

    const renderFooter = () => {
        return <DataPickerFooter { ...getFooterProps() } size="36" />;
    };

    const renderBody = (bodyProps: DataSourceListProps & Omit<PickerBodyBaseProps, 'rows'>, rows: DataRowProps<TItem, TId>[]) => {
        const renderedDataRows = rows.map((props) => renderRow(props));
        const maxHeight = isMobile() ? document.documentElement.clientHeight : props.dropdownHeight || pickerHeight;
        const maxWidth = isMobile() ? undefined : 360;

        return (
            <>
                <DataPickerBody
                    { ...bodyProps }
                    selectionMode={ props.selectionMode }
                    rows={ renderedDataRows }
                    maxHeight={ maxHeight }
                    maxWidth={ maxWidth }
                    searchSize="36"
                    editMode="dropdown"
                />
                {renderFooter()}
            </>
        );
    };

    const rows = getRows();

    return renderBody({ ...getPickerBodyProps(rows), ...getListProps(), showSearch: props.showSearch ?? true }, rows);
}
