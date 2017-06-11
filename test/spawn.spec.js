import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';
import { spawn } from '../src/effects';

describe('spawn', () => {

    mockPromiseHelper.use();

    let sagaMiddleware;
    let newState;

    beforeEach(() => {
        sagaMiddleware = createSagaMiddleware();
        newState = {};
        createStore(
            () => newState,
            applyMiddleware(sagaMiddleware)
        );
    });

    it('spawns tasks without waiting', () => {
        const order = [];
        function *test() {
            yield spawn(function* test2(...args) {
                yield Promise.resolve(1);
                order.push(args);
            }, 3, 4);
            yield spawn(function* test3(...args) {
                order.push(args);
            }, 1, 2);
        }
        sagaMiddleware.run(test);
        mockPromiseHelper.tick();
        expect(order).toEqual([[1, 2], [3, 4]]);
    });

    it('spawned tasks throwing have no effect on the parent', () => {
        const order = [];
        function *test() {
            yield spawn(function* test2() {
                yield Promise.reject(1);
            });
            order.push(yield Promise.resolve(1));
            yield spawn(function* test3() {
                order.push(2);
            });
        }
        sagaMiddleware.run(test);
        mockPromiseHelper.tick();
        expect(order).toEqual([1, 2]);
    });
});
