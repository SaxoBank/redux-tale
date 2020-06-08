/* eslint max-nested-callbacks: "off" */
import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { spawn } from '../src/effects';

describe('spawn', () => {

    let taleMiddleware;
    let newState;
    let onerror;

    beforeEach(() => {
        taleMiddleware = createTaleMiddleware();
        newState = {};
        createStore(
            () => newState,
            applyMiddleware(taleMiddleware)
        );
        onerror = jest.fn();
        window.onerror = onerror;
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

    describe('whenDone', () => {
        it('works when sync', () => {
            const order = [];
            function *test() {
                const task = yield spawn(function*() {
                    order.push(1);
                });
                task.whenDone().then((resolvedTask) => {
                    order.push(2);
                    expect(resolvedTask).toBe(task);
                });
            }
            taleMiddleware.run(test);
            jest.runAllTimers();
            expect(order).toEqual([1, 2]);
            expect(onerror).not.toHaveBeenCalled();
        });

        it('works when async', () => {
            const order = [];
            function *test() {
                const task = yield spawn(function*() {
                    order.push(1);
                    yield Promise.resolve();
                    order.push(2);
                });
                task.whenDone().then((resolvedTask) => {
                    order.push(3);
                    expect(resolvedTask).toBe(task);
                });
            }
            taleMiddleware.run(test);
            jest.runAllTimers();
            expect(order).toEqual([1, 2, 3]);
            expect(onerror).not.toHaveBeenCalled();
        });

        it('works when async depending on sub spawn', () => {
            const order = [];
            function *test() {
                function *subAsyncGen() {
                    return yield Promise.resolve();
                }
                const task = yield spawn(function*() {
                    order.push(1);
                    yield subAsyncGen();
                    order.push(2);
                });
                task.whenDone().then((resolvedTask) => {
                    order.push(3);
                    expect(resolvedTask).toBe(task);
                });
            }
            taleMiddleware.run(test);
            jest.runAllTimers();
            expect(order).toEqual([1, 2, 3]);
        });
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
        expect(onerror).toHaveBeenCalledTimes(1);
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

    it('fires exceptions on window when throwing sync', () => {
        function *test() {
            yield spawn(function* test2() {
                throw new Error();
            });
        }
        taleMiddleware.run(test);
        expect(onerror).toHaveBeenCalledTimes(1);
    });

    it('fires exceptions on window when throwing async', () => {
        function *test() {
            yield spawn(function*() {
                yield Promise.resolve();
                throw new Error();
            });
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledTimes(1);
    });
});
