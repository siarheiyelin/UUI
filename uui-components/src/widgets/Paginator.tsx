import * as React from 'react';
import range from 'lodash.range';
import {
    IAnalyticableOnChange, IEditable, IHasRawProps, UuiContext, UuiContexts,
} from '@epam/uui-core';

export interface PaginatorParams extends IHasRawProps<React.HTMLAttributes<HTMLElement>> {
    size: '24' | '30';
    pages: PaginatorItem[];
    goToNext(): void;
    goToPrev(): void;
    isLast: boolean;
    isFirst: boolean;
}

interface PaginatorItem {
    type: 'page' | 'spacer';
    pageNumber?: number;
    isActive?: boolean;
    onClick?(): void;
}

export interface PaginatorProps extends IEditable<number>, IAnalyticableOnChange<number>, IHasRawProps<React.HTMLAttributes<HTMLElement>> {
    /** Component size */
    size: '24' | '30';

    /** Total number of pages */
    totalPages: number;

    /** Override default rendering, keeping the component behavior */
    render?(params: PaginatorParams): any;
}

const FIRST_PAGE = 1;
const SIMPLE_PAGINATION_ITEMS = 7;

export class Paginator extends React.Component<PaginatorProps> {
    static contextType = UuiContext;
    context: UuiContexts;

    private getCurrentPage = () => this.props.value ?? 1;

    // size = this.props.size || '36';
    isFirst = () => {
        return this.getCurrentPage() === FIRST_PAGE;
    };

    isLast = () => {
        return this.getCurrentPage() === this.props.totalPages;
    };

    getPagesView(): PaginatorItem[] {
        const paginatorItems: PaginatorItem[] = [];
        const pages = this.props.totalPages;
        const currentPage = this.getCurrentPage();
        const currentValue = this.props.value;

        const onClick = (value: number) => {
            this.props.onValueChange(value);

            if (this.props.getValueChangeAnalyticsEvent) {
                const event = this.props.getValueChangeAnalyticsEvent(value, currentValue);
                this.context.uuiAnalytics.sendEvent(event);
            }
        };

        function addPage(page: number) {
            if (page !== currentValue) {
                return paginatorItems.push({ type: 'page', pageNumber: page, onClick: () => onClick(page) });
            }
            return paginatorItems.push({
                type: 'page', pageNumber: page, onClick: () => onClick(page), isActive: true,
            });
        }

        function addSpacer() {
            return paginatorItems.push({ type: 'spacer' });
        }

        // If the number of pages is not more than the maximum number of displayed pages, then we add all pages to the array

        if (pages <= SIMPLE_PAGINATION_ITEMS) {
            range(1, pages + 1).forEach((pageNumber: number) => {
                addPage(pageNumber);
            });
        }

        // If the number of pages exceeds the maximum number of displayed pages

        if (pages > SIMPLE_PAGINATION_ITEMS) {
            // If the current page is less than the maximum number of pages displayed at the beginning before the spacer,
            // we show the couple pages, spacer and the last page
            if (currentPage < 5) {
                range(1, 6).forEach((pageNumber: number) => addPage(pageNumber));
                addSpacer();
                addPage(pages);
            }

            // If the current page is greater than the maximum number of pages that are shown at the beginning
            // and less than the maximum number of pages that are shown at the end
            // to show the first page, a spacer, three pages of the current, spacer, and the last page
            if (currentPage > pages - 4) {
                addPage(1);
                addSpacer();
                range(pages - 4, pages + 1).forEach((pageNumber: number) => addPage(pageNumber));
            }

            // If the current page is greater than the maximum number of pages displayed at the end after the spacer,
            // we show the first page, spacer and last pages
            if (currentPage > 4 && currentPage < pages - 3) {
                addPage(1);
                addSpacer();
                range(currentPage - 1, currentPage + 2).forEach((pageNumber: number) => addPage(pageNumber));
                addSpacer();
                addPage(pages);
            }
        }

        return paginatorItems;
    }

    goToNext = () => {
        this.props.onValueChange((this.props.value ?? 0) + 1);
    };

    goToPrev = () => {
        const currentPage = this.props.value ?? 0;
        const prevPage = Math.max(currentPage - 1, 0);
        this.props.onValueChange(prevPage);
    };

    render() {
        return this.props.render({
            size: this.props.size,
            pages: this.getPagesView(),
            goToNext: this.goToNext,
            goToPrev: this.goToPrev,
            isFirst: this.isFirst(),
            isLast: this.isLast(),
            rawProps: this.props.rawProps,
        });
    }
}
