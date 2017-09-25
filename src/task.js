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
    whenDone() {
        if (this.done) {
            return Promise.resolve(this);
        }

        return new Promise((resolve) => {
            this.callback = () => {
                resolve(this);
            };
        });
    },
    cancel() {
        this.cancelled = true;
        this.done = true;
        if (this.child) {
            this.child.cancel();
        }
    },
};
