import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { take } from '../src/effects';

describe('take', () => {

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

    it('an action', () => {
        const order = [];
        function *test() {
            order.push(yield take());
        }
        taleMiddleware.run(test);
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
        taleMiddleware.run(test);
        const action = {
            type: 2,
        };
        store.dispatch({ type: 1 }); // ignores this action
        store.dispatch(action);
        expect(order).toEqual([action]);
    });

    it('a specific action with the toolkit matcher', () => {
        const order = [];
        function action() {
            return { type: '3' };
        }
        action.type = '3';
        function *test() {
            order.push(yield take(action));
        }
        taleMiddleware.run(test);
        store.dispatch({ type: 1 }); // ignores this action
        store.dispatch(action());
        expect(order).toEqual([action()]);
    });

    it('a specific action with the toolkit matcher and extra arg', () => {
        const order = [];
        function actionCreator(extra) {
            return { type: '3', extra };
        }
        actionCreator.type = '3';
        function *test() {
            order.push(yield take(
                actionCreator,
                (action) => action.extra === true)
            );
        }
        taleMiddleware.run(test);
        store.dispatch({ type: 1 }); // ignores this action
        store.dispatch(actionCreator(false)); // ignores this action
        store.dispatch(actionCreator(true));
        expect(order).toEqual([actionCreator(true)]);
    });

    it('an array of actions', () => {
        const order = [];
        function *test() {
            order.push(yield take([1, 2]));
        }
        taleMiddleware.run(test);
        const action = {
            type: 2,
        };
        store.dispatch({ type: 3 }); // ignores this action
        store.dispatch(action);
        expect(order).toEqual([action]);
    });
});
