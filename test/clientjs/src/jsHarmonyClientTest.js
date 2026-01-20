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
    mocha.run();
  }, 1);
  window.mocha = mocha;

  var XDom = jsHarmony.XDom;
  window.XDom = XDom;

  function throwError(msg){
    var errmsg = msg || 'Assertion failed';
    console.error('The following assertion failed: '+errmsg);
    throw new Error(errmsg);
  }

  function assert(val, msg){
    if(!val){
      throwError(msg || 'Assertion failed');
    }
  }

  function assertError(f, errDesc, msg){
    try{
      f();
    }
    catch(ex){
      if(errDesc){
        errDesc = errDesc.toString();
        if(ex && ex.message && (ex.message.indexOf(errDesc) >= 0)){
          return true;
        }
      }
      else {
        return true;
      }
    }
    throwError(msg || 'Error not thrown: '+errDesc);
  }

  describe('XDom selector ', function() {
    it('selector css class ', function(){
      var result = XDom.selector('.sharedClass1');
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector == '.sharedClass1', 'selector property matches');
    });
    
    it('selector css id ', function(){
      var result = XDom.selector('#item1')
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector === '#item1', 'selector property matches');
    });

    it('selector html string ', function(){
      var result = XDom.selector('<div>Test div</div>');
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector === '<div>Test div</div>', 'selector property matches');
    });

    it('selector document ', function(){
      var result = XDom.selector(document);
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector === document, 'selector property matches');
    });

    it('selector window ', function(){
      var result = XDom.selector(window);
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector === window, 'selector property matches');
    });
    // null selector in jsharmony, not supported right now...
    it('selector null ', function(){
      assertError(function(){
        var result = XDom.selector();
      }, 'Selector is required');
    });

    /*
    it('selector XDom obj ', function(){
      var result = XDom.selector(new XDomSelector('.testToBeReplacedByNull'));
      assert(result instanceof XDomSelector, 'result is XDomSelecor obj');
      assert(result.selector instanceof XDomSelector, 'selector property matches');
      assert(result.selector.selector === '.test', 'selector property matches');
    });
    */
  });

  describe('XDom select ', function() {
    //set up
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
        '<footer></footer>',
        '<footer></footer>',
      ].join('');
    });

    it('select css class ', function(){
      assert(XDom.select('.sharedClass1').length == 2, 'sharedClass1 elements found');
      assert(XDom.select('.sharedClass2').length == 2, 'sharedClass2 elements found');
      assert(XDom.select('.sharedClass3').length == 3, 'sharedClass3 elements found');
      assert(XDom.select('.singleClass').length == 1, 'singleClass elements found');
    });
    
    it('select css id ', function(){
      assert(XDom.select('#item1').length == 1, 'item1 found');
      assert(XDom.select('#item2, #item3').length == 2, 'item2, item3 found');
      assert(XDom.select('#item5_notfound').length == 0, 'invalid item not found');
    });

    it('select element ', function(){
      assert(XDom.select('footer').length == 2, 'all footer elements found');
      assert(XDom.select('nav').length == 0, 'invaid element not found');
    });

    //clear workspace
    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom selectOne ', function() {
    //set up
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
        '<footer></footer>',
      ].join('');
    });

    it('selectOne css class ', function(){
      assert(XDom.selectOne('.sharedClass1').id === 'item1', 'one sharedClass1 element found');
      assert(XDom.selectOne('.sharedClass2').id === 'item2', 'one sharedClass2 element found');
      assert(XDom.selectOne('.sharedClass3').id === 'item1', 'one sharedClass3 element found');
      assert(XDom.selectOne('.noSuchClass') === null, 'invalid class not found');
    });

    it('selectOne css id ', function(){
      assert(XDom.selectOne('#item1').id === 'item1', 'item1 found');
      assert(XDom.selectOne('#item2').id === 'item2', 'item2 found');
      assert(XDom.selectOne('#item5_notfound') === null, 'invalid item not found');
    });

    it('selectOne element ', function(){
      result1 = XDom.selectOne('footer');
      result2 = XDom.selectOne('nav');
      assert(result1 instanceof Element , 'element found');
      assert(result2 === null, 'invalid element not found');
    });

    //clear workspace
    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom addClass ', function() {
    //set up
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('addClass css class', function(){
      XDom.addClass('#item1','addedClass');
      assert(XDom.containsClass('#item1','addedClass'), 'Class added');
      XDom.removeClass('#item1','addedClass');
      assert(!XDom.containsClass('#item1','addedClass'), 'Class removed');
    });

    //clear workspace
    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });
})();
