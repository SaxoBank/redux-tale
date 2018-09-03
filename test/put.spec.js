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

    it('throws when put throws', () => {

        const reducerError = new Error();
        let thrown;

        function *test() {
            try {
                yield put({ type: 'update-state' });
            } catch (e) {
                thrown = e;
            }
        }

        store = createStore(
            (action) => {
                if (action) {
                    throw reducerError;
                }
                return {};
            },
            applyMiddleware(taleMiddleware)
        );

        taleMiddleware.run(test);
        expect(thrown).toEqual(reducerError);
    });
});
