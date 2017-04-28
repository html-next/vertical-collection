import Ember from 'ember';

const { VERSION } = Ember;

export const IS_GLIMMER_2 = VERSION.match(/2\.\d\d+\.\d+/) !== null;

export const SUPPORTS_INVERSE_BLOCK = VERSION.match(/1\.13\.\d+|2\.\d+\.\d+/) !== null;
