function createRaceResult(otherTasks, finishedKey, finishedTask) {
    for (const key in otherTasks) {
        if (key !== finishedKey) {
            otherTasks[key].cancel();
        }
    }
    return { [finishedKey]: finishedTask.value };
}

function* raceWorker(effect) {
    return yield effect;
}

export function handleRaceEffect(value, task, runGenObj, makeCallback, callbackArg) {
    const raceTasks = {};
    for (const key in value.raceMap) {
        const raceEffect = value.raceMap[key];
        const raceTask = runGenObj(raceWorker(raceEffect));
        raceTasks[key] = raceTask;
        if (raceTask.done) {
            return {
                value: createRaceResult(raceTasks, key, raceTasks[key]),
            };
        }
    }

    const taskCallback = makeCallback(task, callbackArg);
    for (const key in raceTasks) {
        raceTasks[key].callback = (isThrown) => {
            const result = createRaceResult(raceTasks, key, raceTasks[key]);
            taskCallback(isThrown, result);
        };
    }

    return false;

}
