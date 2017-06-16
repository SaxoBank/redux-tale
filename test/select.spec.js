import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { select } from '../src/effects';

describe('select', () => {

    let taleMiddleware;
    let store;
    let newState;

    beforeEach(() => {
        taleMiddleware = createTaleMiddleware();
        newState = {};
        store = createStore(
            () => newState,
            applyMiddleware(taleMiddleware)
        );
    });

    it('works with no arguments', () => {
        const order = [];

        function *test() {
            order.push(yield select());
        }

        newState = { a: 1 };
        store.dispatch({ type: 'update-state' });
        taleMiddleware.run(test);
        expect(order).toEqual([newState]);
    });

    it('works with a selector', () => {
        const order = [];

        function *test() {
            order.push(yield select((state) => state.a));
        }

        newState = { a: 1 };
        store.dispatch({ type: 'update-state' });
        taleMiddleware.run(test);
        expect(order).toEqual([1]);
    });

    it('works with a selector and args', () => {
        let order = [];

        function *test() {
            order = yield select((state, b) => [state.a, b], 2);
        }

        newState = { a: 1 };
        store.dispatch({ type: 'update-state' });
        taleMiddleware.run(test);
        expect(order).toEqual([1, 2]);
    });
});
