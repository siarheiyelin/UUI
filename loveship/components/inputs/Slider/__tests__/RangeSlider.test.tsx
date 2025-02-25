import React from 'react';
import { renderSnapshotWithContextAsync } from '@epam/uui-test-utils';
import { RangeSlider } from '../RangeSlider';

describe('RangeSlider', () => {
    it('should be rendered correctly', async () => {
        const tree = await renderSnapshotWithContextAsync(<RangeSlider min={ 1 } max={ 100 } step={ 5 } value={ 50 } onValueChange={ jest.fn() } />);
        expect(tree).toMatchSnapshot();
    });

    it('should be rendered correctly with extra props', async () => {
        const tree = await renderSnapshotWithContextAsync(<RangeSlider min={ 1 } max={ 100 } step={ 5 } value={ 50 } onValueChange={ jest.fn() } color="sun" />);
        expect(tree).toMatchSnapshot();
    });
});
