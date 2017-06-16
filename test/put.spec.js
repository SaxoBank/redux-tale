import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { put } from '../src/effects';

describe('put', () => {

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

    it('works', () => {
        function *test() {
            yield put({ type: 'update-state' });
        }

        newState = { a: 1 };
        expect(store.getState()).toEqual({});
        taleMiddleware.run(test);
        expect(store.getState()).toEqual(newState);
    });
});
