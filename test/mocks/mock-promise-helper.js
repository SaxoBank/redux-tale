import _ from 'lodash';
import asap from 'asap';
import Yaku from 'yaku';

window.Promise = Yaku;

const queue = [];
function flush() {
    const oldQueue = queue.slice(0);
    queue.length = 0;
    _.forEach(oldQueue, (fn) => fn());
}
function flushAll() {
    while (queue.length) {
        flush();
    }
}
function flushTimes(n) {
    _.times(n, flush);
}
let isMocking = false;
let isQueued = false;
function nextTickQueued(fn) {
    queue.push(fn);
    if (!isMocking && !isQueued) {
        isQueued = true;
        asap(() => {
            isQueued = false;
            if (!isMocking) {
                flush();
            }
        });
    }
}
Promise.nextTick = nextTickQueued;

const mockPromiseHelper = {
    use() {
        beforeAll(() => {
            flushAll();
            isQueued = false;
            isMocking = true;
        });

        afterEach(() => {
            flushAll();
        });

        afterAll(() => {
            isMocking = false;
            isQueued = false;
            flushAll();
        });
    },
    tick(numberOfIterations) {
        if (numberOfIterations) {
            flushTimes(numberOfIterations);
        } else {
            flushAll();
        }
    },
    resolvedValue(promise) {
        let value;
        promise.then((resolvedValue) => {
            value = resolvedValue;
        });
        flushAll();
        return value;
    },
    isFulfilled(promise) {
        let isFulfilled = false;
        promise.then(function() {
            isFulfilled = true;
        });
        flushAll();
        return isFulfilled;
    },
    isRejected(promise) {
        let isRejected = false;
        promise.catch(function() {
            isRejected = true;
        });
        flushAll();
        return isRejected;
    },
};

export default mockPromiseHelper;
