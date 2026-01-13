/*
Copyright 2025 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/

var mocha = require('mocha');

(function(){
  mocha.setup('bdd');
  setTimeout(function(){
    //mocha.run();
  }, 1);
  window.mocha = mocha;

  var XDom = jsHarmony.XDom;
  window.XDom = XDom;

  function assert(val, msg){
    if(!val){
      var errmsg = msg || 'Assertion failed';
      console.error('The following assertion failed: '+errmsg);
      throw new Error(errmsg);
    }
  }

  describe('XDom selector', function() {
    //set up
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('select class', function(){
      console.log('1');
      assert(XDom.select('.sharedClass1').length == 2, 'sharedClass1 elements found');
      assert(XDom.select('.sharedClass2').length == 2, 'sharedClass2 elements found');
      assert(XDom.select('.sharedClass3').length == 3, 'sharedClass3 elements found');
      assert(XDom.select('.singleClass').length == 1, 'singleClass elements found');
    });

    it('select id', function(){
      console.log('2');
      assert(XDom.select('#item1').length == 1, 'item1 found');
      assert(XDom.select('#item2 #item3').length == 2, 'item2, item3 found');
      assert(XDom.select('#item5_notfound').length == 0, 'invalid item not found');
    });

    //clear workspace
    after(function(){
      console.log('3');
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom class', function() {
    //set up
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('add class', function(){
      console.log('a1');
      XDom.addClass('#item1','addedClass');
      assert(XDom.containsClass('#item1','addedClass'), 'Class added');
      XDom.removeClass('#item1','addedClass');
      assert(!XDom.containsClass('#item1','addedClass'), 'Class removed');
    });

    //clear workspace
    after(function(){
      console.log('3');
      document.querySelector('#workspace').innerHTML = '';
    });
  });
})();
