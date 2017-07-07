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
            const iteratingListeners = listeners.slice(0);
            const iteratingLength = iteratingListeners.length;
            for (let i = 0; i < iteratingLength; i++) {
                const listener = iteratingListeners[i];
                const isValid = listener.patternChecker(listener.pattern, action);

                // remove the listener first to avoid the callback firing
                // an action that would try and restart the saga
                if (isValid) {
                    for (let j = 0; j < listeners.length; j++) {
                        if (listener === listeners[j]) {
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
