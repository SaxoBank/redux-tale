# redux-tale

[![Build Status](https://travis-ci.org/SaxoBank/redux-tale.svg?branch=master)](https://travis-ci.org/SaxoBank/redux-tale) [![Coverage Status](https://coveralls.io/repos/github/SaxoBank/redux-tale/badge.svg?branch=master)](https://coveralls.io/github/SaxoBank/redux-tale?branch=master)

A simplified, smaller and synchronous-first re-implementation of redux-saga.

# Why

redux-saga is a great library that brings the full power of sagas to redux. We recommend you continue to use it if you use the advanced functionality e.g. channels, forking (as opposed to spawn), use of a monitor or reliance on the threading and async nature of redux-saga.

This library is largely compatible with redux-saga but with a few differences:

* Everything is sync-first. This means that "put" or redux dispatch happens immediately. It also means that a saga will run until it hits an async yield meaning that two synchronous running sagas will never interleave. This solves a few problems where using redux-saga you have to work-around sagas essentially making JavaScript multi-threaded. By being sync-first it is easier to predict cause and effect and optimize performance.
* This library is much smaller and contains a few less effects and functionality (minified it is approx. 22% of the size)

# Gotchas

* if a take every listens for an action type 'a' and when it is processing the action, it also fires an action type 'a', then the take every will miss the action. This could be solved by us queuing these actions for after the take-every runs, but it we consider it an edge case.

# Setup

```
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

# API

## createTaleMiddleware

Creates middleware which can be added to the store and used to run tales. See Setup guide above.

## delay

A function that returns a promise which resolves after a certain number of ms.

```javascript
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

Apply is present for compatibility with redux-saga. In redux-saga it is used for two purposes, firstly to allow yielding to other sagas, which does not happen in redux-tale and secondly for testing when you run the generator and assert every result. We do not recommend this type of testing because you end up asserting what the code is, not what the code does.

```javascript
// call func with this context and arguments. If the result is a promise or executed generator, the yield will wait for that result to resolve and return its result
const result = yield apply(context, func, [arg1, arg2]);
```

### call

Like apply, call is present for compat

### put
### race
### select
### spawn
### take
### takeEvery
### takeLatest

# Testing

# Contributing
You want to contribute? Great! Have a look at our [contribution guidelines](CONTRIBUTING.md).
