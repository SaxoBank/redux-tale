# redux-tale

[![Build Status](https://travis-ci.org/SaxoBank/redux-tale.svg?branch=master)](https://travis-ci.org/SaxoBank/redux-tale) [![Coverage Status](https://coveralls.io/repos/github/SaxoBank/redux-tale/badge.svg?branch=master)](https://coveralls.io/github/SaxoBank/redux-tale?branch=master)

A simplified, smaller and synchronous-first re-implementation of redux-saga.

# Why

redux-saga is a great library that brings the full power of sagas to redux. We recommend you continue to use it if you use the advanced functionality e.g. channels, forking (as opposed to spawn), use of a monitor or reliance on the threading and async nature of redux-saga.

This library is largely compatible with redux-saga but with a few differences:

* Everything is sync-first. This means that "put" or redux dispatch happens immediately. It also means that a saga will run until it hits an async yield meaning that two synchronous running sagas will never interleave. This solves a few problems where using redux-saga you have to work-around sagas essentially making JavaScript multi-threaded. By being sync-first it is easier to predict cause and effect and optimize performance.
* This library is much smaller and contains a few less effects and functionality (minified it is approx. 22% of the size)

# Introduction

If you are not familiar with redux-saga, whose API we are compatible with, the idea is this. In order for actions to have side-effects, you can setup a tale (or in redux-saga, a saga) which will run for every action matching certain criteria (take-every). The tale itself is an es2015 generator function and can yield a number of effects or promises or other generators. The middleware processes those yields and only returns when it is finished. This means you can write code that upon every action that is fired, make a network fetch and then fire an action when complete. e.g.

```js
<button onClick={dispatch(actions.triggerFetch())} >

reduxMiddleware.run(takeEvery(actions.TRIGGER_FETCH, doFetch));

function *doFetch(action) {
  const result = yield fetch('url/to/endpoint');
  yield put(actions.fetchFinished(result));
}
```

Here we are relying on the promise returned from fetch to be resolved and the function to continue when it is complete. We use the put effect in order to dispatch a new action to the store.

Why not use thunks? Thunks are simple and might be better suited to your application. The advantage of sagas or tales are:

* More control over your side effects. For instance you can use take-latest to cancel an existing take operation in progress. You can use take to pause until a action is fired. These would be difficult to achieve with thunks.
* It can keep your actions simple and boilerplate and move side-effects to a seperate file.
* The middleware is just triggered by actions, meaning if you have a store in multi-windows, you can run the side-effects in a different window as it only relies on listening to pure actions.

# Gotchas

* If a saga takes an action and emits an action synchronously that itself is matching, it does not trigger the saga to run recursively
* If two sagas take the same action and the first saga emits an action that would also be matched by the second, then the second action is ignored and the second saga runs only once

# Setup

```js
import { createStore, applyMiddleware } from 'redux';
import createTaleMiddleware from 'redux-tale';
import reducer from './reducer';
import tale from './tale';

// create the saga middleware
const taleMiddleware = createTaleMiddleware();
// mount it on the Store
const store = createStore(
  reducer,
  applyMiddleware(taleMiddleware)
)

taleMiddleware.run(tale);
```

# Transpiling and bundling setup

Since tales require es2015, this library assumes that either you are running within a es2015 environment or you are transpiling. So this does not include a pre-transpiled version of the library. If you are transpiling, you must make sure that redux-tale is also transpiled. This is unusual as libraries most often include a pre-transpiled version, but we believe it gives the most effecient setup and version of the library.

# Yield resolution

## Promises

Promises that are yielded get context returned in 2 ways. If the promise resolves, then result goes back to the generator normally. If the promise is rejected, then the generator has an exception thrown.

```js
// synchronous code
promise
  .then((promiseResult) => {
    doSomething(promiseResult);
  })
  .catch((error) => {
    logError(error);
  });

// redux-tale code
function *generator() {
  try {
    const promiseResult = yield promise;
    doSomething(promiseResult);
  } catch (error) {
    logError(error);
  }
}
```

## Generators

generators that are yielded get executed and only return when the yielded generator completes. Exceptions propogate through generators.

## Arrays

Arrays are treated a bit like a `Promise.all` - each value of the array is resolved seperately and the yield returns when it is complete.

```js
// synchronous code
Promise.all([promise1, promise2])
  .then(([promiseResult1, promiseResult2]) => {
    doSomething(promiseResult1);
    doSomething(promiseResult2);
  })
  .catch((error) => {
    logError(error);
  });

// redux-tale code
function *generator() {
  try {
    const [promiseResult1, promiseResult2] = yield [promise1, promise2];
    doSomething(promiseResult1);
    doSomething(promiseResult2);
  } catch (error) {
    logError(error);
  }
}
```


## Anything else

Anything yielded that is not a promise, generator, effect or array gets instantly returned to the function without modification.

# API

## createTaleMiddleware

Creates middleware which can be added to the store and used to run tales. See Setup guide above.

## middleware API

### run

The middleware has a single function on it - `run` which can be used to start a tale from running.

```js
const taleMiddleWare = createTaleMiddleware();

taleMiddleWare.run(takeLatest('*', myTale))
```

## delay

A function that returns a promise which resolves after a certain number of ms.

```js
import { delay } from 'redux-tale';

...

function *delayedEffect(value) {

    // delay and return to function in 100ms
    yield delay(100);

    // delay and return to function in 100ms with value. Note result === value.
    const result = yield delay(100, value);
}
```

## Effects

### apply

`apply` is present for compatibility with redux-saga. In redux-saga it is used for two purposes, firstly to allow yielding to other sagas, which does not happen in redux-tale and secondly for testing when you run the generator and assert every result. We do not recommend this type of testing because you end up asserting what the code is, not what the code does.

```js
// call func with this context and arguments. If the result is a promise or executed generator, the yield will wait for that result to resolve and return its result
const result = yield apply(context, func, [arg1, arg2]);
```

### call

Like `apply`, `call` is present for compatibility with redux-saga.

```javascript
// call func with null context and arguments. If the result is a promise or executed generator, the yield will wait for that result to resolve and return its result
const result = yield call(func, arg1, arg2);
// call func with this context and arguments
const result = yield call([context, func], arg1, arg2);
// call context[func] with this context and arguments
const result = yield call([context, 'func'], arg1, arg2)
```

### put

The `put` effect will dispatch the passed action with redux. If any other tales are listening for the action they will be invoked immediately and before the dispatch returns.

```javascript
const result = yield put(actionCreator());
```

### race

The `race` effect allows you to race conditions to occur. These could be promises, generators or effects, although any value will work, if it resolves synchronously then it will cancel other things being raced.

```js
const raceResult = yield race({
  key1: promise1,
  key2: generator1,
});

// if promise1 resolves first raceResult === { key1: promiseResult }
// if generator1 resolves first raceResult === { key2: generatorResult }
```

Note: as with other cancellations, anything inside the promise still continues since JavaScript does not support cancellable promises.

### all

The `all` effect in redux-saga can be simulated by yielding an array.

```js
const allResult = yield [
    effect(),
    delay(2),
];
```

### select

The `select` effect runs a selector against the store state.

```js
// sync code
const state = selector(store.getState());

// tale code
const state = yield select(selector);
```

Passing nothing to `select` will cause it to return the full redux state.

### spawn

Spawn will create a new task to run in redux-tale. Any exceptions in that task will be thrown away. The task will run in parallel with any other tasks.

You can see spawn in action every time you use the takeEvery or takeLatest effects - they are implemented as generators that use spawn.

```js
export function takeEvery(pattern, worker, ...args) {
    return function* () {
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
```

The returned value is a task object and supports a simple mechanism for callback when it is completed.

### take

The take effect can be yielded to make a generator wait until a action is dispatched which follows the particular pattern.

```
yield take(pattern);
```

The yield occurs after the action has been reduced.

See Take Patterns.

## Helpers

### takeEvery

The `takeEvery` helper returns a generator function which calls a generator every time the pattern matches a dispatched action.

```js
taleMiddleware.run(takeEvery(pattern, generatorFunction));
```

The generator is started asynchronously, so if many actions are fired which trigger the generatorFunction, and the generatorFunction has asychronous effects, then multiple instances could run at the same time.

See take and Take Patterns.

### takeLatest

The `takeLatest` helper has the same syntax as `takeEvery` but when a new action is matched, it will cancel any running generator function. You can use this to make sure that only the latest asynchronous effect takes place and that you do not get actions in the wrong order because an earlier network call resolved later.

See take and Take Patterns.

## Take Patterns

### Everything

`'*'` can be passed as a action pattern and will cause all actions to match the pattern.

### Action Type

A string can be passed as an action pattern and it will match any action whose action type is equal to the string.

```js
yield take(actions.TRIGGER_TALE);
// matches put({ type: actions.TRIGGER_TALE })
```

### Function

A function can be passed as a pattern matcher and the pattern will be deemed to match if the function returns true

```js
yield take((action) => action.type === actions.TRIGGER_TALE && action.param === 'MyCondition');
```

## Task API

### done - boolean

A boolean field for whether the task is finished. E.g. if a generator only has synchronous code in it, then it will be true on the returned task object.

### callback - function

This field may be set to a function which will be called when the task is complete. The callback will get `thrown` and `value` as its two arguments.

Although redux-tale uses this internally, it will be unset on top level tasks returned from spawn and middleware.run, meaning the caller of those functions is free to use this.

### whenDone - promise

A helper method that uses the `callback` to return a promise that completes when the task is done. It gets the task as a resolved argument and gets resolved on failure or success.

### thrown - boolean

A boolean field for whether or not the task has leaked an exception.

### value - *

The resolved value for the task. It will only be reliably set when the task is done.

### cancelled - boolean

A boolean field for whether or not the task is cancelled.

### isRunning - function

Call this function to get a boolean as to whether the task is running. This returns `!this.done;`

### cancel - function

Call this function to cancel the task. When the generator resumes it will stop processing and do nothing further.

# Testing

The library includes a tester file which has the same syntax as `redux-saga-tester`. We strongly encourage use of this testing convention, which sets up a new redux-store and then runs the tale, testing the effect that the tale had. This is in contract to the traditional redux-saga approach of running the generator in tests and checking every yielded value (that approach makes it easier to mock, because everything can be an effect, but it ties the test to the exact implementation of the tale).

```js
import tester from 'redux-tale/tester';
```

# Contributing
You want to contribute? Great! Have a look at our [contribution guidelines](CONTRIBUTING.md).
