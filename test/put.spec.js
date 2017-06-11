import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from '../src';
import { put } from '../src/effects';

describe('put', () => {

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

    it('works', () => {
        function *test() {
            yield put({ type: 'update-state' });
        }

        newState = { a: 1 };
        expect(store.getState()).toEqual({});
        sagaMiddleware.run(test);
        expect(store.getState()).toEqual(newState);
    });
});
