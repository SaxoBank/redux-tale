import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware, { delay } from '../src';
import { race, call } from '../src/effects';

describe('race', () => {

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

    it('races a never-ending task and a delay', () => {
        let raceValue = null;
        function *test() {
            raceValue = yield race({
                delayRunner: delay(1, 2),
                neverEndRunner: new Promise(() => {}),
            });
        }
        sagaMiddleware.run(test);
        jest.runAllTimers();
        expect(raceValue).toEqual({
            delayRunner: 2,
        });
    });

    it('races a delay and a sync task', () => {
        let raceValue = null;
        function *test() {
            raceValue = yield race({
                delayRunner: delay(1, 2),
                runner: call(function *() {
                    return 3;
                }),
            });
        }
        sagaMiddleware.run(test);
        expect(raceValue).toEqual({
            runner: 3,
        });
    });

    it('races two sync tasks', () => {
        let raceValue = null;
        let calledSecond = false;
        function *test() {
            raceValue = yield race({
                runner1: call(function *() {
                    return 1;
                }),
                runner2: call(function *() {
                    calledSecond = true;
                    return 2;
                }),
            });
        }
        sagaMiddleware.run(test);
        expect(raceValue).toEqual({
            runner1: 1,
        });
        expect(calledSecond).toEqual(false);
    });

    it('cancels tasks', () => {
        let raceValue = null;
        let iterations = 0;
        function *test() {
            raceValue = yield race({
                runner1: call(function *() {
                    while (true) {
                        yield delay(1);
                        iterations++;
                    }
                }),
                runner2: call(function *() {
                    yield delay(1);
                }),
            });
        }
        sagaMiddleware.run(test);
        jest.runAllTimers();
        jest.runAllTimers();
        expect(raceValue).toEqual({
            runner2: undefined,
        });
        expect(iterations).toEqual(1);
    });

    it('handles exceptions', () => {
        let raceValue = null;
        function *test() {
            try {
                yield race({
                    runner1: call(function *() {
                        yield delay(1);
                        throw 3;
                    }),
                    runner2: call(function *() {
                        yield delay(2);
                    }),
                });
            } catch (e) {
                raceValue = e;
            }
        }
        sagaMiddleware.run(test);
        jest.runAllTimers();
        expect(raceValue).toEqual({
            runner1: 3,
        });
    });
});
