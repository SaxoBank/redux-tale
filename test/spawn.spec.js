import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { spawn } from '../src/effects';

describe('spawn', () => {

    let taleMiddleware;
    let newState;

    beforeEach(() => {
        taleMiddleware = createTaleMiddleware();
        newState = {};
        createStore(
            () => newState,
            applyMiddleware(taleMiddleware)
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
        taleMiddleware.run(test);
        jest.runAllTimers();
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
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1, 2]);
    });

    it('spawned tasks have isRunning - returns true when done', () => {
        let task;
        function *test() {
            task = yield spawn(function* test2() {
                return 1;
            });
        }
        taleMiddleware.run(test);
        expect(task.isRunning()).toEqual(false);
    });

    it('spawned tasks have isRunning - returns false when in progress', () => {
        let task;
        function *test() {
            task = yield spawn(function* test2() {
                yield new Promise(() => {});
            });
        }
        taleMiddleware.run(test);
        expect(task.isRunning()).toEqual(true);
    });
});
