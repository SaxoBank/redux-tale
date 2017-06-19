import { makeActionEmitter } from '../src/action-emitter';

describe('emitter', () => {

    let actionEmitter;

    beforeEach(() => {
        actionEmitter = makeActionEmitter();
    });

    it('fires events', () => {

        const listener1 = jest.fn();
        const listener2 = jest.fn();

        actionEmitter.take('*', listener1);
        actionEmitter.take('*', listener2);

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

        actionEmitter.take('*', () => actionEmitter.take('*', listener1));

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
            actionEmitter.take('*', listener3);
            actionEmitter.emit(2);
        };

        actionEmitter.take('*', listener1);
        actionEmitter.take('*', listener2);

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
            actionEmitter.take('*', listener3);
            actionEmitter.emit(2);
        };

        actionEmitter.take(() => false, listener1);
        actionEmitter.take('*', listener2);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(0);
        expect(listener2Calls).toEqual(1);

        actionEmitter.emit(1);

        expect(listener3).toHaveBeenCalledTimes(1);
        expect(listener1Calls).toEqual(0);
        expect(listener2Calls).toEqual(1);
    });
});
