export default function Task(genObj) {
    this.genObj = genObj;
}

Task.prototype = {
    cancelled: false,
    done: false,
    thrown: false,
    value: undefined,
    callback: null,
    valuesLeft: 0,
    isRunning() {
        return !this.done;
    },
    cancel() {
        this.cancelled = true;
        this.done = true;
        if (this.child) {
            this.child.cancel();
        }
    },
};
