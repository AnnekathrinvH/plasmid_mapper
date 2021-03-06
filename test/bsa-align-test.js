'use strict';

var expect = require('chai').expect;
var align = require('../alignment.js');

describe('alignment', function () {

    it ('should return 3 for specified values', function(done) {
        //arrange
        var is_local = true;
        var target = 'ACC';
        var query = 'ACC';
        var ms = 1;
        var mms = -1;
        var gapo = -1;
        var gape = -1;


        //act

        var result = align.bsa_align(is_local, target, query, [ms, mms], [gapo, gape]);

        //assert
        expect(result[0]).to.equal(3);

        done();
    });


})
