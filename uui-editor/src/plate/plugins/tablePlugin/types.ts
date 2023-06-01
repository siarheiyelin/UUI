import { TTableCellElement } from "@udecode/plate";

export type ExtendedTTableCellElement = TTableCellElement & {
    rowSpan?: number;
    colIndex?: number;
    data: {
        colSpan?: number;
        rowSpan?: number;
        colIndex?: number;
        style?: string;
    }
}
