import * as effects from './effects';
import Task from './task';
import delay from './delay';
import { handleRaceEffect } from './race';
import { makeActionEmitter } from './action-emitter';
import { logError } from './log-error';

export { effects };
export { delay };

function onTaskCatchError(isThrown, value) {
    if (isThrown) {
        logError(value);
    }
}

/**
 * Creates a runner that can run the tales
 * @param dispatch
 * @param getState
 * @param onPotentiallyUnhandledAction
 * @returns { emit(action), run(tale) }
 */
function createTaleRunner({ dispatch, getState, onPotentiallyUnhandledAction }) {

    const actionEmitter = makeActionEmitter(onPotentiallyUnhandledAction);

    function runGenObj(genObj) {
        return runTask(new Task(genObj));
    }

    /**
     * Makes a callback that when called will continue the generator task with the value or exception
     * This is used lazily so we only create the closure when we know it is needed.
     * @param task
     * @returns callback function
     */
    function makeTaskCallback(task) {
        return (isThrown, value) => {
            if (task.cancelled) {
                return;
            }
            runTask(task, isThrown, value);
        };
    }

    /**
     * Makes a callback that will continue the task when all of the items in an array have concluded
     * (e.g. kind of like Promise.all)
     * @param task
     * @param valueIndex
     * @returns callback function
     */
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
        try {
            if (value.__reduxTaleType === effects.TAKE) {
                actionEmitter.take(value.pattern, value.pattern2ndArg, makeCallback(task, callbackArg));
                return false;
            }

            if (value.__reduxTaleType === effects.SPAWN) {
                const spawnTask = runGenObj(value.worker(...value.args));

                if (spawnTask.done) {
                    onTaskCatchError(spawnTask.thrown, spawnTask.value);
                } else {
                    spawnTask.callback = onTaskCatchError;
                }

                return { value: spawnTask };
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
                return resolveValue(value.func.apply(value.context, value.args), task, makeCallback, callbackArg);
            }

            if (value.__reduxTaleType === effects.RACE) {
                return handleRaceEffect(value, task, runGenObj, makeCallback, callbackArg);
            }
        } catch (e) {
            return {
                thrown: true,
                value: e,
            };
        }

        throw new Error('unrecognised redux tale effect');
    }

    /**
     * Resolves a yielded value to a value or else if async, returns null and call the callback
     * @param value - the value to resolve
     * @param task - the task to resolve back to
     * @param makeCallback - the function to make a callback if async
     * @param callbackArg - the argument for the callback
     * @returns null when the result is async. when the result is sync, an object { value, thrown }
     */
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
            return null;
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
            return null;
        }

        // is array (wait for all)
        if (Array.isArray(value) && value.length) {
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
            return null;
        }

        // pass through values we cannot interpret
        return { value };
    }

    function runTask(task, isNextStatementThrown, value) {

        // eslint-disable-next-line no-constant-condition
        while (true) {

            let yielded;

            try {
                if (isNextStatementThrown) {
                    yielded = task.genObj.throw(value);
                    isNextStatementThrown = false;
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
                    isNextStatementThrown = true;
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
        emit: actionEmitter.emit,
        run(generator, ...args) {
            const taskBeingRun = runGenObj(generator(...args));
            if (taskBeingRun.done) {
                onTaskCatchError(taskBeingRun.thrown, taskBeingRun.value);
            } else {
                taskBeingRun.callback = onTaskCatchError;
            }
            return taskBeingRun;
        },
    };
}

/**
 * @callback onPotentiallyUnhandledAction
 * @param {Object} action - said action
 */

/**
 * The redux middleware which is inserted to catch actions and give dispatch (put) and getState (select) capability
 *
 * @param {Object} [options]
 * @param {onPotentiallyUnhandledAction} [options.onPotentiallyUnhandledAction] Called when no listener processed an action.
 *      Use it to help detect circumstances where no saga was running to process a dispatched action intended for it.
 *      Listeners with a broad interest of actions must be ignored, otherwise many/all actions will always be considered handled.
 *      Mark listener patterns with a property `isLoose = true` (or use the helper `patternMatcherLoose(matcher)`) to ignore them.
 *      The `*` pattern is always ignored.
 */
export default function createTaleMiddleware(options = {}) {
    options.onPotentiallyUnhandledAction = options.onPotentiallyUnhandledAction || function noop() {};

    let taleRunner;
    function taleMiddleware({ dispatch, getState }) {

        taleRunner = createTaleRunner({ dispatch, getState, onPotentiallyUnhandledAction: options.onPotentiallyUnhandledAction });
        taleMiddleware.run = taleRunner.run;

        return (nextDispatch) => (action) => {
            const value = nextDispatch(action);
            taleRunner.emit(action);
            return value;
        };
    }
    return taleMiddleware;
}
