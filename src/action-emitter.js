import { getPatternChecker } from './pattern-checker';

/**
 * Fires take's when an action matches
 * @returns {{listen: (function), emit: (function)}}
 */
export function makeActionEmitter() {
    const listeners = [];
    return {
        take(pattern, callback) {
            listeners.push({
                pattern,
                patternChecker: getPatternChecker(pattern),
                callback,
            });
        },
        emit(action) {
            /*
             * Don't mutate listeners unless we have to.
             * If new listeners are added, they go on the end, so because we cache the length they will be skipped
             * If listeners are removed, its only done here, so we copy the array so we point to the unmutated array.
             * If listeners are removed and added, the array will have been copied.
             */
            let iteratingListeners = listeners;
            const iteratingLength = iteratingListeners.length;
            for (let i = 0; i < iteratingLength; i++) {
                const listener = iteratingListeners[i];
                const isValid = listener.patternChecker(listener.pattern, action);

                // remove the listener first to avoid the callback firing
                // an action that would try and restart the saga
                if (isValid) {
                    if (iteratingListeners === listeners) {
                        iteratingListeners = listeners.slice(0);
                    }
                    for (let j = 0; j < listeners.length; j++) {
                        if (listeners[j] === iteratingListeners[i]) {
                            listeners.splice(j, 1);
                            break;
                        }
                    }

                    // callback follow redux-tale callback format isThrown, value
                    iteratingListeners[i].callback(false, action);
                }
            }
        },
    };
}
