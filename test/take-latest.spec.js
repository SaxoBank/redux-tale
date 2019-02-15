import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { takeLatest } from '../src/effects';

describe('take-every', () => {

    let taleMiddleware;
    let store;
    let newState;
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

    afterEach(() => {
        window.onerror = null;
    });

    it('cancels the first task and only completes the 2nd', () => {
        const order = [];

        function *latest(action) {
            yield Promise.resolve();
            order.push(action.order);
        }

        taleMiddleware.run(takeLatest(1, latest));
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

        taleMiddleware.run(takeLatest('*', latest));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        expect(onerror).toHaveBeenCalledTimes(2);
    });
});
