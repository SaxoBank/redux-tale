import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from '../src';
import { call, apply } from '../src/effects';

describe('call and apply', () => {

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

    it('call works minimally', () => {
        const toCall = jest.fn();

        function *test() {
            yield call(toCall);
        }

        taleMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
    });

    it('apply works minimally', () => {
        const toCall = jest.fn();

        function *test() {
            yield apply(null, toCall);
        }

        taleMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
    });

    it('call works with args', () => {
        let calledContext = undefined;
        const toCall = jest.fn(function() { calledContext = this; });

        function *test() {
            yield call(toCall, 1, 2, 3);
        }

        taleMiddleware.run(test);
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

        taleMiddleware.run(test);
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

        taleMiddleware.run(test);
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

        taleMiddleware.run(test);
        expect(toCall).toHaveBeenCalledTimes(1);
        expect(toCall).toHaveBeenCalledWith(1, 2, 3);
        expect(calledContext).toBe(context);
    });

    it('call yields parameterless function', () => {
        const func = () => {};
        const toCall = () => func;
        let resolvedValue;

        function *test() {
            resolvedValue = yield call(toCall);
        }

        taleMiddleware.run(test);
        expect(resolvedValue).toEqual(func);
    });

    it('call yields function with parameters', () => {
        const func = (a) => {};
        const toCall = () => func;
        let resolvedValue;

        function *test() {
            resolvedValue = yield call(toCall);
        }

        taleMiddleware.run(test);
        expect(resolvedValue).toEqual(func);
    });

    it('call yields empty array', () => {
        const array = [];
        const toCall = () => array;
        let resolvedValue;

        function *test() {
            resolvedValue = yield call(toCall);
        }

        taleMiddleware.run(test);
        expect(resolvedValue).toEqual(array);
    });

    it('call yields array with values', () => {
        const array = [1, 2, 3];
        const toCall = () => array;
        let resolvedValue;

        function *test() {
            resolvedValue = yield call(toCall);
        }

        taleMiddleware.run(test);
        expect(resolvedValue).toEqual(array);
    });

    it('call throws if callee throws', () => {
        const toCall = () => { throw new Error(); };
        let didThrow = false;

        function *test() {
            try {
                yield call(toCall);
            } catch (e) {
                didThrow = true;
            }
        }

        taleMiddleware.run(test);
        expect(didThrow).toBe(true);
    });
});
