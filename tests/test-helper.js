import '@html-next/vertical-collection/-debug';
import registerWaiter from 'ember-raf-scheduler/test-support/register-waiter';
import Application from '../app';
import config from '../config/environment';
import { setApplication } from '@ember/test-helpers';
import QUnit from 'qunit';
import { start } from 'ember-qunit';

QUnit.config.testTimeout = 5000;

setApplication(Application.create(config.APP));

registerWaiter();

start();
