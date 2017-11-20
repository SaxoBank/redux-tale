export default function Task(genObj) {
    this.genObj = genObj;
    this.cancelled = false;
    this.done = false;
    this.thrown = false;
    this.value = undefined;
    this.callback = null;
    this.valuesLeft = 0;
}

Task.prototype = {
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
