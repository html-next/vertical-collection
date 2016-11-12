import Ember from 'ember';

const {
  assert: emberAssert,
  warn: emberWarn,
  deprecate: emberDeprecate,
  Logger
} = Ember;

export function instrument(cb) {
  cb();
}

export function debug() {
  Logger.debug(...arguments);
}

export function debugOnError(msg, conditional) {
  if (!conditional) {
    console.error(msg);
    debugger;
  }
}

export function assert(msg, conditional) {
  if (!conditional) {
    throw new Error(msg);
  }
}

export function warn() {
  emberWarn(...arguments);
}

export function deprecate() {
  emberDeprecate(...arguments);
}

export function stripInProduction(cb) {
  cb();
}
