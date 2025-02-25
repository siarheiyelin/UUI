import { ICheckable } from './props';
import { DataRowOptions, DataRowProps } from './dataRows';

export type SortDirection = 'asc' | 'desc';

export interface SortingOption<T = any> {
    /** Field of sorted entity under which sorting is performed */
    field: keyof T;
    /** Direction of a sorting */
    direction?: SortDirection;
}

export interface VirtualListRange {
    /**
     * Index of the topmost item, in rendered batch.
     * Note - this item might not be visible, as Virtual List maintain some reserve of rows on top / at the bottom of the list
     */
    topIndex?: number;
    /**
     * Number of currently rendered items.
     * Virtual list updates this value automatically, if it too small.
     * Note Virtual List renders more items, that actually visible,
     * as it need maintain some reserve of rows on top / at the bottom of the list.
     */
    visibleCount?: number;
}

export type ScrollAlign = 'top' | 'nearest';

/**
 * Holds configuration of the force scrolling behavior.
 */
export interface ScrollToConfig {
    /** Index of the row to be scrolled to. */
    index?: number;

    /** Scrolling movement behavior. */
    behavior?: ScrollBehavior;

    /** Alignment behavior. This property specifies, to which position a row with an index should be scrolled to.
     * @default 'top'
     *
     * If `nearest` is specified, a list will be scrolled to a row in the nearest position only if row is not visible.
     * If a row is closer to the bottom, the list will be scrolled to the row in the bottom position of a scroll container.
     * If closer to the top, will be scrolled to the row in the top position.
     *
     * If `top` is specified, scrolling a list to a row to the top part of the container will happen in any case.
    */
    align?: ScrollAlign;
}

/** Holds state of a Virtual List - top visible item index, and estimated count of visible items */
export interface VirtualListState extends VirtualListRange {
    /**
     * Virtual list ensures that row with this Index is within the visible area, if not Virtual List .
     * Virtual list updates this value on scroll to null when appear in the visible area.
     * If this value is updated manually, Virtual List would scroll to the specified items.
     * It would attempt to put scroll so this item will be at the top of the list.
     */
    scrollTo?: ScrollToConfig;
    /**
     * Virtual List manually scroll to this Index when it appears not within the visible area.
     * It would attempt to put scroll so this item will be in the middle of the list.
     */
    focusedIndex?: number;
}

export interface IDataSource<TItem, TId, TFilter> {
    getId(item: TItem): TId;
    getById(id: TId): TItem | void;
    setItem(item: TItem): void;
    getView(value: DataSourceState<any, TId>, onValueChange: (val: DataSourceState<any, TId>) => any, options?: any): IDataSourceView<TItem, TId, TFilter>;
    useView(value: DataSourceState<any, TId>, onValueChange: (val: DataSourceState<any, TId>) => any, options?: any, deps?: any[]): IDataSourceView<TItem, TId, TFilter>;
    unsubscribeView(onValueChange: (val: DataSourceState<any, TId>) => any): void;
}

/** Holds state of a components displaying lists - like tables. Holds virtual list position, filter, search, selection, etc. */
export interface DataSourceState<TFilter = Record<string, any>, TId = any> extends VirtualListState {
    /**
     * Search value, used to filter data based on it.
     * Included in the API request object when using a LazyDataSource.
     * For Array and Async data sources, searching is performed internally by the datasource.
     * */
    search?: string;
    /** Array of checked items IDs */
    checked?: TId[];
    /**
     * A map of item IDs to their folding state.
     * If an item ID is present with a `true` value, it's folded; otherwise, it's not folded.
     * */
    folded?: Record<string, boolean>;
    /**
     * Filter value used to filter data based on it.
     * Included in the API request object when using a LazyDataSource.
     * For Array and Async data sources, filtering is performed internally by the datasource.
     * */
    filter?: TFilter;
    /**
     * Sorting value, used to sort data based on it.
     * Included in the API request object when using a LazyDataSource.
     * For Array and Async data sources, sorting is performed internally by the datasource.
     * */
    sorting?: SortingOption[];
    /** ID of selected item. It can be only one selected item at the moment. */
    selectedId?: TId;
    /** Index of currently focused item */
    focusedIndex?: number;
    /** Current page number */
    page?: number;
    /** The amount of items per page */
    pageSize?: number;
}

export const CascadeSelectionTypes = {
    IMPLICIT: 'implicit',
    EXPLICIT: 'explicit',
} as const;

export type CascadeSelection = boolean | typeof CascadeSelectionTypes.EXPLICIT | typeof CascadeSelectionTypes.IMPLICIT;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface BaseListViewProps<TItem, TId, TFilter> {
    /**
     * Should return unique ID of the TItem
     * If omitted, we assume that every TItem has and unique id in its 'id' field.
     * @param item An item to get ID of
     */
    getId?(item: TItem): TId;

    /**
     * Set to true, if you use IDs which can't act as javascript Map key (objects or arrays).
     * In this case, IDs will be internally JSON.stringify-ed to be used as Maps keys.
     */
    complexIds?: boolean;

    /** Should return ID of the Item's parent. Usually it's i => i.parentId.
     * If specified, Data Source will build items hierarchy.
     *
     * Also, it is used by LazyDataSource to pre-fetch missing parents of loaded items. This is required in following cases:
     * - when a child item is pre-selected, but not yet loaded at start. We need to load it's parent chain
     *   to highlight parents with selected children
     * - in flattenSearch mode, we usually want to display a path to each item (e.g. Canada/Ontario/Paris),
     *   We need to load parents with a separate call (if backend doesn't pre-fetch them)
     */
    getParentId?(item: TItem): TId | undefined;

    /**
     * Specifies if rows are selectable, checkable, draggable, clickable, and more.
     * See DataRowOptions for more details.
     * If options depends on the item itself, use getRowOptions.
     * Specifying both rowOptions and getRowOptions might help to render better loading skeletons: we use only rowOptions in this case, as we haven't loaded an item yet.
     * Make sure all callbacks are properly memoized, as changing them will trigger re-renders or row, which would impact performance
     * @param item An item to get options for
     */
    rowOptions?: DataRowOptions<TItem, TId>;

    /**
     * For each row, specify if row is selectable, editable, checkable, draggable, clickable, have its own set of columns, and more.
     * To make rows editable, pass IEditable interface to each row. This works the same way as for other editable components.
     * See DataRowOptions for more details.
     * If both getRowOptions and rowOptions specified, we'll use getRowOptions for loaded rows, and rowOptions only for loading rows.
     * Make sure all callbacks are properly memoized, as changing them will trigger re-renders or row, which would impact performance
     * @param item An item to get options for
     */
    getRowOptions?(item: TItem, index: number): DataRowOptions<TItem, TId>;

    /**
     * Can be specified to unfold all or some items at start.
     * If not specified, all rows would be folded.
     */
    isFoldedByDefault?(item: TItem): boolean;

    /**
     * Controls how the selection (checking items) of a parent node affects the selection of its all children, and vice versa.
     * - false: All nodes are selected independently (default).
     * - true or 'explicit': Selecting a parent node explicitly selects all its children. Unchecking the last parent's child unchecks its parent.
     * - 'implicit': Selecting a parent node means that all children are considered checked.
     *   The user sees all these nodes as checked on the UI, but only the selected parent is visible in the PickerInput tags, and only the checked
     *   parent is present in the Picker's value or DataSourceState.checked array. When the user unchecks the first child of such a parent,
     *   its parents become unchecked and all children but the unchecked one become checked, making children's selection explicit. If the last
     *   unchecked child gets checked, all children from the checked are removed, returning to the implicit state when only the parent is checked.
     */
    cascadeSelection?: CascadeSelection;

    /**
     * Enables or disables "select all" checkbox. Default is true.
     */
    selectAll?: true | false;

    /**
     * Enables background reloading of data on search/sort/filter/reload, which turns off the rows placeholders displaying while data loading.
     * During data reloading, previous data is displayed. To prevent any interaction with visible not actual rows, a blocker/spinner should be displayed.
     * In UUI components, such as `PickerInput`, `PickerList`, `PickerModal` and `DataTable`, blockers are added.
     * It is required to add blockers/spinners to the components, built on your own.
     * If reloading is started, `view.getListProps` returns `isReloading` flag, set to `true`.
     */
    backgroundReload?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IDataSourceView<TItem, TId, TFilter> = {
    getById(id: TId, index: number): DataRowProps<TItem, TId>;
    getListProps(): DataSourceListProps;
    getVisibleRows(): DataRowProps<TItem, TId>[];
    getSelectedRows(range?: VirtualListRange): DataRowProps<TItem, TId>[];
    getSelectedRowsCount(): number;
    reload(): void;
    destroy(): void;
    loadData(): void;
    clearAllChecked(): void;
    _forceUpdate(): void;
    selectAll?: ICheckable;
};

export type DataSourceListCounts = {
    /**
     * Count of rows, after applying filter, and folding on tree nodes.
     * Obsolete! Please switch to exactRowsCount / knownRowsCount
     */
    rowsCount?: number;

    /** Count of rows, if all rows loaded. Can be null while initial loading, or if API doesn't return count  */
    exactRowsCount?: number;

    /**
     * There's at least knownRowsCount rows. There can be more if list is lazy loaded.
     * Equals to exactRowsCount if all rows are loaded, or if API returns rows count
     * Otherwise, exactRowsCount will be null, and knownRowsCount will specify number of loaded rows.
     */
    knownRowsCount?: number;

    /** Total count of items, before applying the filter. If there's a tree, it counts all nodes, including folded children  */
    totalCount?: number;
};

export interface DataSourceListProps extends DataSourceListCounts {
    /**
     * ICheckable object for Select All behavior.
     * If omitted, Select All action will be absent.
     * */
    selectAll?: ICheckable;

    /** Signals that data is reloading on search/sort/filter/reload. */
    isReloading?: boolean;
}

// Lazy Data Source API

/** The range (from/count) of required rows for LazyDataSourceApiRequest */
export interface LazyDataSourceApiRequestRange {
    /** Element index to fetch from. */
    from: number;
    /** Count of elements to be retrieved. */
    count?: number;
}

/** Defines input arguments for Lazy Data Source APIs */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface LazyDataSourceApiRequest<TItem, TId = any, TFilter = {}> {
    /**
     * The filter object, by which data should be filtered.
     * It is a merged result of filters from DataSourceState and LazyDataSourceProps.
     */
    filter?: TFilter;
    /** Sorting options, by which data should be sorted. */
    sorting?: SortingOption[];
    /** The search string, by which data should be searched. */
    search?: string;
    /** Specifies a range of the rows to be retrieved. */
    range?: LazyDataSourceApiRequestRange;
    /** Page number for which data should be retrieved. */
    page?: number;
    /** Number of items at the page. */
    pageSize?: number;
    /**
     * An array of item IDs to be retrieved from the API.
     * Other request options like filter, search and others should be ignored when IDs are provided.
     * Used for requesting specific items separately from the list.
     */
    ids?: TId[];
}

/** Defines Lazy Data Source APIs response shape */
export interface LazyDataSourceApiResponse<TItem> {
    /** List of items which was requested via API */
    items: TItem[];

    /**
     * API can set 'from' field if it wants to return more items than what was requested in request.range.
     * This can be used to return all items at once (with from:0, count: totalCount), or align response to pages.
     */
    from?: number;

    /**
     * Total count of items which match current filter and pagination.
     * If not specified, total count will be detected only when user scrolls to the end of the list.
     */
    count?: number;

    /**
     * Total count of items which match current filter.
     */
    totalCount?: number;
}

/** Defines the context of API request. E.g. parent if we require to retrieve sub-list of the tree */
export interface LazyDataSourceApiRequestContext<TItem, TId> {
    /**
     * The ID of the parent item whose children are being requested.
     * Used for lazy-loading data in tree lists.
     */
    parentId?: TId | null;
    /** The parent entity whose children are being requested */
    parent?: TItem | null;
}

/** Defines API to retrieve data for DataSources */
export type LazyDataSourceApi<TItem, TId, TFilter> = (
    /** Defines input arguments for Lazy Data Source APIs */
    request: LazyDataSourceApiRequest<TItem, TId, TFilter>,
    /** Defines the context of API request. */
    context?: LazyDataSourceApiRequestContext<TItem, TId>
) => Promise<LazyDataSourceApiResponse<TItem>>;
