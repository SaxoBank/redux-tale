import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from '../src';
import { takeLatest } from '../src/effects';

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

    it('cancels the first task and only completes the 2nd', () => {
        const order = [];

        function *latest(action) {
            yield Promise.resolve();
            order.push(action.order);
        }

        sagaMiddleware.run(takeLatest(1, latest));
        store.dispatch({
            type: 1,
            order: 1,
        });
        store.dispatch({
            type: 1,
            order: 2,
        });
        jest.runAllTimers();
        expect(order).toEqual([2]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('fires exceptions on window', () => {

        const exception = new Error();
        function *latest() {
            throw exception;
        }

        sagaMiddleware.run(takeLatest('*', latest));
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
});
