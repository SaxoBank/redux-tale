import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';

describe('basic tests', () => {

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

});
