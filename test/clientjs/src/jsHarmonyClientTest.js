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
  var jsh = new jsHarmony({_instance: 'jshInstance'});
  var XExt = jsh.XExt;

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

  function assertEqual(a, b, msg){
    if(a !== b){
      throwError((msg || 'Assertion failed') + ": " + (a && a.toString()) + " !== " + (b && b.toString()));
    }
  }

  describe('XDom selector', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"><p></p></div>',
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass3"></div>',
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });
    it('selector css class ', function(){
      assert(XDom('.sharedClass1').selector('p').target ==='.sharedClass1 p', 'Target found');
    });
    
    it('selector css id ', function(){
      assert(XDom('#item1').selector('p').target ==='#item1 p', 'Target found');
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
        '<div id="item2" class="sharedClass1 sharedClass2 sharedClass3"></div>',
      ].join('');
    });

    it('containsClass css class ', function(){
      assert(XDom("#item1").class.contains('sharedClass1'), 'Found item1 contains sharedClass1');
      assert(XDom("#item2").class.contains('sharedClass1'), 'Found item2 contains .sharedClass1');
      assert(!XDom("#item1").class.contains('sharedClass2'), 'Did not find item1 contains sharedClass3');
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
      XDom('#item1').class.add('addedClass');
      assert(XDom('#item1').class.contains('addedClass'), 'Class added');
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
      XDom('#item1').class.remove('sharedClass1');
      assert(!XDom('#item1').class.contains('sharedClass1'), 'Class removed');
      XDom('#item2').class.remove('sharedClass2');
      assert(XDom('#item2').class.contains('sharedClass1')&&(XDom('#item2').class.contains('sharedClass3')), 'No class was removed classes');
      XDom('#item3').class.remove('sharedClass2');
      assert(!XDom('#item3').class.contains('sharedClass2'), 'All duplicate classes removed');
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
    beforeEach(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item4" class="singleClass"></div>',
      ].join('');
    });

    it('appendHtml css id ', function() {
      XDom('#item4').content.append('<p>Test1</p>');
      var el = XDom.selectOne('#item4');
      assert(el.querySelector('p') !== null, 'p element was appended');
      assert(el.querySelector('p').textContent === 'Test1', 'p element contains correct text');
    });

    it('appendHtml multiple nodes ', function() {
      XDom('#item4').content.append('before <p>Test2</p> after');
      var el = XDom.selectOne('#item4');
      assert(el.querySelector('p') !== null, 'p element was appended');
      assert(el.querySelector('p').textContent === 'Test2', 'p element contains correct text');
    });

    it('appendHtml tr', function() {
      XDom('#item4').content.append('<tr><td><p>Test3</p></td></tr>');
      var el = XDom.selectOne('#item4');
      assert(el.querySelector('tr') !== null, 'tr element was appended');
      assert(el.querySelector('p').textContent === 'Test3', 'p element contains correct text');
    });

    it('appendHtml input elements have a type property', function() {
      XDom('#item4').content.append('<input type="text"/>');
      var el = XDom.selectOne('#item4');
      assertEqual(el.querySelector('input').type, 'text', 'input element has a type property');
    });

    it('appendHtml does not execute scripts', function() {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script>alert("hi");window.jsh_xdom_runs_scripts = true;</script>');
      assertEqual(window.jsh_xdom_runs_scripts, undefined, 'script execution');
    });

    it('appendHtml does not execute src scripts', function(done) {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script src="script.js?_=1"></script>');
      setTimeout(function() {
        assertEqual(window.jsh_xdom_runs_scripts, undefined, 'src script execution');
        done()
      }, 100);
    });

    it('appendHtml does execute scripts with parameter', function() {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script>window.jsh_xdom_runs_scripts = true;</script>', {evaluateScripts: true});
      assertEqual(window.jsh_xdom_runs_scripts, true, 'script execution');
    });

    it('appendHtml does not execute other types of scripts with parameter', function() {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script type="text/x-jsharmony-template">window.jsh_xdom_runs_scripts = true;</script>', {evaluateScripts: true});
      assertEqual(window.jsh_xdom_runs_scripts, undefined, 'script execution');
    });

    it('appendHtml does execute javascript scripts with parameter', function() {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script type="text/javascript">window.jsh_xdom_runs_scripts = true;</script>', {evaluateScripts: true});
      assertEqual(window.jsh_xdom_runs_scripts, true, 'script execution');
    });

    it('appendHtml does execute src scripts with parameter', function(done) {
      delete window.jsh_xdom_runs_scripts;
      XDom('#item4').content.append('<script src="script.js?_=2"></script>', {evaluateScripts: true});
      setTimeout(function() {
        assertEqual(window.jsh_xdom_runs_scripts, true, 'src script execution with param');
        done()
      }, 100);
    });

    it('appendHtml does execute handlers', function() {
      delete window.jsh_xdom_runs_handlers;
      XDom('#item4').content.append('<div id="clickable" onclick="window.jsh_xdom_runs_handlers = true;"></div>');
      XDom('#clickable').emit('click');
      assertEqual(window.jsh_xdom_runs_handlers, true, 'script execution');
      delete window.jsh_xdom_runs_handlers;
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
      XDom('#item4').content.prepend('<p>Test</p>');
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
      XDom('#item1').content.replace('<p>Replacement text</p>');
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
      XDom('#item1').content.clear();
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

    it('on multiple events ', function() {
      var handlerCalled = 0;
      XDom.on('#item1', 'click foo', function() {
        handlerCalled++;
      });
      XDom.selectOne('#item1').click();
      XDom('#item1').emit('foo');
      assertEqual(handlerCalled, 2, 'both events executed');
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

    it('off multiple events ', function() {
      var handlerCalled = 0;
      var handler = function() {
        handlerCalled++;
      }
      XDom.on('#item1', 'click foo', handler);
      XDom.off('#item1', 'click foo', handler);
      XDom.selectOne('#item1').click();
      XDom('#item1').emit('foo');
      assertEqual(handlerCalled, 0, 'off removed all events');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom emit', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
        '<input type="checkbox" id="checkbox1"/>',
      ].join('');
    });

    it('standard event', function() {
      var handler = function() {
        handlerCalled = true;
      }
      XDom.on('#item1', 'click', handler);
      XDom.emit('#item1', 'click');
      assert(handlerCalled, 'emit triggered handler');
      XDom.off('#item1', 'click', handler);
    });

    it('nonstandard event', function() {
      var handler = function() {
        handlerCalled = true;
      }
      XDom.on('#item1', 'foo', handler);
      XDom.emit('#item1', 'foo');
      assert(handlerCalled, 'emit triggered handler');
      XDom.off('#item1', 'foo', handler);
    });

    it('custom event', function() {
      var handler = function(e) {
        if (e.detail == 'bar') {
          handlerCalled = true;
        }
      }
      XDom.on('#item1', 'custom', handler);
      XDom.emit('#item1', new CustomEvent('custom', {detail: 'bar'}));
      assert(handlerCalled, 'emit triggered handler');
      XDom.off('#item1', 'custom', handler);
    });

    it('selector', function() {
      var handler = function() {
        handlerCalled = true;
      }
      XDom('#item1').on('click', handler);
      XDom('#item1').emit('click');
      assert(handlerCalled, 'emit triggered handler');
      XDom('#item1').off('click', handler);
    });

    it('input responding to click event', function() {
      XDom.emit('#checkbox1', 'click');
      assertEqual(XDom('#checkbox1').element.checked, true, 'emit triggered input');
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
      assert(XDom.selector('#item1').data.userId == '77', 'Secondary method works...');
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

  describe('XDom parent', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="grandparent" class="target">',
        '  <div id="parent">',
        '    <div id="child" class="sibling"></div>',
        '    <div class="sibling"></div>',
        '  </div>',
        '</div>',
        '<div class="target"></div>',
      ].join('');
    });

    it('no arguments', function(){
      assert(XDom('#child').parent().attr.id === 'parent', 'found parent');
    });

    it('higher level parent', function(){
      var parent = XDom('#child').parent('.target');
      assert(parent.attr.id === 'grandparent', 'found grandparent');
      assert(parent.length == 1, 'found only grandparent');
    });

    it('parent not found', function(){
      assert(XDom('#child').parent('.not.found').length == 0, 'no parent found');
    });

    it('deduplication', function(){
      assert(XDom('.sibling').parent().length == 1, 'siblings have one parent');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });
  
  describe('XDom siblings', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1"></div>',
        '<div id="item2"></div>',
        '<div id="item3"></div>',
      ].join('');
    });

    it('next', function(){
      assert(XDom('#item1').nextSibling().attr.id === 'item2', 'found next');
    });

    it('next when last', function(){
      assert(XDom('#item3').nextSibling().length == 0, 'nothing is next');
    });

    it('next with filter', function(){
      assert(XDom('#item1').nextSibling('#item3').attr.id === 'item3', 'found next');
    });

    it('next with filter - not found', function(){
      assert(XDom('#item1').nextSibling('.not.found').length == 0, 'nothing is found');
    });

    it('previous', function(){
      assert(XDom('#item2').previousSibling().attr.id === 'item1', 'found previous');
    });

    it('previous when first', function(){
      assert(XDom('#item1').previousSibling().length == 0, 'nothing is previous');
    });

    it('prevoius with filter', function(){
      assert(XDom('#item3').previousSibling('#item1').attr.id === 'item1', 'found previous');
    });

    it('previous with filter - not found', function(){
      assert(XDom('#item3').nextSibling('.not.found').length == 0, 'nothing is found');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom first/last', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="target"></div>',
        '<div id="item2" class="target"></div>',
        '<div id="item3" class="target"></div>',
      ].join('');
    });

    it('first', function(){
      assert(XDom('.target').first().attr.id === 'item1', 'found first');
    });

    it('first of of nothing', function(){
      assert(XDom('.not.found').first().length == 0, 'nothing is first');
    });

    it('last', function(){
      assert(XDom('.target').last().attr.id === 'item3', 'found last');
    });

    it('last of of nothing', function(){
      assert(XDom('.not.found').last().length == 0, 'nothing is last');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom children', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="parent">',
        '  <div class="kid">',
        '    <div></div>',
        '  </div>',
        '  <div class="kid"></div>',
        '</div>',
        '<div id="empty" class="kid"></div>',
      ].join('');
    });

    it('has children', function(){
      assert(XDom('#parent').children.length === 2, 'parent has children');
    });

    it('no children', function(){
      assert(XDom('#empty').children.length === 0, 'element should have no children');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom filter/omit', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="target"></div>',
        '<div class="target"></div>',
        '<div class="target"></div>',
      ].join('');
    });

    it('base case', function(){
      assert(XDom('.target').length === 3, 'starting with correct number of elements');
    });

    it('filter true', function(){
      assert(XDom('.target').filter(function(el){return true;}).length === 3, 'filtered all elements');
    });

    it('filter false', function(){
      assert(XDom('.target').filter(function(el){return false;}).length === 0, 'filtered all elements');
    });

    it('filter selective', function(){
      assert(XDom('.target').filter(function(el){return el.id == 'item1';}).length === 1, 'filtered one element');
    });

    it('filter empty set', function(){
      assert(XDom('.not.found').filter(function(el){return true;}).length === 0, 'empty is empty');
    });

    it('omit true', function(){
      assert(XDom('.target').omit(function(el){return true;}).length === 0, 'omited all elements');
    });

    it('omit false', function(){
      assert(XDom('.target').omit(function(el){return false;}).length === 3, 'omited all elements');
    });

    it('omit selective', function(){
      assert(XDom('.target').omit(function(el){return el.id == 'item1';}).length === 2, 'omited one element');
    });

    it('omit empty set', function(){
      assert(XDom('.not.found').omit(function(el){return true;}).length === 0, 'empty is empty');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom insertBefore', function() {
    function setup(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="parent">',
          '<div id="child1" class="child">1</div>',
          '<div id="child2" class="child">2</div>',
        '</div>',
      ].join('');
    }

    it('insert into empty parent', function() {
      setup();
      var el = document.createElement('div');
      XDom.selector('#child1').insertBefore(el, null);
      assert(XDom.selector('#child1').children.length == 1, 'an empty target now has one child');
    });

    it('insert with no reference', function() {
      setup();
      var el = document.createElement('div');
      XDom.selector('#parent').insertBefore(el, null);
      assert(XDom.selector('#parent').children.elements[2] == el, 'inserted at end');
    });

    it('before first element', function() {
      setup();
      var el = document.createElement('div');
      var ref = document.getElementById('child1');
      XDom.selector('#parent').insertBefore(el, ref);
      assert(XDom.selector('#parent').children.elements[0] == el, 'inserted at beginning');
    });

    it('in the middle', function() {
      setup();
      var el = document.createElement('div');
      var ref = document.getElementById('child2');
      XDom.selector('#parent').insertBefore(el, ref);
      assert(XDom.selector('#parent').children.elements[1] == el, 'inserted at middle');
    });

    it('no target', function() {
      setup();
      var el = document.createElement('div');
      XDom.selector('.not.found').insertBefore(el, null);
      assert(el.parentNode == null, 'node was not inserted');
    });

    it('multiple targets', function() {
      setup();
      var el = document.createElement('div');
      XDom.selector('.child').insertBefore(el, null);
      assert(XDom.selector('#child1').children.length == 0, 'not in child1');
      assert(XDom.selector('#child2').children.length == 1, 'in child2');
    });

    it('multiple elements', function() {
      setup();
      var _el = XDom.render('before <div>inside</div> after');
      var ref = document.getElementById('child2');
      XDom.selector('#parent').insertBefore(_el, ref);
      assertEqual(XDom.selector('#parent').elements[0].textContent, '1before inside after2', 'inserted all nodes in order');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  })

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
      assert(XDom.selector('#item1').calc.width() === 200, 'found correct offsetwidth');
    });
    it('calc height css id ', function() {
      assert(XDom.selector('#item2').calc.height() === 200, 'found correct offsetheight');
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
        '<footer></footer>',
        '<input id="iteminput"></input>'
      ].join('');
    });

    it('resolve null ', function(){
      assert(XDom.resolve().length == 0,'Null has resolved length 0');
    });

    it('resolve array', function(){
      assertEqual(XDom.resolve(['#item1', '#item2']).length, 2,'Array has resolved length 2');
      assertEqual(XDom.resolve(['#item1', '#item2'])[0],'#item1','Contents of arrays are not processed');
    });

    it('resolve css string ', function(){
      assertEqual(XDom.resolve('.sharedClass1').length, 2,'Css string has resolved length 2');
      assert(XDom.resolve('.sharedClass1')[0] instanceof HTMLElement,'Css string resovles to dom elements');
    });

    // it('resolve selector ', function() { //selector is not well understood to test
    //   assert(XDom.resolve({selector: '.sharedClass1'}).length == 2, 'Resolved selector');
    //   assert(XDom.resolve(XDom.selector('.sharedClass1')).length == 2, 'Resolved selector');
    // });

    it('resolve DOM elem query ', function() {
      assertEqual(XDom.resolve('footer').length, 1, 'Resolved one DOM elem');
      assert(XDom.resolve('footer')[0] instanceof HTMLElement, 'Resolved DOM elem');
    });

    it('resolve DOM elem query - input', function() {
      assertEqual(XDom.resolve('#iteminput').length, 1, 'Resolved one DOM elem');
      assert(XDom.resolve('#iteminput')[0] instanceof HTMLInputElement, 'Resolved DOM elem');
    });

    it('resolve DOM elem - input', function() {
      var input = document.querySelector('#iteminput');
      assertEqual(XDom.resolve(input).length, 1, 'Resolved one DOM elem');
      assert(XDom.resolve(input)[0] instanceof HTMLInputElement, 'Resolved DOM elem');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom width / height', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div class="outerbox" style="border:3px solid black;">',
        '    <div class="innerbox" style="border:3px solid orange; margin:20px; padding:40px; display:inline-block;">',
        '      <div class="contentbox" style="border:1px solid black; width:20px; height: 20px; display:inline-block;"></div>',
        '    </div>',
        '</div>',
      ].join('');
    });

    it('width / height', function(){
      var contentBox = XDom('.contentbox');
      var innerBox = XDom('.innerbox');
      var outerBox = XDom('.outerbox');

      assert(contentBox.calc.widthToMargin() == 22, 'contentbox width to margin');
      assert(contentBox.calc.widthToBorder() == 22, 'contentbox width to border');
      assert(contentBox.calc.widthToPadding() == 20, 'contentbox width to padding');
      assert(contentBox.calc.widthToContent() == 20, 'contentbox width to content');

      assert(contentBox.calc.heightToMargin() == 22, 'contentbox height to margin');
      assert(contentBox.calc.heightToBorder() == 22, 'contentbox height to border');
      assert(contentBox.calc.heightToPadding() == 20, 'contentbox height to padding');
      assert(contentBox.calc.heightToContent() == 20, 'contentbox height to content');

      assert(innerBox.calc.widthToMargin() == 148, 'innerBox width to margin');
      assert(innerBox.calc.widthToBorder() == 108, 'innerBox width to border');
      assert(innerBox.calc.widthToPadding() == 102, 'innerBox width to padding');
      assert(innerBox.calc.widthToContent() == 22, 'innerBox width to content');

      assert(innerBox.calc.heightToMargin() == 148, 'innerBox height to margin');
      assert(innerBox.calc.heightToBorder() == 108, 'innerBox height to border');
      assert(innerBox.calc.heightToPadding() == 102, 'innerBox height to padding');
      assert(innerBox.calc.heightToContent() == 22, 'innerBox height to content');

      var workspace = document.getElementById('workspace');
      assert(outerBox.calc.widthToMargin() == workspace.clientWidth, 'outerBox width to margin');
      assert(outerBox.calc.widthToBorder() == workspace.clientWidth, 'outerBox width to border');
      assert(outerBox.calc.widthToPadding() == workspace.clientWidth - 6, 'outerBox width to padding');
      assert(outerBox.calc.widthToContent() == workspace.clientWidth - 6, 'outerBox width to content');

      assert(outerBox.calc.heightToMargin() == 154, 'outerBox height to margin');
      assert(outerBox.calc.heightToBorder() == 154, 'outerBox height to border');
      assert(outerBox.calc.heightToPadding() == 148, 'outerBox height to padding');
      assert(outerBox.calc.heightToContent() == 148, 'outerBox height to content');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom top / left', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div class="outerbox" style="border:3px solid black; position: relative;">',
        '    <div class="innerbox" style="border:3px solid orange; margin:20px; padding:40px; display:inline-block;">',
        '      <div class="contentbox" style="border:1px solid black; width:20px; height: 20px; display:inline-block;"></div>',
        '    </div>',
        '</div>',
      ].join('');
    });

    it('top', function(){
      var contentBox = XDom('.contentbox');
      var innerBox = XDom('.innerbox');
      var outerBox = XDom('.outerbox');

      assertEqual(typeof(contentBox.calc.top()), 'number', 'contentBox top');
      assertEqual(typeof(contentBox.calc.topFromDocument()), 'number', 'contentBox top from document');
      assertEqual(contentBox.calc.topFromParent(), 43, 'contentBox top from parent');
      assertEqual(contentBox.calc.topFromOffsetParent(), 66, 'contentBox top from offset parent');
      assertEqual(contentBox.calc.topFrom(innerBox.element), 43, 'contentBox top from target');
    });

    it('left', function(){
      var contentBox = XDom('.contentbox');
      var innerBox = XDom('.innerbox');
      var outerBox = XDom('.outerbox');

      assertEqual(typeof(contentBox.calc.left()), 'number', 'contentBox left');
      assertEqual(typeof(contentBox.calc.leftFromDocument()), 'number', 'contentBox left from document');
      assertEqual(contentBox.calc.leftFromParent(), 43, 'contentBox left from parent');
      assertEqual(contentBox.calc.leftFromOffsetParent(), 66, 'contentBox left from offset parent');
      assertEqual(contentBox.calc.leftFrom(innerBox.element), 43, 'contentBox left from target');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom isVisible', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div class="visible"></div>',
        '<div class="hidden" style="display: none"></div>',
      ].join('');
    });

    it('is visible', function(){
      assert(XDom.isVisible(XDom('.visible').element), 'normal element is visible');
    });

    it('is not visible', function(){
      assert(!XDom.isVisible(XDom('.hidden').element), 'off element is not visible');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom isElement', function() {
    before(function(){
      document.querySelector('#workspace').innerHTML = [
        'text',
        '<div></div>',
      ].join('');
    });

    it('is element', function(){
      assert(XDom.isElement(XDom('#workspace div').element), 'div is element');
    });

    it('is not element', function(){
      assert(!XDom.isElement(document.querySelector('#workspace').childNodes[0]), 'text is not element');
    });

    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  });

  describe('XDom animate', function() {
    beforeEach(function(){
      document.querySelector('#workspace').innerHTML = [
        '<div id="item1" class="sharedClass1 sharedClass3"></div>',
        '<div id="item2" class="sharedClass1 sharedClass3"></div>',
        '<div id="item3" class="sharedClass2 sharedClass2"></div>',
        '<div id="item4" class="singleClass"></div>',
        '<footer></footer>'
      ].join('');
    });

    it('animate duration zero ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({width: '400px'}, 0, function(){
        assert(XDom.selector('#item1').calc.width() === 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() === 400, 'found correct width');
        done();
      });
    });

    it('animate duration non zero ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({width: '400px'}, 100, function(){
        assert(XDom.selector('#item1').calc.width() === 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() === 400, 'found correct width');
        done();
      });
    });
      
    it('animate stopped full set ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      setTimeout(function(){
        sharedClass1_el.stop();
        done();
      }, 50);
      sharedClass1_el.animate({width: '400px'}, 100, function(){
        assert(XDom.selector('#item1').calc.width() !== 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() !== 400, 'found correct width');
        done(err);
      });
    });

    it('animate stopped full set with callback ', function(done) {
      var check = 0;
      var sharedClass1_el = XDom('.sharedClass1');
      var callback = function(){check = 1;};
      sharedClass1_el.animate({width: '400px'}, 100, function(){check = 1});
      setTimeout(function(){
        sharedClass1_el.stop();
        assert(XDom.selector('#item1').calc.width() !== 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() !== 400, 'found correct width');
        assert(check === 0, 'callback never fires');
        done();
      }, 50);
    });

    it('animate stopped subset ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      var first_el = XDom('#item1');
      setTimeout(function(){
        first_el.stop();
      }, 50);
      sharedClass1_el.animate({width: '400px'}, 100, function(){
        assert(XDom.selector('#item1').calc.width() !== 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() === 400, 'found correct width');
        done();
      });
    });

    it('animate multi props ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({width: '400px', height: '400px', opacity: 0}, 100, function(){
        assert(XDom.selector('#item1').calc.width() === 400, 'found correct width');
        assert(XDom.selector('#item2').calc.width() === 400, 'found correct width');
        assert(XDom.selector('#item1').calc.height() === 400, 'found correct height');
        assert(XDom.selector('#item2').calc.height() === 400, 'found correct height');
        done();
      });
    });

    it('animate color props rgb ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({color: 'rgb(1, 2, 3)'}, 100, function(){
        assert(XDom.selector('#item1').style.color === 'rgb(1, 2, 3)', 'found correct color');
        done();
      });
    });

    it('animate color props rgba ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({color: 'rgba(1, 2, 3, 0.95)'}, 100, function(){
        assert(XDom.selector('#item1').style.color === 'rgba(1, 2, 3, 0.95)', 'found correct color');
        done();
      });
    });

    it('animate color props hex RRGGBB ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({color: '#FF00FF'}, 100, function(){
        assert(XDom.selector('#item1').style.color === 'rgb(255, 0, 255)', 'found correct color');
        done();
      });
    });

    it('animate color props hex RRGGBBAA ', function(done) {
      var sharedClass1_el = XDom('.sharedClass1');
      sharedClass1_el.animate({color: '#FF00FFF5'}, 100, function(){
        assert(XDom.selector('#item1').style.color === 'rgba(255, 0, 255, 0.96)', 'found correct color');
        done();
      });
    });
    
    after(function(){
      document.querySelector('#workspace').innerHTML = '';
    });
  })

  /*
  describe('XExt Request_JSONP', function() {
    // https://github.com/tghosth/jsonp-server-test

    it('jQuery Control', function(done){
      jsHarmony.jQuery.ajax('http://localhost:3000/foo', {
        cache: false,
        jsonp: 'cb',
        dataType: 'jsonp',
        complete: function(data) {
          assertEqual(data.responseJSON, 'super secret response data foo', 'jquery request');
          done();
        },
        error: function(err) {
          assert(false, 'jquery request error');
          done();
        },
      });
    });

    it('XExt.Request_JSONP', function(done){
      XExt.Request_JSONP('http://localhost:3000/foo', {
        jsonp: 'cb',
        complete: function(data) {
          assertEqual(data, 'super secret response data foo', 'xext request');
          done();
        },
        error: function(err) {
          assert(false, 'xext request error');
          done();
        },
      });
      assert(true, 'request');
    });
  });
  */
})();
