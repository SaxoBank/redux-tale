import { getPatternChecker } from './pattern-checker';
import { logError } from './log-error';

/**
 * Fires take's when an action matches
 *
 * @param onPotentiallyUnhandledAction
 * @returns {{listen: (function), emit: (function)}}
 */
export function makeActionEmitter(onPotentiallyUnhandledAction) {
    const listeners = [];
    return {
        take(pattern, pattern2ndArg, callback) {
            listeners.push({
                pattern,
                pattern2ndArg,
                patternChecker: getPatternChecker(pattern, pattern2ndArg),
                isChoosy: isChoosyPattern(pattern),
                callback,
            });
        },
        emit(action) {
            const listenersToFire = [];
            for (let i = 0; i < listeners.length; i++) {
                const listener = listeners[i];
                const isValid = listener.patternChecker(listener.pattern, listener.pattern2ndArg, action);

                // remove the listener first to avoid the callback firing
                // an action that would try and restart the saga
                if (isValid) {
                    listenersToFire.push(listener);
                    listeners.splice(i, 1);
                    i--;
                }
            }

            if (!listenersToFire.some((listener) => listener.isChoosy)) {
                onPotentiallyUnhandledAction(action);
            }

            // delay firing listeners until the listeners have all been removed
            // this means that if an action is taken by two sagas and one of those
            // sagas emits an action taken by the 2nd saga, it will not pick it up
            // since it will process the previous action *afterwards*
            for (let i = 0; i < listenersToFire.length; i++) {

                // callback follow redux-tale callback format isThrown, value
                try {
                    listenersToFire[i].callback(false, action);
                } catch (e) {
                    logError(e);
                }
            }
        },
    };
}

function isChoosyPattern(pattern) {
    return pattern !== '*' && pattern.isChoosy !== false;
}
