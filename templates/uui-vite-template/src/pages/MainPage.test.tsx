import { MainPage } from './MainPage';
import {
    renderWithContextAsync,
    screen,
    setupComponentForTest,
    TestContextWrapper,
} from '../../test-utils/testUtils';
import { expect, test, describe, vi } from 'vitest';
import { fireEvent } from '@epam/uui-test-utils';

describe('MainPage', () => {
    test('should render link to UUI site', async () => {
        const { unmount } = await renderWithContextAsync(<MainPage />);
        const linkElement = screen.getByText(/uui.epam.com/i);
        expect(linkElement).toBeDefined();
        unmount();
    });
    test('with setup: should render link to UUI site', async () => {
        const { mocks } = await setupComponentForTest(
            () => {
                return {
                    onClick: vi.fn(),
                };
            },
            (props) => {
                return <MainPage {...props} />;
            },
            {
                wrapper: TestContextWrapper,
            }
        );

        const linkElement = screen.getByText(/uui.epam.com/i);
        expect(linkElement).toBeDefined();
        fireEvent.click(screen.getByRole('button'));
        expect(mocks.onClick).toHaveBeenCalled();
    });
});
