// from https://github.com/fitzgen/chronos/blob/master/chronos.js

/** @license Copyright (c) 2011 Nick Fitzgerald
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// ## Variables and Utilities

// Counter which keeps incrementing to give each task a unique id.
let taskIdCounter = 0

// Store all active tasks in this object.
const tasks = {}

// Keep track of whether the main task runner has been initialized or not.
let initialized = false

// The interval at which we check for tasks to run. It follows that the
// smallest timeout interval you can give a task is this value.
let INTERVAL = 50

let lastTimeRan

// Return a function which calls `fn` as if `args` had been passed in as
// arguments directly. Don't need to worry about return values because this
// is only used asynchrnously, and don't need to worry about new arguments
// because we know there will be no more.
function curry (args, fn) {
  return args.length === 0
    ? fn
    : function () {
      fn.apply(null, args)
    }
}

const keys = typeof Object.keys === 'function'
  ? Object.keys
  : function (obj) {
    var ks = []; var k
    for (k in obj) {
      if (obj.hasOwnProperty(k)) {
        ks.push(k)
      }
    }
    return ks
  }

function slice (ary, n) {
  return Array.prototype.slice.call(ary, n)
}

// Round n to the nearest multiple of INTERVAL.
function roundToNearestInterval (n) {
  const diff = n % INTERVAL
  return diff < INTERVAL / 2
    ? n - diff
    : n + INTERVAL - diff
}

// ## Tasks
//
// A task is a function to be executed after a timeout. We abstract away the
// implementation of a task with a constructor and functions to perform each
// operation we might wish to perform on a task. The closure compiler will
// inline most of these functions for us.

// Constructor for tasks.
function makeTask (repeats, ms, fn) {
  return {
    next: ms,
    timeout: ms,
    repeats: repeats,
    fn: fn,
    lastTimeRan: +new Date()
  }
}

// Decrement the ammount of time till this task should be run next and
// returns how many milliseconds are left till the next time it should be
// run.
function decrementTimeTillNext (task) {
  return task.next = task.timeout - ((+new Date()) - task.lastTimeRan) // eslint-disable-line
}

// Return true if the task repeats multiple times, false if it is a task to
// run only once.
function taskRepeats (task) {
  return task.repeats
}

// Execute the given task.
function runTask (task) {
  task.lastTimeRan = +new Date()
  return task.fn()
}

// Reset the countdown till the next time this task is executed.
function resetTimeTillNext (task) {
  return task.next = task.timeout // eslint-disable-line
}

// ## Task Runner
//
// The task runner is the main function which runs the tasks whose timers
// have counted down, resets the timers if necessary, and deletes tasks
// which only run once and have already been run.

function taskRunner () {
  var i = 0
  var tasksToRun = keys(tasks)
  var len = tasksToRun.length
  // Make sure that the taskRunner's main loop doesn't block the browser's
  // UI thread by yielding with `setTimeout` if we are running for longer
  // than 50 ms.
  function loop () {
    var start
    for (start = +new Date();
      i < len && (+new Date()) - start < 50;
      i++) {
      if (tasks[tasksToRun[i]] &&
                     decrementTimeTillNext(tasks[tasksToRun[i]]) < INTERVAL / 2) {
        runTask(tasks[tasksToRun[i]])
        if (tasks[tasksToRun[i]]) {
          if (taskRepeats(tasks[tasksToRun[i]])) {
            resetTimeTillNext(tasks[tasksToRun[i]])
          } else {
            delete tasks[tasksToRun[i]]
          }
        }
      }
    }

    if (i < len) {
      setTimeout(loop, 10)
    } else {
      setTimeout(taskRunner, INTERVAL)
    }
  }
  loop()
}

// If the task runner is not already initialized, go ahead and start
// it. Otherwise, do nothing.
function maybeInit () {
  if (!initialized) {
    lastTimeRan = +new Date()
    setTimeout(taskRunner, INTERVAL)
    initialized = true
  }
}

// Registering a task with the task runner is pretty much the same whether
// you want it to run once, or multiple times. The only difference is
// whether it runs once or multiple times, so we abstract this out from the
// public set* functions. Returns a task id.
function registerTask (repeats, fn, ms, args) {
  var id = taskIdCounter++
  tasks[id] = makeTask(repeats,
    roundToNearestInterval(ms),
    curry(args, fn))
  maybeInit()
  return id
}

// Remove a task from the task runner. By enforcing that `repeats` matches
// `tasks[id].repeats` we make timeouts and intervals live in seperate
// namespaces.
function deregisterTask (repeats, id) {
  return tasks[id] &&
            tasks[id].repeats === repeats &&
            delete tasks[id]
}

module.exports = {
  setTimeout: function (fn, ms) {
    return registerTask(false, fn, ms, [])
  },
  setInterval: function (fn, ms) {
    return registerTask(true, fn, ms, [])
  },
  clearTimeout: function (id) {
    deregisterTask(false, id)
  },
  clearInterval: function (id) {
    deregisterTask(true, id)
  },
  minimumInterval: function (newInterval) {
    return typeof newInterval === 'number' // eslint-disable-line
      ? INTERVAL = newInterval
      : INTERVAL
  }
}
