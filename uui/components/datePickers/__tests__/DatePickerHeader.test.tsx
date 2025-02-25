import * as React from 'react';
import dayjs from 'dayjs';

import { fireEvent, setupComponentForTest, screen, within } from '@epam/uui-test-utils';
import { DatePickerHeader, DatePickerHeaderProps, getNextListYearFromCurrent, getNextMonthFromCurrent, getNextYearFromCurrent } from '../DatePickerHeader';
import { ViewType } from '@epam/uui-components';

async function setupDatePickerHeader(params: { initialDate: string, viewType?: ViewType, onValueChange?: jest.Mock }) {
    const value = {
        view: params.viewType || 'DAY_SELECTION' as ViewType,
        selectedDate: '',
        displayedDate: dayjs(params.initialDate).startOf('day'),
    };

    const { result } = await setupComponentForTest<DatePickerHeaderProps>(
        (context) => ({
            value,
            onValueChange: params.onValueChange || jest.fn().mockImplementation((newValue) => {
                context.current.setProperty('value', newValue);
            }),
        }),
        (props) => <DatePickerHeader { ...props } />,
    );

    const [left, title, right] = within(screen.queryByRole('banner')).queryAllByRole('button');

    return {
        result,
        dom: { left, right, title },
    };
}

describe('DatePickerHeader', () => {
    describe('left arrow', () => {
        it('should change displayed date on left navigation arrow click', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'DAY_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.left);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'DAY_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2016-12-22').startOf('day'),
            });
        });

        it('should change displayed date on left navigation arrow click (month selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'MONTH_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.left);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'MONTH_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2016-01-22').startOf('day'),
            });
        });

        it('should change displayed date on left navigation arrow click (year selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'YEAR_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.left);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'YEAR_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2001-01-22').startOf('day'),
            });
        });
    });

    describe('right arrow', () => {
        it('should change displayed date on right navigation arrow click (day selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'DAY_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.right);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'DAY_SELECTION',
                selectedDate: '',
                displayedDate: getNextMonthFromCurrent(dayjs('2017-01-22').startOf('day')),
            });
        });

        it('should change displayed date on right navigation arrow click (month selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'MONTH_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.right);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'MONTH_SELECTION',
                selectedDate: '',
                displayedDate: getNextYearFromCurrent(dayjs('2017-01-22').startOf('day')),
            });
        });

        it('should change displayed date on right navigation arrow click (year selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2017-01-22', viewType: 'YEAR_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.right);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'YEAR_SELECTION',
                selectedDate: '',
                displayedDate: getNextListYearFromCurrent(dayjs('2017-01-22').startOf('day')),
            });
        });
    });

    describe('title', () => {
        it('should change displayed date on title click (year selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2018-01-22', viewType: 'YEAR_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.title);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'DAY_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2018-01-22').startOf('day'),
            });
        });

        it('should change displayed date on title click (month selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2018-01-22', viewType: 'MONTH_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.title);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'YEAR_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2018-01-22').startOf('day'),
            });
        });

        it('should change displayed date on title click (day selection)', async () => {
            const onValueChangeMock = jest.fn();
            const { dom } = await setupDatePickerHeader({ initialDate: '2018-01-22', viewType: 'DAY_SELECTION', onValueChange: onValueChangeMock });

            fireEvent.click(dom.title);

            expect(onValueChangeMock).toHaveBeenCalledWith({
                view: 'MONTH_SELECTION',
                selectedDate: '',
                displayedDate: dayjs('2018-01-22').startOf('day'),
            });
        });
    });
});
