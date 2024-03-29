import { patternMatcherChoosy, patternMatcherLoose } from './action-emitter';

export { patternMatcherChoosy, patternMatcherLoose };

export const CALL = 'CALL';
export function call(func, ...args) {
    let context = undefined;
    if (Array.isArray(func)) {
        context = func[0];
        func = func[1];
    }
    if (typeof func === 'string') {
        func = context[func];
    }
    return {
        __reduxTaleType: CALL,
        context,
        func,
        args,
    };
}

export function apply(context, func, args) {
    return {
        __reduxTaleType: CALL,
        context,
        func,
        args,
    };
}

export const TAKE = 'TAKE';
export function take(pattern, pattern2ndArg) {
    return {
        __reduxTaleType: TAKE,
        pattern,
        pattern2ndArg,
    };
}

export function takeEvery(pattern, worker, ...args) {
    return function* () {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const action = yield take(pattern);
            yield spawn(worker, action, ...args);
        }
    };
}

export function takeLatest(pattern, worker, ...args) {
    return function* () {
        let task;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const action = yield take(pattern);
            if (task && !task.done) {
                task.cancel();
            }
            task = yield spawn(worker, action, ...args);
        }
    };
}

export const RACE = 'RACE';
export function race(raceMap) {
    return {
        __reduxTaleType: RACE,
        raceMap,
    };
}

export const SPAWN = 'SPAWN';
export function spawn(worker, ...args) {
    return {
        __reduxTaleType: SPAWN,
        worker,
        args,
    };
}

export const PUT = 'PUT';
export function put(action) {
    return {
        __reduxTaleType: PUT,
        action,
    };
}

export const SELECT = 'SELECT';
export function select(selector, ...args) {
    return {
        __reduxTaleType: SELECT,
        selector,
        args,
    };
}

