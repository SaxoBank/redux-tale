import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from '../src';
import { call, apply } from '../src/effects';

describe('call and apply', () => {

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

    it('call works minimally', () => {
        const toCall = jest.fn();

        function *test() {
            yield call(toCall);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
    });

    it('apply works minimally', () => {
        const toCall = jest.fn();

        function *test() {
            yield apply(null, toCall);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
    });

    it('call works with args', () => {
        let calledContext = undefined;
        const toCall = jest.fn(function() { calledContext = this; });

        function *test() {
            yield call(toCall, 1, 2, 3);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
        expect(toCall).toHaveBeenCalledWith(1, 2, 3);
        expect(calledContext).toBe(undefined);
    });

    it('apply works with args and context', () => {
        let calledContext = undefined;
        const toCall = jest.fn(function() { calledContext = this; });

        function *test() {
            yield apply(4, toCall, [1, 2, 3]);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
        expect(toCall).toHaveBeenCalledWith(1, 2, 3);
        expect(calledContext).toBe(4);
    });

    it('call works with context', () => {
        let calledContext = undefined;
        const toCall = jest.fn(function() { calledContext = this; });

        function *test() {
            yield call([4, toCall], 1, 2, 3);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
        expect(toCall).toHaveBeenCalledWith(1, 2, 3);
        expect(calledContext).toBe(4);
    });

    it('call works with string func', () => {
        let calledContext = undefined;
        const toCall = jest.fn(function() { calledContext = this; });
        const context = {
            toCall,
        };

        function *test() {
            yield call([context, 'toCall'], 1, 2, 3);
        }

        sagaMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
        expect(toCall).toHaveBeenCalledWith(1, 2, 3);
        expect(calledContext).toBe(context);
    });

});
