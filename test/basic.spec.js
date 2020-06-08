import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';

describe('basic tests', () => {

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

    it('runs a generator immediately', () => {
        let isRun = false;

        function *test() {
            isRun = true;
        }

        taleMiddleware.run(test);
        expect(isRun).toEqual(true);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('handles a promise resolving', () => {
        let isRun = false;

        function *test() {
            isRun = yield new Promise((resolve) => {
                resolve(true);
            });
        }

        taleMiddleware.run(test);
        expect(isRun).toEqual(false);
        jest.runAllTimers();
        expect(isRun).toEqual(true);
        expect(onerror).not.toHaveBeenCalled();
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

        taleMiddleware.run(test);
        expect(isRun).toEqual(false);
        jest.runAllTimers();
        expect(isRun).toEqual(true);
        expect(onerror).not.toHaveBeenCalled();
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

        taleMiddleware.run(test);
        expect(isRun1).toEqual(false);
        expect(isRun2).toEqual(false);
        jest.runAllTimers();
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

        taleMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles yielding a generator synchronously and returns value', () => {
        let isRun = false;

        function *test() {
            isRun = yield (function *test2() {
                return true;
            })();
        }

        taleMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles an array of one static value', () => {
        let isRun = false;

        function *test() {
            [isRun] = yield [true];
        }

        taleMiddleware.run(test);
        expect(isRun).toEqual(true);
    });

    it('handles an array of two static values', () => {
        let isRun1 = false;
        let isRun2 = false;

        function *test() {
            [isRun1, isRun2] = yield [1, 2];
        }

        taleMiddleware.run(test);
        expect(isRun1).toEqual(1);
        expect(isRun2).toEqual(2);
    });

    it('handles yielding falsy values', () => {
        let isNull = false;

        function *test() {
            isNull = yield null;
        }

        taleMiddleware.run(test);
        expect(isNull).toEqual(null);
    });

    it('handles yielding an array of falsy values', () => {
        let result = false;

        function *test() {
            result = yield [null, undefined];
        }

        taleMiddleware.run(test);
        expect(result).toEqual([null, undefined]);
    });

    it('unknown effects throw an error', () => {
        function *test() {
            yield {
                __reduxTaleType: 'nonExistingEffect',
            };
        }

        let exception = null;
        try {
            taleMiddleware.run(test);
        } catch (e) {
            exception = e;
        }
        expect(exception.message).toEqual('unrecognised redux tale effect');
    });

    it('handles an array of two promises', () => {
        let isRun1 = false;
        let isRun2 = false;

        function *test() {
            [isRun1, isRun2] = yield [Promise.resolve(1), Promise.resolve(2)];
        }

        taleMiddleware.run(test);
        expect(isRun1).toEqual(false);
        expect(isRun2).toEqual(false);
        jest.runAllTimers();
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

        taleMiddleware.run(test);
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

        taleMiddleware.run(test);
        jest.runAllTimers();
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

        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(isRun).toEqual(true);
        expect(order).toEqual([1, 2, 3]);
    });

    it('bubbles exceptions to window.onError - sync', () => {
        function *test() {
            throw new Error();
        }

        taleMiddleware.run(test);
        expect(onerror).toHaveBeenCalledTimes(1);
    });

    it('bubbles exceptions to window.onError - sync', () => {
        function *test() {
            yield Promise.resolve();
            throw new Error();
        }

        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledTimes(1);
    });
});
