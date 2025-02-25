import React, { useMemo, createElement } from 'react';
import { FlexRow } from '@epam/promo';
import { AppHeader, Page, Sidebar } from '../common';
import { svc } from '../services';
import { getQuery } from '../helpers';
import { ComplexForm } from './forms/ComplexForm';
import { TagInputDemo } from './forms/TagInput';
import { DbDemo } from './db/DbDemo';
import { PersonsTableDemo } from './tables/PersonsTableDemo';
import { DemoTablePaged } from './tablePaged';
import { DraftRTEDemo } from './draft-rte/DraftRTEDemo';
import { ScrollSpyDemo } from './scroll-spy/ScrollSpyDemo';
import { Responsive } from './responsive/Responsive';
import { ThemeDemo } from './theme/ThemeDemo';
import { ThemeElectricDemo } from './theme-electric-test/ThemeDemo';
import { ProductsTableDemo } from './productsTable/ProductsTableDemo';
import { AdaptivePanelDemo } from './adaptivePanel/AdaptivePanelDemo';
import { TreeListItem } from '@epam/uui-components';
import { DataRowProps } from '@epam/uui-core';
import { Skills } from './skills';
import TableCellsStylesSandbox from './tableCellStyles/TableCellsStylesSandbox';
import { ProjectTasksDemo } from './tasks/ProjectTasksDemo';
import { RichTextEditorDemo } from './RTE/rteDemo';
import { TableColumnConfigModalTest } from './tableColConfigModal/TableColumnConfigModalTest';

export function SandboxPage() {
    const items = useMemo(
        () => [
            { id: 'complexForm', name: 'Complex Form', component: ComplexForm },
            { id: 'dbDemo', name: 'DB demo', component: DbDemo },
            { id: 'tableDemo', name: 'Persons Table', component: PersonsTableDemo },
            { id: 'productsTableDemo', name: 'Products Table', component: ProductsTableDemo },
            { id: 'projectTasksDemo', name: 'Project Tasks Demo', component: ProjectTasksDemo },
            { id: 'Draft', name: 'DRAFT RTE demo', component: DraftRTEDemo },
            { id: 'scrollSpy', name: 'Scroll Spy', component: ScrollSpyDemo },
            { id: 'responsive', name: 'Responsive', component: Responsive },
            { id: 'uui_theming', name: 'UUI Theming', component: ThemeDemo },
            { id: 'theme_electric', name: 'Theme Electric', component: ThemeElectricDemo },
            { id: 'DemoTablePaged', name: 'Table with paging', component: DemoTablePaged },
            { id: 'SkillsBatteryPopover', name: 'Skills', component: Skills },
            { id: 'TableCellsStylesSandbox', name: 'Table Cells/Rows styles', component: TableCellsStylesSandbox },
            { id: 'AdaptivePanel', name: 'Adaptive panel', component: AdaptivePanelDemo },
            { id: 'RTEDemo', name: 'RTE Demo', component: RichTextEditorDemo },
            { id: 'TableColumnsConfigurationModal', name: 'Table ColumnsConfigModal', component: TableColumnConfigModalTest },
            { id: 'tagInput', name: 'Tag Input', component: TagInputDemo },
        ],
        [],
    );

    if (!items.map((item) => item.id).includes(getQuery('id'))) {
        svc.uuiRouter.redirect({ pathname: '/sandbox', query: { id: items[0].id } });
    }

    const onChange = (val: DataRowProps<TreeListItem, string>) => {
        svc.uuiRouter.redirect({ pathname: '/sandbox', query: { id: val.id } });
    };

    return (
        <Page renderHeader={ () => <AppHeader /> }>
            <FlexRow alignItems="stretch" rawProps={ { style: { minHeight: 'calc(100vh - 60px)' } } }>
                <Sidebar
                    value={ getQuery('id') }
                    onValueChange={ onChange }
                    getItemLink={ (item) =>
                        !item.isFoldable && {
                            pathname: 'sandbox',
                            query: { id: item.id },
                        } }
                    items={ items }
                />
                {createElement(items.find((item) => item.id === getQuery('id')).component)}
            </FlexRow>
        </Page>
    );
}
