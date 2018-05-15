import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { takeEvery } from '../src/effects';

describe('exceptions', () => {

    let taleMiddleware;
    let newState;
    let store;
    let onerror;

    beforeEach(() => {
        taleMiddleware = createTaleMiddleware();
        newState = {};
        store = createStore(
            () => newState,
            applyMiddleware(taleMiddleware)
        );
        onerror = jest.fn();
        window.onerror = onerror;
    });

    it('handles rejected promises', () => {
        const order = [];
        function *test() {
            try {
                yield Promise.reject(1);
            } catch (e) {
                order.push(e);
            }
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1]);
    });

    it('continues to work after absorbing an exception', () => {
        const order = [];
        function *test() {
            try {
                yield Promise.reject(1);
            } catch (e) {
                order.push(e);
            }
            order.push(2);
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
    });

    it('handles rejected generators', () => {
        const order = [];
        function *test() {
            try {
                yield (function *() {
                    throw 1;
                })();
            } catch (e) {
                order.push(e);
            }
            order.push(2);
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
    });

    it('handles a generator yielding a rejected promise', () => {
        const order = [];
        function *test() {
            try {
                yield (function *() {
                    yield Promise.reject(1);
                })();
            } catch (e) {
                order.push(e);
            }
            order.push(2);
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
    });

    it('handles a generator yielding a rejected promise with a yield in the catch', () => {
        const order = [];
        function *test() {
            try {
                yield (function *() {
                    yield Promise.reject(1);
                })();
            } catch (e) {
                order.push(yield e);
            }
            order.push(yield 2);
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
    });

    it('handles a rejected promise in an array (rejecting first)', () => {
        const order = [];
        function *test() {
            try {
                const result = yield [
                    Promise.reject(1),
                    Promise.resolve(2),
                ];
                order.push(result);
            } catch (e) {
                order.push(e);
            }
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1]);
    });

    it('handles a rejected promise in an array (rejecting last)', () => {
        const order = [];
        function *test() {
            try {
                const result = yield [
                    Promise.resolve(2),
                    Promise.reject(1),
                ];
                order.push(result);
            } catch (e) {
                order.push(e);
            }
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1]);
    });

    it('fires exceptions on window for Error', () => {
        const exception = new Error('an error');
        function *every() {
            throw exception;
        }

        taleMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        expect(onerror).not.toHaveBeenCalled();
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledWith({
            message: 'Unhandled exception in tale: Error: an error',
            stack: exception.stack,
        });
    });

    it('fires exceptions on window for objects', () => {
        const error = {
            a: 1,
            b: 2,
        };

        function *every() {
            throw error;
        }

        taleMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        expect(onerror).not.toHaveBeenCalled();
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledWith({
            message: 'Unhandled exception in tale: {\n\t"a": 1,\n\t"b": 2\n}',
        });
    });

    it('fires exceptions on window for strings', () => {
        const error = 'error';

        function *every() {
            throw error;
        }

        taleMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        expect(onerror).not.toHaveBeenCalled();
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledWith({
            message: 'Unhandled exception in tale: error',
        });
    });
});
