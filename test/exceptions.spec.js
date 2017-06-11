import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';

describe('exceptions', () => {

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
