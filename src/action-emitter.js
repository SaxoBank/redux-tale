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
    const suspendedListeners = [];
    return {
        take(pattern, pattern2ndArg, callback) {
            listeners.push({
                pattern,
                pattern2ndArg,
                patternChecker: getPatternChecker(pattern, pattern2ndArg),
                callback,
            });
        },
        emit(action) {
            const matchingListeners = listeners.filter((listener) => listener.patternChecker(listener.pattern, listener.pattern2ndArg, action));

            if (matchingListeners.every(({ pattern }) => pattern === '*' || pattern.isLoose)) {
                onPotentiallyUnhandledAction(action);
            }

            // avoid the callback firing an action that would try and restart the saga
            const listenersToFire = matchingListeners.filter((listener) => !suspendedListeners.includes(listener));
            suspendedListeners.push(...listenersToFire);

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

/**
 * Marks the given matcher as one that does count for unhandled action detection.
 * Only matchers that match a narrow range of actions should be annotated using this.
 *
 * @see patternMatcherLoose
 *
 * @param matcher
 * @returns marked matcher
 */
export function patternMatcherChoosy(matcher) {
    matcher.isLoose = false;

    return matcher;
}

/**
 * Marks the given matcher as one to be ignored for unhandled action detection.
 * Matchers that match a wide range of actions must be marked using this.
 *
 * @see patternMatcherChoosy
 *
 * @param matcher
 * @returns marked matcher
 */
export function patternMatcherLoose(matcher) {
    matcher.isLoose = true;

    return matcher;
}
