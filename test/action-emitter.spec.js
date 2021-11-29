import { makeActionEmitter } from '../src/action-emitter';

describe('emitter', () => {

    let actionEmitter;
    let handlePotentiallyUnhandledAction;
    let onerror;

    beforeEach(() => {
        handlePotentiallyUnhandledAction = jest.fn();
        actionEmitter = makeActionEmitter(handlePotentiallyUnhandledAction);
        onerror = jest.fn();
        window.onerror = onerror;
    });

    it('fires events', () => {

        const listener1 = jest.fn();
        const listener2 = jest.fn();

        actionEmitter.take('*', undefined, listener1);
        actionEmitter.take('*', undefined, listener2);

        actionEmitter.emit(1);

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenLastCalledWith(false, 1);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenLastCalledWith(false, 1);

        actionEmitter.emit(2);

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('supports listeners adding listeners', () => {

        const listener1 = jest.fn();

        actionEmitter.take('*', undefined, () => actionEmitter.take('*', undefined, listener1));

        actionEmitter.emit(1);

        expect(listener1).not.toHaveBeenCalled();

        actionEmitter.emit(1);

        expect(listener1).toHaveBeenCalledTimes(1);

        actionEmitter.emit(1);

        expect(listener1).toHaveBeenCalledTimes(1);
    });

    it('supports listeners emitting', () => {

        let listener1Calls = 0;
        const listener1 = () => {
            listener1Calls++;
        };

        const listener3 = jest.fn();

        let listener2Calls = 0;
        const listener2 = () => {
            listener2Calls++;
            actionEmitter.take('*', undefined, listener3);
            actionEmitter.emit(2);
        };

        actionEmitter.take('*', undefined, listener1);
        actionEmitter.take('*', undefined, listener2);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(1);
        expect(listener2Calls).toEqual(1);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(1);
        expect(listener2Calls).toEqual(1);
    });

    it('supports listeners emitting with some selective listeners', () => {

        let listener1Calls = 0;
        const listener1 = () => {
            listener1Calls++;
        };

        const listener3 = jest.fn();

        let listener2Calls = 0;
        const listener2 = () => {
            listener2Calls++;
            actionEmitter.take('*', undefined, listener3);
            actionEmitter.emit(2);
        };

        actionEmitter.take(() => false, listener1);
        actionEmitter.take('*', undefined, listener2);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(0);
        expect(listener2Calls).toEqual(1);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(0);
        expect(listener2Calls).toEqual(1);
    });

    it('fires events even when listeners throw', () => {

        const listener1 = jest.fn(() => { throw new Error(); });
        const listener2 = jest.fn();
        const listener3 = jest.fn(() => { throw new Error(); });

        actionEmitter.take('*', undefined, listener1);
        actionEmitter.take('*', undefined, listener2);
        actionEmitter.take('*', undefined, listener3);

        actionEmitter.emit(1);
        jest.runAllTimers();

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenLastCalledWith(false, 1);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenLastCalledWith(false, 1);
        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener3).toHaveBeenLastCalledWith(false, 1);
        expect(onerror).toHaveBeenCalledTimes(2);
    });

    it('unhandled actions: calls callback when there are no listeners', () => {
        actionEmitter.emit({ type: 'foo' });

        expect(handlePotentiallyUnhandledAction).toBeCalled();
    });

    it('unhandled actions: calls callback when the only listener is take(*)', () => {
        actionEmitter.take('*', undefined, function listener() {});

        actionEmitter.emit({ type: 'foo' });

        expect(handlePotentiallyUnhandledAction).toBeCalled();
    });

    it('unhandled actions: calls callback when the only listener\'s pattern matcher is marked as loose', () => {
        function patternMatcher(action) { return action.type !== 'match-everything-except-this'; }
        patternMatcher.isLoose = true;

        actionEmitter.take(patternMatcher, undefined, function listener() {});

        actionEmitter.emit({ type: 'foo' });

        expect(handlePotentiallyUnhandledAction).toBeCalled();
    });

    it('unhandled actions: doesnt call callback when a non-loose listener is present', () => {
        actionEmitter.take('foo', undefined, function listener() {});
        actionEmitter.take('*', undefined, function listener() {});

        actionEmitter.emit({ type: 'foo' });

        expect(handlePotentiallyUnhandledAction).not.toBeCalled();
    });

    it('unhandled actions: doesnt call callback when a listener emits an action that it itself is listening for', () => {
        actionEmitter.take('foo', undefined, function listener() {
            actionEmitter.emit({ type: 'foo' });
        });

        actionEmitter.emit({ type: 'foo' });

        expect(handlePotentiallyUnhandledAction).not.toBeCalled();
    });
});
