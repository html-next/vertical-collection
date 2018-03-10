'use strict';

const expect = require('chai').expect;
const setupTest = require('ember-fastboot-addon-tests').setupTest;

describe('index', function() {
  setupTest('fastboot'/*, options */);

  it('renders without blowing up', function() {
    return this.visit('/')
      .then(function(res) {
        let $ = res.jQuery;
        let response = res.response;

        expect(response.statusCode).to.equal(200);
        expect($('body').length).to.equal(1);
      });
  });

});
