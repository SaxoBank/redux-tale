import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from '../src';
import { takeEvery } from '../src/effects';

describe('take-every', () => {

    let sagaMiddleware;
    let store;
    let newState;
    let onerror;

    beforeEach(() => {
        sagaMiddleware = createSagaMiddleware();
        newState = {};
        store = createStore(
            () => newState,
            applyMiddleware(sagaMiddleware)
        );
        onerror = jest.fn();
        window.onerror = onerror;
    });

    afterEach(() => {
        window.onerror = null;
    });

    it('gets an action first argument', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        sagaMiddleware.run(takeEvery(1, every));
        const action = {
            type: 1,
            extra: true,
        };
        store.dispatch(action);
        expect(order).toEqual([action]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works resolving at end', () => {
        const order = [];

        function *every(action, ...args) {
            yield Promise.resolve();
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        store.dispatch({
            type: 1,
        });
        jest.runAllTimers();
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works resolving as it goes', () => {
        const order = [];

        function *every(action, ...args) {
            yield Promise.resolve();
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        jest.runAllTimers();
        store.dispatch({
            type: 1,
        });
        jest.runAllTimers();
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works sync', () => {
        const order = [];

        function *every(action, ...args) {
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        store.dispatch({
            type: 1,
        });
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('fires exceptions on window', () => {

        const exception = new Error();
        function *every() {
            throw exception;
        }

        sagaMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        expect(onerror).toHaveBeenCalledTimes(0);
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledTimes(2);
    });

    it('takes *', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        sagaMiddleware.run(takeEvery('*', every));
        const action = {
            type: 1,
            extra: true,
        };
        store.dispatch(action);
        expect(order).toEqual([action]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('takes function', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        sagaMiddleware.run(takeEvery((action) => action.extra, every));
        const action = {
            type: 1,
            extra: true,
        };
        store.dispatch(action);
        store.dispatch({
            type: 1,
            extra: false,
        });
        expect(order).toEqual([action]);
        expect(onerror).not.toHaveBeenCalled();
    });
});
