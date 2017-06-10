/* eslint no-throw-literal:"off" */
import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';
import { take, spawn, takeEvery, select, put } from '../src/effects';

describe('redux-saga', () => {

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

    it('runs a generator immediately', () => {
        let isRun = false;
        function *test() {
            isRun = true;
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles a promise resolving', () => {
        let isRun = false;
        function *test() {
            isRun = yield new Promise((resolve) => {
                resolve(true);
            });
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(false);
        mockPromiseHelper.tick();
        expect(isRun).toEqual(true);
    });

    it('handles a promise rejecting', () => {
        let isRun = false;
        function *test() {
            try {
                yield new Promise((resolve, reject) => {
                    reject(true);
                });
            } catch (e) {
                isRun = e;
            }
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(false);
        mockPromiseHelper.tick();
        expect(isRun).toEqual(true);
    });

    it('handles multiple promises', () => {
        let isRun1 = false;
        let isRun2 = false;
        function *test() {
            isRun1 = yield new Promise((resolve) => {
                resolve(1);
            });
            isRun2 = yield new Promise((resolve) => {
                resolve(2);
            });
        }
        sagaMiddleware.run(test);
        expect(isRun1).toEqual(false);
        expect(isRun2).toEqual(false);
        mockPromiseHelper.tick();
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles yielding a generator synchronously', () => {
        let isRun = false;
        function *test() {
            yield (function *test2() {
                isRun = true;
            })();
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles yielding a generator synchronously and returns value', () => {
        let isRun = false;
        function *test() {
            isRun = yield (function *test2() {
                return true;
            })();
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles an array of one static value', () => {
        let isRun = false;
        function *test() {
            [isRun] = yield [true];
        }
        sagaMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles an array of two static values', () => {
        let isRun1 = false;
        let isRun2 = false;
        function *test() {
            [isRun1, isRun2] = yield [1, 2];
        }
        sagaMiddleware.run(test);
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles yielding falsy values', () => {
        let isNull = false;
        function *test() {
            isNull = yield null;
        }
        sagaMiddleware.run(test);
        expect(isNull).toEqual(null);
    });

    it('handles yielding an array of falsy values', () => {
        let result = false;
        function *test() {
            result = yield [null, undefined];
        }
        sagaMiddleware.run(test);
        expect(result).toEqual([null, undefined]);
    });

    it('handles an array of two promises', () => {
        let isRun1 = false;
        let isRun2 = false;
        function *test() {
            [isRun1, isRun2] = yield [Promise.resolve(1), Promise.resolve(2)];
        }
        sagaMiddleware.run(test);
        expect(isRun1).toEqual(false);
        expect(isRun2).toEqual(false);
        mockPromiseHelper.tick();
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles an array of two sync generators', () => {
        let isRun1 = false;
        let isRun2 = false;
        function *test() {
            [isRun1, isRun2] = yield [
                (function *() {
                    return 1;
                })(),
                (function *() {
                    return 2;
                })(),
            ];
        }
        sagaMiddleware.run(test);
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles an array of two async generators', () => {
        let isRun1 = false;
        let isRun2 = false;
        function *test() {
            [isRun1, isRun2] = yield [
                (function *() {
                    return yield Promise.resolve(1);
                })(),
                (function *() {
                    return yield Promise.resolve(2);
                })(),
            ];
        }
        sagaMiddleware.run(test);
        mockPromiseHelper.tick();
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles an array of two async generators and continues past promise', () => {
        let isRun = false;
        const order = [];
        function *test() {
            const [one, two] = yield [
                (function *() {
                    yield Promise.resolve('my task now resolves after the 2nd tick');
                    order.push(2);
                    return yield Promise.resolve(1);
                })(),
                (function *() {
                    order.push(1);
                    return yield Promise.resolve(2);
                })(),
            ];
            order.push(3);
            const three = yield Promise.resolve(3);
            isRun = (one + two + three) === 6;
        }
        sagaMiddleware.run(test);
        mockPromiseHelper.tick();
        expect(isRun).toEqual(true);
        expect(order).toEqual([1, 2, 3]);
    });

    describe('exceptions', () => {
        it('handles rejected promises', () => {
            const order = [];
            function *test() {
                try {
                    yield Promise.reject(1);
                } catch (e) {
                    order.push(e);
                }
            }
            sagaMiddleware.run(test);
            mockPromiseHelper.tick();
            expect(order).toEqual([1]);
        });

        it('handles rejected generators', () => {
            const order = [];
            function *test() {
                try {
                    yield (function *() {
                        throw 1;
                    })();
                } catch (e) {
                    order.push(e);
                }
            }
            sagaMiddleware.run(test);
            mockPromiseHelper.tick();
            expect(order).toEqual([1]);
        });

        it('handles a generator yielding a rejected promise', () => {
            const order = [];
            function *test() {
                try {
                    yield (function *() {
                        yield Promise.reject(1);
                    })();
                } catch (e) {
                    order.push(e);
                }
            }
            sagaMiddleware.run(test);
            mockPromiseHelper.tick();
            expect(order).toEqual([1]);
        });

        it('handles a rejected promise in an array (rejecting first)', () => {
            const order = [];
            function *test() {
                try {
                    const result = yield [
                        Promise.reject(1),
                        Promise.resolve(2),
                    ];
                    order.push(result);
                } catch (e) {
                    order.push(e);
                }
            }
            sagaMiddleware.run(test);
            mockPromiseHelper.tick();
            expect(order).toEqual([1]);
        });

        it('handles a rejected promise in an array (rejecting last)', () => {
            const order = [];
            function *test() {
                try {
                    const result = yield [
                        Promise.resolve(2),
                        Promise.reject(1),
                    ];
                    order.push(result);
                } catch (e) {
                    order.push(e);
                }
            }
            sagaMiddleware.run(test);
            mockPromiseHelper.tick();
            expect(order).toEqual([1]);
        });
    });

    describe('take', () => {
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

    describe('spawn', () => {
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

    describe('take-every', () => {
        it('gets an action first argument', () => {
            const order = [];

            function *every(action) {
                order.push(action);
            }

            sagaMiddleware.run(takeEvery(1, every));
            const action = {
                type: 1,
                extra: true,
            };
            store.dispatch(action);
            expect(order).toEqual([action]);
        });

        it('works resolving at end', () => {
            const order = [];

            function *every(action, ...args) {
                yield Promise.resolve();
                order.push(args);
            }

            sagaMiddleware.run(takeEvery(1, every, 2, 3));
            store.dispatch({
                type: 1,
            });
            store.dispatch({
                type: 2,
            });
            store.dispatch({
                type: 1,
            });
            mockPromiseHelper.tick();
            expect(order).toEqual([[2, 3], [2, 3]]);
        });

        it('works resolving as it goes', () => {
            const order = [];

            function *every(action, ...args) {
                yield Promise.resolve();
                order.push(args);
            }

            sagaMiddleware.run(takeEvery(1, every, 2, 3));
            store.dispatch({
                type: 1,
            });
            store.dispatch({
                type: 2,
            });
            mockPromiseHelper.tick();
            store.dispatch({
                type: 1,
            });
            mockPromiseHelper.tick();
            expect(order).toEqual([[2, 3], [2, 3]]);
        });

        it('works sync', () => {
            const order = [];

            function *every(action, ...args) {
                order.push(args);
            }

            sagaMiddleware.run(takeEvery(1, every, 2, 3));
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
        });
    });

    describe('select', () => {
        it('works with no arguments', () => {
            const order = [];

            function *test() {
                order.push(yield select());
            }

            newState = { a: 1 };
            store.dispatch({ type: 'update-state' });
            sagaMiddleware.run(test);
            expect(order).toEqual([newState]);
        });

        it('works with a selector', () => {
            const order = [];

            function *test() {
                order.push(yield select((state) => state.a));
            }

            newState = { a: 1 };
            store.dispatch({ type: 'update-state' });
            sagaMiddleware.run(test);
            expect(order).toEqual([1]);
        });

        it('works with a selector and args', () => {
            let order = [];

            function *test() {
                order = yield select((state, b) => [state.a, b], 2);
            }

            newState = { a: 1 };
            store.dispatch({ type: 'update-state' });
            sagaMiddleware.run(test);
            expect(order).toEqual([1, 2]);
        });
    });

    describe('put', () => {
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
});
