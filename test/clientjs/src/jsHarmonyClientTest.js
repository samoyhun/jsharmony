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

  describe('XDom selector', function() {
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

    it('selector null ', function(){
      assertError(function(){
        var result = XDom.selector();
      }, 'Selector is required');
    });
  });

  describe('XDom select', function() {
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

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom selectOne', function() {
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

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom containsClass', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class=".sharedClass1 sharedClass2 sharedClass3"></div>',
      ].join('');
    });

    it('containsClass css class ', function(){
      assert(XDom.containsClass("#item1", 'sharedClass1'), 'Found item1 contains sharedClass1');
      assert(XDom.containsClass("#item2", '.sharedClass1'), 'Found item2 contains .sharedClass1');
      assert(!XDom.containsClass("#item1", 'sharedClass2'), 'Did not find item1 contains sharedClass3');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom addClass', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('addClass css class ', function(){
      XDom.addClass('#item1','addedClass');
      assert(XDom.containsClass('#item1','addedClass'), 'Class added');
      XDom.removeClass('#item1','addedClass');
      assert(!XDom.containsClass('#item1','addedClass'), 'Class removed');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom removeClass', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass2"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('removeClass css class ', function(){
      XDom.removeClass('#item1','sharedClass1');
      assert(!XDom.containsClass('#item1','sharedClass1'), 'Class removed');
      XDom.removeClass('#item2','sharedClass2');
      assert(XDom.containsClass('#item2','sharedClass1')&&(XDom.containsClass('#item2','sharedClass3')), 'No class was removed classes');
      XDom.removeClass('#item3','sharedClass2');
      assert(!XDom.containsClass('#item3','sharedClass2'), 'All duplicate classes removed');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom setStyle', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
        '<div id="item2" class="sharedClass1"></div>',
        '<div id="item3" class="sharedClass1"></div>',
      ].join('');
    });

    it('setStyle color ', function() {
      XDom.setStyle('#item1', 'color', 'red');
      assert(XDom.selectOne('#item1').style.color === 'red', 'color set');

      XDom.setStyle('.sharedClass1', 'color', 'red');
      assert(XDom.select('.sharedClass1')[0].style.color === 'red', 'first shared class color set');
      assert(XDom.select('.sharedClass1')[1].style.color === 'red', 'second shared class color set');
    });

    after(function(){
       document.querySelector('#workspace').innerHTML = '';
     });
  });

  describe('XDom appendHtml ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('appendHtml css id ', function() {
      XDom.appendHtml('#item4', '<p>Test</p>');
      var el = XDom.selectOne('#item4');
      assert(el.querySelector('p') !== null, 'p element was appended');
      assert(el.querySelector('p').textContent === 'Test', 'p element contains correct text');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom prependHtml ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item4"></div>',
      ].join('');
    });

    it('prependHtml css id ', function() {
      XDom.prependHtml('#item4', '<p>Test</p>');
      var el = XDom.selectOne('#item4');
      assert(el.querySelector('p') !== null, 'p element was prepended');
      assert(el.querySelector('p').textContent === 'Test', 'p element contains correct text');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom setHtml', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"> <p>To be replaced</p> </div>',
      ].join('');
    });

    it('setHtml css id ', function() {
      XDom.setHtml('#item1', '<p>Replacement text</p>');
      el = XDom.selectOne('#item1');
      assert(el.querySelector('p').innerHTML === 'Replacement text', 'html set');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom clear', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"> <p>To be cleared</p> </div>',
      ].join('');
    });

    it('clear css id ', function() {
      XDom.clear('#item1');
      el = XDom.selectOne('#item1');
      assert(el.querySelector('p') === null, 'html cleared');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom getAttribute', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" href="https://example.com" target="_blank" ></div>',
      ].join('');
    });

    it('getAttribute css id ', function() {
      assert(XDom.getAttribute('#item1', 'id') === 'item1', 'got id with getAttribute');
      assert(XDom.getAttribute('#item1', 'href') === 'https://example.com', 'got id with getAttribute');
      assert(XDom.getAttribute('#item1', 'target') === '_blank', 'got id with getAttribute');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom setAttribute', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
      ].join('');
    });

    it('setAttribute css id ', function() {
      XDom.setAttribute('#item1', 'href', 'https://example.com');
      XDom.setAttribute('#item1', 'target', '_blank');
      assert(XDom.getAttribute('#item1', 'href') === 'https://example.com', 'href attribute set with setAttribute');
      assert(XDom.getAttribute('#item1', 'target') === '_blank', 'target attribute set with setAttribute');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom on', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
      ].join('');
    });

    it('on css id ', function() {
      var handlerCalled = false;
      XDom.on('#item1', 'click', function() {
        handlerCalled = true;
      });
      XDom.selectOne('#item1').click();
      assert(handlerCalled, 'on added event and executed');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom off', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
      ].join('');
    });

    it('off css id ', function() {
      var handlerCalled = false;
      var handler = function() {
        handlerCalled = true;
      }
      XDom.on('#item1', 'click', handler);
      XDom.off('#item1', 'click', handler);
      XDom.selectOne('#item1').click();
      assert(!handlerCalled, 'off removed added event');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom getValue ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<input id="item1" value="Bob">',
      ].join('');
    });

    it('getValue css id', function() {
      assert(XDom.getValue('#item1') === 'Bob', 'getValue returned the correct value');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom setValue ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<input id="item1" value="John">',
      ].join('');
    });

    it('setValue css id', function() {
      XDom.setValue('#item1', 'Bob');
      assert(XDom.getValue('#item1') === 'Bob', 'setValue returned the correct value');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom getData ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" data-user-id="77" data-status="active"></div>',
      ].join('');
    });

    it('getData css id ', function() {
      assert(XDom.getData('#item1', 'userId') === '77', 'getData returned the correct data');
      assert(XDom.getData('#item1', 'status') === 'active', 'getData returned the correct data');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom setData ', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
      ].join('');
    });

    it('setData css id ', function() {
      XDom.setData('#item1', 'userId', '77');
      XDom.setData('#item1', 'status', 'active');
      assert(XDom.getData('#item1', 'userId') === '77', 'setData set the correct data');
      assert(XDom.getData('#item1', 'status') === 'active', 'setData set the correct data');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom style', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass2"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('style display css id ', function() {
      XDom.style.display('#item1', false);
      assert(XDom.selectOne('#item1').style.display === 'none', 'display set to none');

      XDom.style.display('.sharedClass1', true);
      assert(XDom.select('.sharedClass1')[0].style.display === '', 'first sharedClass1 display cleared');
      assert(XDom.select('.sharedClass1')[1].style.display === '', 'second sharedClass1 display cleared');

      XDom.style.display('#item1', 'block');
      assert(XDom.selectOne('#item1').style.display === 'block', 'display set to block');
    });
    it('style width css id ', function() {
      XDom.style.width('#item2', 100);
      assert(XDom.selectOne('#item2').style.width === '100px', 'width set as px for number');

      XDom.style.width('.sharedClass3', '50%');
      assert(XDom.select('.sharedClass3')[0].style.width === '50%', 'first sharedClass3 width set');
      assert(XDom.select('.sharedClass3')[1].style.width === '50%', 'second sharedClass3 width set');

      assert(typeof XDom.style.width('#no_such_item') === 'undefined', 'width getter returns undefined for missing target');
    });
    it('style height css id ', function() {
      XDom.style.height('#item3', 40);
      assert(XDom.selectOne('#item3').style.height === '40px', 'height set as px for number');

      XDom.style.height('#item4', null);
      assert(XDom.selectOne('#item4').style.height === '', 'height cleared when null');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom calc', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" style="width: 200px" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" style="height: 200px"class="sharedClass1 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass2"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('calc width css id ', function() {
      assert(XDom.calc.width('#item1') === 200, 'found correct offsetwidth');
    });
    it('calc height css id ', function() {
      assert(XDom.calc.height('#item2') === 200, 'found correct offsetheight');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  })

  describe('XDom resolve', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass2"></div>',
        '<div id="item4" class="singleClass"></div>',
        '<footer></footer>'
      ].join('');
    });

    it('resolve null ', function(){
      assert(XDom.resolve().length == 0,'Null has resolved length 0');
    });

    it('resolve array', function(){
      assert(XDom.resolve(['#item1', '#item2']).length == 2,'Array has resolved length 2');
    });

    it('resolve css string ', function(){
      assert(XDom.resolve('.sharedClass1').length == 2,'Css string has resolved length 2');
    });

    // it('resolve selector ', function() { //selector is not well understood to test
    //   assert(XDom.resolve({selector: '.sharedClass1'}).length == 2, 'Resolved selector');
    //   assert(XDom.resolve(XDom.selector('.sharedClass1')).length == 2, 'Resolved selector');
    // });

    it('resolve DOM elem ', function() {
      assert(XDom.resolve('footer').length == 1, 'Resolved DOM elem');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });
})();
