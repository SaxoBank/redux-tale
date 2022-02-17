#### v1.4.3

* Copy some saxo specific properties from thrown errors

#### v1.4.2

* Support for some additional thrown error information

#### v1.4.1

* v1.4.0 was not built before publishing, this just corrects that

#### v1.4.0

* Detection of potentially-unhandled actions

#### v1.3.1

* Support toolkit actions in pattern matching arrays

#### v1.3.0

* You can now pass redux-toolkit like aciton creators as match patterns e.g.
  `yield take(actionCreator)` and `yield take(actionCreator, actionMatcher)` and `takeEvery(actionCreator, saga)`

#### v1.2.0

* exceptions thrown in spawned tasks automatically call window.onerror (like takeEvery and takeLatest already do)
* exceptions thrown from top level sagas call through to window.onerror

#### v1.1.5

+ window.onerror is now called with the correct standard arguments
+ window.onerror is now called synchronously

#### v1.1.4

+ Improvements to error handling

#### v1.1.3

Incorrectly published release, do not use

#### v1.1.2

+ Improvements to the onError object

#### v1.1.1

+ Tiny performance improvements

#### v1.1.0

+ Add a whenDone function on a task that returns a promise when the task completes

#### v1.0.5

+ Fix yielding a function with parameters

#### v1.0.4

+ Fix a problem where an absorbed exception was rethrown

#### v1.0.3

+ Fix problem with takes duplicating

#### v1.0.2

+ Fix event emitter - in some cases it was firing multiple emits

#### v1.0.1

+ Run accepts arguments to be passed to the generator

#### v1.0.0

+ Initial release to Github
