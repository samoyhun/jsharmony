/*
Copyright 2026 apHarmony

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

var _ = require('lodash');

var XDom = function(){ };
exports = module.exports = XDom;

XDomSelector = function(selector){
  //if(!selector) throw new Error('Selector is required');
  this.selector = selector;
};
XDom.XDomSelector = XDomSelector;

XDom.select = function(selector){
  return document.querySelectorAll(selector);
}

XDom.selectOne = function(selector){
  return document.querySelector(selector);
}

XDom.selector = function(selector){
  return new XDomSelector(selector);
}

XDom.resolve = function(target){
  if(!target) return [];
  if(_.isArray(target)) return target;
  if(_.isString(target)) return XDom.select(target);
  if(target.selector) return XDom.select(target.selector);
  return [target];
}

XDom.addClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.classList && el.classList.add) el.classList.add(className);
  });
}

XDom.removeClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.classList && el.classList.remove) el.classList.remove(className);
  });
}

XDom.containsClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  if(_el.length == 0) return false;
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(!el || !el.classList || !el.classList.contains || !el.classList.contains(className)) return false;
  }
  return true;
}

XDom.setStyle = function(target, prop, val){
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.style){
      console.log('setting style');
      el.style[prop] = val;
    }
  });
}
