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
        type: CALL,
        context,
        func,
        args,
    };
}

export function apply(context, func, args) {
    return {
        type: CALL,
        context,
        func,
        args,
    };
}

export const TAKE = 'TAKE';
export function take(pattern) {
    return {
        type: TAKE,
        pattern,
    };
}

function onTaskCatchError(isThrown, value) {
    if (isThrown && window.onerror) {
        // set timeout since jasmine doesn't expect window.onerror to be called from its own context
        setTimeout(() => {
            window.onerror({
                message: 'Unhandled exception in saga:' + value,
                stack: value && value.stack,
            });
        });
    }
}

export function takeEvery(pattern, worker, ...args) {
    return function* () {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const action = yield take(pattern);
            const task = yield spawn(worker, action, ...args);
            if (task.done) {
                onTaskCatchError(task.thrown, task.value);
            } else {
                task.callback = onTaskCatchError;
            }
        }
    };
}

function* raceWorker(effect) {
    return yield effect;
}

function createRaceResult(otherTasks, finishedKey, finishedTask) {
    for (const key in otherTasks) {
        if (key !== finishedKey) {
            otherTasks[key].cancel();
        }
    }
    return { [finishedKey]: finishedTask.value };
}

export function* race(raceMap) {
    const raceTasks = [];
    for (const key in raceMap) {
        const task = yield spawn(raceWorker, raceMap[key]);
        if (task.done) {
            return createRaceResult(raceTasks, key, task);
        }
        raceTasks[key] = task;
    }
    return yield new Promise((resolve, reject) => {
        for (const key in raceTasks) {
            raceTasks[key].callback = (isThrown) => {
                const result = createRaceResult(raceTasks, key, raceTasks[key]);
                if (isThrown) {
                    reject(result);
                } else {
                    resolve(result);
                }
            };
        }
    });
}

export const SPAWN = 'SPAWN';
export function spawn(worker, ...args) {
    return {
        type: SPAWN,
        worker,
        args,
    };
}

export const PUT = 'PUT';
export function put(action) {
    return {
        type: PUT,
        action,
    };
}

export const SELECT = 'SELECT';
export function select(selector, ...args) {
    return {
        type: SELECT,
        selector,
        args,
    };
}

