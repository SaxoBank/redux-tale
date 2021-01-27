import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { takeEvery, put } from '../src/effects';

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

    it('gets an action first argument', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        taleMiddleware.run(takeEvery(1, every));
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

        taleMiddleware.run(takeEvery(1, every, 2, 3));
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

        taleMiddleware.run(takeEvery(1, every, 2, 3));
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

    it('allows multiple tasks to run in parallel', () => {
        const order = [];

        function *every(action) {
            yield Promise.resolve();
            order.push(action.order);
        }

        taleMiddleware.run(takeEvery(1, every));
        store.dispatch({
            type: 1,
            order: 1,
        });
        store.dispatch({
            type: 1,
            order: 2,
        });
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works sync', () => {
        const order = [];

        function *every(action, ...args) {
            order.push(args);
        }

        taleMiddleware.run(takeEvery(1, every, 2, 3));
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

        taleMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        expect(onerror).toHaveBeenCalledTimes(2);
    });

    it('continues after error', () => {

        const order = [];
        const exception = new Error();
        function *every(action) {
            if (action.type === 1) {
                throw exception;
            }
            order.push(action);
        }

        taleMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        expect(onerror).toHaveBeenCalledTimes(1);
        expect(order).toEqual([{
            type: 2,
        }]);
    });

    it('errors from triggered sagas don\'t bubble', () => {

        const order = [];
        function *every(action) {
            yield put({ type: 'fail' });
            order.push(action);
        }
        function *fail() {
            throw new Error();
        }

        taleMiddleware.run(takeEvery('*', every));
        taleMiddleware.run(takeEvery('fail', fail));

        const action1 = {
            type: 1,
        };
        const action2 = {
            type: 2,
        };

        store.dispatch(action1);
        store.dispatch(action2);
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledTimes(2);
        expect(order).toEqual([action1, action2]);
    });

    it('takes *', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        taleMiddleware.run(takeEvery('*', every));
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

        taleMiddleware.run(takeEvery((action) => action.extra, every));
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

    it('takes toolkit action creator', () => {
        const order = [];

        function actionCreator() {
            return { type: '3' };
        }
        actionCreator.type = '3';

        function *every(action) {
            order.push(action);
        }

        taleMiddleware.run(takeEvery(actionCreator, every));
        const action = {
            type: 1,
        };
        store.dispatch(action);
        store.dispatch(actionCreator());
        expect(order).toEqual([actionCreator()]);
        expect(onerror).not.toHaveBeenCalled();
    });
});
