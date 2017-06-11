import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';
import { take } from '../src/effects';

describe('take', () => {

    mockPromiseHelper.use();

    let sagaMiddleware;
    let store;
    let newState;

    beforeEach(() => {
        sagaMiddleware = createSagaMiddleware();
        newState = {};
        store = createStore(
            () => newState,
            applyMiddleware(sagaMiddleware)
        );
    });

    it('an action', () => {
        const order = [];
        function *test() {
            order.push(yield take());
        }
        sagaMiddleware.run(test);
        const action = {
            type: 1,
        };
        store.dispatch(action);
        expect(order).toEqual([action]);
    });

    it('a specific action', () => {
        const order = [];
        function *test() {
            order.push(yield take(2));
        }
        sagaMiddleware.run(test);
        const action = {
            type: 2,
        };
        store.dispatch({ type: 1 }); // ignores this action
        store.dispatch(action);
        expect(order).toEqual([action]);
    });

    it('an array of actions', () => {
        const order = [];
        function *test() {
            order.push(yield take([1, 2]));
        }
        sagaMiddleware.run(test);
        const action = {
            type: 2,
        };
        store.dispatch({ type: 3 }); // ignores this action
        store.dispatch(action);
        expect(order).toEqual([action]);
    });
});
