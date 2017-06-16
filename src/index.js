import * as effects from './effects';
import { getPatternChecker } from './pattern-checker';
import Task from './task';
import delay from './delay';
import { handleRaceEffect } from './race';

export { effects };
export { delay };

/**
 * Creates a runner that can run the tales
 * @param dispatch
 * @param getState
 * @returns { emit(action), run(tale) }
 */
function createTaleRunner({ dispatch, getState }) {
    const listeners = [];

    function take(pattern, callback) {
        const patternChecker = getPatternChecker(pattern);
        const handler = (action) => {
            if (patternChecker(pattern, action)) {
                callback(false, action);
                return true;
            }
        };
        listeners.push(handler);
    }

    function makeTaskCallback(task) {
        return (isThrown, value) => {
            if (task.cancelled) {
                return;
            }
            runTask(task, isThrown, value);
        };
    }

    function runGenObj(genObj) {
        return runTask(new Task(genObj));
    }

    function makeArrayCallback(task, valueIndex) {
        return (isThrown, value) => {
            // if one item already finished, ignore this
            if (task.isThrown || task.cancelled) {
                return;
            }
            if (isThrown) {
                task.isThrown = true;
                task.callback(true, value);
            }
            task.value[valueIndex] = value;
            task.valuesLeft--;
            if (task.valuesLeft === 0) {
                task.callback(false, task.value);
            }
        };
    }

    function resolveEffect(value, task, makeCallback, callbackArg) {
        if (value.__reduxTaleType === effects.TAKE) {
            take(value.pattern, makeCallback(task, callbackArg));
            return false;
        }

        if (value.__reduxTaleType === effects.SPAWN) {
            return { value: runGenObj(value.worker(...value.args)) };
        }

        if (value.__reduxTaleType === effects.SELECT) {
            const state = getState();
            if (value.selector) {
                return { value: value.selector(state, ...value.args) };
            }
            return { value: state };
        }

        if (value.__reduxTaleType === effects.PUT) {
            return { value: dispatch(value.action) };
        }

        if (value.__reduxTaleType === effects.CALL) {
            // TODO - in redux-saga, does doing
            // call(returnsArrayOfPromises) => arrayOfValues ?
            return resolveValue(value.func.apply(value.context, value.args), task, makeCallback, callbackArg);
        }

        if (value.__reduxTaleType === effects.RACE) {
            return handleRaceEffect(value, task, runGenObj, makeCallback, callbackArg);
        }

        throw new Error('unrecognised redux tale effect');
    }

    function resolveValue(value, task, makeCallback = makeTaskCallback, callbackArg) {

        if (!value) {
            return { value };
        }

        // is promise
        if (value.then && value.catch) {
            const taskCallback = makeCallback(task, callbackArg);
            value.then(
                taskCallback.bind(null, false /* isThrown - false = resolved */),
                taskCallback.bind(null, true));
            return false;
        }

        // is a redux-tale effect
        if (value.__reduxTaleType) {
            return resolveEffect(value, task, makeCallback, callbackArg);
        }

        // is generator
        if (value.next && value.throw) {
            const subTask = runGenObj(value);

            if (subTask.done) {
                if (subTask.thrown) {
                    return { value: subTask.value, thrown: true };
                }
                return { value: subTask.value };
            }

            task.child = subTask;

            subTask.callback = makeCallback(task, callbackArg);
            return false;
        }

        // is array (wait for all)
        if (value.length) {
            const newResult = new Array(value.length);
            const subTask = new Task();
            subTask.value = newResult;
            for (let i = 0; i < value.length; i++) {
                const subValue = resolveValue(value[i], subTask, makeArrayCallback, i);

                if (subValue) {
                    newResult[i] = subValue.value;
                } else {
                    subTask.valuesLeft++;
                }
            }
            if (!subTask.valuesLeft) {
                return { value: newResult };
            }
            task.child = subTask;
            subTask.callback = makeCallback(task, callbackArg);
            return false;
        }

        // pass through values we cannot interpret
        return { value };
    }

    function runTask(task, isThrown, value) {

        // eslint-disable-next-line no-constant-condition
        while (true) {

            let yielded;

            try {
                if (isThrown) {
                    yielded = task.genObj.throw(value);
                } else {
                    yielded = task.genObj.next(value);
                }
            } catch (e) {
                task.thrown = true;
                task.done = true;
                task.value = e;
                break;
            }

            if (yielded.done) {
                task.value = yielded.value;
                task.done = true;
                break;
            }

            value = yielded.value;
            if (value) {
                const syncResult = resolveValue(value, task);
                if (!syncResult) {
                    break;
                }
                if (syncResult.thrown) {
                    isThrown = true;
                }
                value = syncResult.value;
            }
        }

        if (task.done && task.callback) {
            task.callback(task.thrown, task.value);
        }

        return task;
    }

    return {
        emit(action) {
            const thisActionListeners = listeners.slice(0);
            for (let i = 0; i < thisActionListeners.length; i++) {
                if (thisActionListeners[i](action)) {
                    listeners.splice(listeners.indexOf(thisActionListeners[i]), 1);
                }
            }
        },
        run(generator) {
            return runGenObj(generator());
        },
    };
}

/**
 * The redux middleware which is inserted to catch actions and give dispatch (put) and getState (select) capability
 * @param dispatch
 * @param getState
 * @returns tale enabled redux
 */
export default function createTaleMiddleware() {
    let taleRunner;
    function taleMiddleware({ dispatch, getState }) {

        taleRunner = createTaleRunner({ dispatch, getState });
        taleMiddleware.run = taleRunner.run;

        return (nextDispatch) => (action) => {
            const value = nextDispatch(action);
            taleRunner.emit(action);
            return value;
        };
    }
    return taleMiddleware;
}
