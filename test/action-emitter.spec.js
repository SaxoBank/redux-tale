import { makeActionEmitter } from '../src/action-emitter';

describe('emitter', () => {

    let actionEmitter;
    let onerror;

    beforeEach(() => {
        actionEmitter = makeActionEmitter();
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
});
