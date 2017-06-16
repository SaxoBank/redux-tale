import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';

describe('exceptions', () => {

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

    it('handles rejected promises', () => {
        const order = [];
        function *test() {
            try {
                yield Promise.reject(1);
            } catch (e) {
                order.push(e);
            }
        }
        taleMiddleware.run(test);
        jest.runAllTimers();
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
        taleMiddleware.run(test);
        jest.runAllTimers();
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
        taleMiddleware.run(test);
        jest.runAllTimers();
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
        taleMiddleware.run(test);
        jest.runAllTimers();
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
        taleMiddleware.run(test);
        jest.runAllTimers();
        expect(order).toEqual([1]);
    });
});
