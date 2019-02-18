import { logError } from '../src/log-error';

describe('log-error', () => {

    let onerror;

    beforeEach(() => {
        onerror = jest.fn();
        window.onerror = onerror;
    });

    it('logs an error', () => {
        const error = new Error('test');
        logError(error);
        jest.runAllTimers();

        expect(onerror).toHaveBeenCalledTimes(1);
        expect(onerror).toHaveBeenLastCalledWith(
            'Unhandled exception in tale: ' + error,
            '',
            0,
            0,
            {
                message: 'Unhandled exception in tale: ' + error,
                stack: error.stack,
            }
        );
    });

    it('doesn\'t log if no window.onerror', () => {

        window.onerror = undefined;
        logError(new Error('test'));
        jest.runAllTimers();

        expect(onerror).toHaveBeenCalledTimes(0);
    });

    it('logs an object', () => {
        const obj = {
            a: 1,
            b: 2,
            c: {
                d: 4,
            },
        };

        logError(obj);
        jest.runAllTimers();

        expect(onerror).toHaveBeenCalledTimes(1);
        expect(onerror).toHaveBeenLastCalledWith(
            'Unhandled exception in tale: ' + JSON.stringify(obj),
            '',
            0,
            0,
            {
                message: 'Unhandled exception in tale: ' + JSON.stringify(obj),
            }
        );
    });

    it('logs a primitive', () => {
        logError(1);
        jest.runAllTimers();

        expect(onerror).toHaveBeenCalledTimes(1);
        expect(onerror).toHaveBeenLastCalledWith(
            'Unhandled exception in tale: ' + 1,
            '',
            0,
            0,
            {
                message: 'Unhandled exception in tale: ' + 1,
            }
        );
    });
});
