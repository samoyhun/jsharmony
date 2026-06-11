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

///////////////////////////////
// Ideas for ".select()" alternative
// .resolve(), .get(), .multi(), .single(), .element, .el  , ._el
///////////////////////////////

var XDom = function(target, options){ return new Selector(target, options); };
exports = module.exports = XDom;

function selectWithin(selector, within){
  if(!within){
    return document.querySelectorAll(selector);
  }
  var _parent = XDom.resolve(within);
  if(!selector) return _parent;
  var _rslt = [];
  _.each(_parent, function(parent){
    if(parent && parent.querySelectorAll){
      _.each(parent.querySelectorAll(selector), function(child){ _rslt.push(child); });
    }
  });
  return _rslt;
}

var Selector = function(){
  var _this = this;

  var args = arguments;
  //<string> target
  //<string> target, <object> options
  //<object> base
  //<object, string> base, <string> target
  //<object, string> base, <string> target, <object> options

  _this.base = null;
  _this.target = null;
  _this.options = null;

  if(_.isString(args[0])){
    if(_.isString(args[1])){
      //<string> base, <string> target
      //<string> base, <string> target, <object> options
      _this.base = args[0];
      _this.target = args[1];
      _this.options = args[2];
    }
    else{
      //<string> target
      //<string> target, <object> options
      _this.target = args[0];
      _this.options = args[1];
    }
  }
  else {
    //<object> base
    //<object, string> base, <string> target
    //<object, string> base, <string> target, <object> options
    _this.base = args[0];
    _this.target = args[1];
    _this.options = args[2];
  }

  _this.options = _.extend({}, _this.options);
  _this.target = _this.target || '';

  if(!_this.target && !_this.base) throw new Error('Target or base element is required');

  _this.select = function(childSelector){
    return selectWithin((_this.target + ' ' + (childSelector||'')).trim(), _this.base);
  };

  _this.selectOne = function(childSelector){
    return XDom.selectOne((_this.target + ' ' + (childSelector||'')).trim(), _this.base);
  };

  _this.selector = function(childSelector){
    if(!childSelector) return _this;
    if(!_this.target) return new Selector(_this.base, childSelector);
    var _selectorPart = _this.target.split(',');
    var _childSelectorPart = childSelector.split(',');
    return new Selector(_this.base, _.map(_selectorPart, function(selectorPart){
      return _.map(_childSelectorPart, function(childSelectorPart){
        return (selectorPart.trim() + ' ' + childSelectorPart.trim()).trim();
      }).join(',');
    }).join(','));
  };

  _this.class = {
    add: XDom.class.add.bind(XDom, this),
    remove: XDom.class.remove.bind(XDom, this),
    contains: XDom.class.contains.bind(XDom, this),
  };
  _this.content = {
    append: XDom.content.append.bind(XDom, this),
    prepend: XDom.content.prepend.bind(XDom, this),
    replace: XDom.content.replace.bind(XDom, this),
    clear: XDom.content.clear.bind(XDom, this),
  };
  _this.attr = new Proxy({}, {
    get: function(target, prop, receiver) { return XDom.getAttribute(_this, prop); },
    set: function(target, prop, value) { return XDom.setAttribute(_this, prop, value); },
  });
  _this.on = XDom.on.bind(XDom, this);
  _this.off = XDom.off.bind(XDom, this);
  _this.emit = XDom.emit.bind(XDom, this);
  _this.animate = function(props, duration, callback){ return XDom.animate(this, props, duration, callback); };
  _this.stop = function(){ return XDom.stop(this); };
  Object.defineProperty(this, 'value', {
    get: function() { return XDom.getValue(this); },
    set: function(value) { XDom.setValue(this, value); },
  });
  Object.defineProperty(this, 'length', {
    get: function() { return this.select().length; },
  });
  _this.data = new Proxy({}, {
    get: function(target, prop, receiver) { return XDom.getData(_this, prop); },
    set: function(target, prop, value) { return XDom.setData(_this, prop, value); },
  });
  _this.style = new Proxy({}, {
    get: function(target, prop, receiver) {
      if(prop == 'calc') return XDom.style.calc(_this);
      if(prop == 'display') return XDom.style.display(_this);
      if(prop == 'width') return XDom.style.width(_this);
      if(prop == 'height') return XDom.style.height(_this);
      return XDom.getStyle(_this, prop);
    },
    set: function(target, prop, value) {
      if(prop == 'calc') throw new Error('Cannot set calculated style');
      if(prop == 'display') return XDom.style.display(_this, value);
      if(prop == 'width') return XDom.style.width(_this, value);
      if(prop == 'height') return XDom.style.height(_this, value);
      return XDom.setStyle(_this, prop, value);
    },
  });
  Object.defineProperty(this, 'innerHTML', {
    get: function() { return XDom.innerHTML(this); },
  });
  Object.defineProperty(this, 'outerHTML', {
    get: function() { return XDom.outerHTML(this); },
  });
  _this.calc = {
    width: XDom.calc.width.bind(XDom, this),
    widthToPadding: XDom.calc.widthToPadding.bind(XDom, this),
    widthToBorder: XDom.calc.widthToBorder.bind(XDom, this),
    widthToMargin: XDom.calc.widthToMargin.bind(XDom, this),
    widthToContent: XDom.calc.widthToContent.bind(XDom, this),
    height: XDom.calc.height.bind(XDom, this),
    heightToPadding: XDom.calc.heightToPadding.bind(XDom, this),
    heightToBorder: XDom.calc.heightToBorder.bind(XDom, this),
    heightToMargin: XDom.calc.heightToMargin.bind(XDom, this),
    heightToContent: XDom.calc.heightToContent.bind(XDom, this),
    top: XDom.calc.top.bind(XDom, this),
    topFromDocument: XDom.calc.topFromDocument.bind(XDom, this),
    topFromParent: XDom.calc.topFromParent.bind(XDom, this),
    topFromOffsetParent: XDom.calc.topFromOffsetParent.bind(XDom, this),
    topFrom: XDom.calc.topFrom.bind(XDom, this),
    left: XDom.calc.left.bind(XDom, this),
    leftFromDocument: XDom.calc.leftFromDocument.bind(XDom, this),
    leftFromParent: XDom.calc.leftFromParent.bind(XDom, this),
    leftFromOffsetParent: XDom.calc.leftFromOffsetParent.bind(XDom, this),
    leftFrom: XDom.calc.leftFrom.bind(XDom, this),
  };
  _this.parent = function(parentSelector){
    return new Selector(XDom.parent(this, parentSelector));
  };
  _this.nextSibling = function(){
    return new Selector(XDom.nextSibling(this));
  };
  _this.previousSibling = function(){
    return new Selector(XDom.previousSibling(this));
  };
  _this.first = function(){
    return new Selector(XDom.first(this) || []);
  };
  _this.last = function(){
    return new Selector(XDom.last(this) || []);
  };
  _this.filter = function(f){
    return new Selector(XDom.filter(this, f));
  };
  _this.omit = function(f){
    return new Selector(XDom.omit(this, f));
  };
  _this.insertBefore = XDom.insertBefore.bind(XDom, this);
  _this.remove = XDom.remove.bind(XDom, this);
  _this.focus = XDom.focus.bind(XDom, this);
  _this.blur = XDom.blur.bind(XDom, this);
  Object.defineProperty(this, 'children', {
    get: function() { return new Selector(XDom.getChildren(this)); },
  });
  //core functions
  //  children -> selector                             XDom.children([a,b,c])
  //  parent(selector) parent('div') -> selector       XDom.parent([a,b,c])
  //  nextSibling() -> selector                        XDom.nextSibling([a,b,c])
  //  previousSibling() -> selector                    XDom.previousSibling([a,b,c])
  //  first() -> selector                              XDom.first([a,b,c])
  //  last() -> selector                               XDom.last([a,b,c])
  //  filter (selector) (function) -> selector         XDom.filter([a,b,c])
  //  omit (selector) (function) -> selector           XDom.omit([a,b,c])
  //  emit -> void                                     XDom.emit(...)
  //  insertBefore -> void                             XDom.insertBefore(referenceNode)
  //  calc.top, calc.left // calc.top({ from: 'document' })  calc.top({ from: 'parent' })  calc.top({ from: 'offsetparent' })  calc.top({ from: [object] }) -> Number
  //  isVisible -> boolean, .filter(XDom.isVisible), .omit(XDom.isVisible)
  //  animate -> void

  //each => .select().forEach(...)
  //trigger = emit()
  //before => insertBefore
  //closest => parent(...selector)
  //insertBefore => insertBefore
  //next => nextSibling
  //prev => previousSibling
  //offsetParent => .calc.top({ from: 'offsetparent' }) //offsetParent !- .calc.top
  //offset => offset() .calc.top()
  //wrap => create element, insertBefore, and then put contents inside
  //not => .omit
  //first => .select[0]
  //filter => .select.filter
  //slideUp => .animate({ height: '0px' })
  //slideDown => .animate({ height: 'auto' })
  //fadeTo => .animate({ opacity: 0 })
  //.is(:visible) => .isVisible
  //.empty => .content.clear()
  //.html('html string') => .content.replace('html string')
  //.outerWidth => .calc.widthToBorder
  //.outerHeight => .calc.heightToBorder
};
XDom.Selector = Selector;

XDom.select = function(selector, within){
  return selectWithin(selector, within);
};

XDom.selectOne = function(selector, within){
  //mimics selectWithin
  if(!within){
    return selector ? document.querySelector(selector) : null; //returns one element
  }
  var _parent = XDom.resolve(within);
  if(!selector) return (_parent && _parent.length) ? _parent[0] : null;
  for(var i=0;i<_parent.length;i++){
    var parent = _parent[i];
    if(parent && parent.querySelector){
      var found = parent.querySelector(selector);
      if(found) return found; //returns one element
    }
  }
  return null;
};

XDom.selector = function(selector, options){
  return new Selector(selector, options);
};

XDom.resolve = function(target){
  if(!target) return [];
  if(_.isArray(target)) return target;
  if(_.isString(target)) return XDom.select(target);
  // sniffing the select function does not work because target may be a dom element, and elements such as `input` may have select methods
  if(target instanceof Selector) return target.select();
  return [target];
};

XDom.class = {
  add: function(target, className){
    if(!className) throw new Error('Invalid class');
    var _el = XDom.resolve(target);
    _.each(_el, function(el){
      if(el && el.classList && el.classList.add) el.classList.add(className);
    });
  },
  remove: function(target, className){
    if(!className) throw new Error('Invalid class');
    var _el = XDom.resolve(target);
    _.each(_el, function(el){
      if(el && el.classList && el.classList.remove) el.classList.remove(className);
    });
  },
  contains: function(target, className){
    if(!className) throw new Error('Invalid class');
    var _el = XDom.resolve(target);
    if(_el.length == 0) return false;
    for(var i=0;i<_el.length;i++){
      var el = _el[i];
      if(!el || !el.classList || !el.classList.contains || !el.classList.contains(className)) return false;
    }
    return true;
  },
};

XDom.render = function(html){
  var container = document.createElement('template');
  container.innerHTML = html;
  // childNodes is a live NodeList, if we return it direclty, it will likely have surprising results as nodes are moved elsewhere.
  return Array.prototype.slice.call(container.content.childNodes);
};

XDom.renderOne = function(html){
  var _el = XDom.render((html||'').trim());
  for(var i=0;i<_el.length;i++){
    if(_el[i].nodeType == Node.ELEMENT_NODE) return _el[i];
  }
  return document.createElement('div');
};

XDom.content = {
  append: function(target, val){
    _.each(XDom.resolve(target), function(el){
      if(el && el.append) el.append.apply(el, XDom.render(val));
    });
  },
  prepend: function(target, val){
    _.each(XDom.resolve(target), function(el){
      if(el && el.prepend) el.prepend.apply(el, XDom.render(val));
    });
  },
  replace: function(target, val){
    _.each(XDom.resolve(target), function(el){
      if(el && el.replaceChildren) el.replaceChildren.apply(el, XDom.render(val));
    });
  },
  clear: function(target){
    _.each(XDom.resolve(target), function(el){
      if(el && el.replaceChildren) el.replaceChildren();
    });
  },
};

XDom.insertBefore = function(target, newNode, referenceNode){
  var _el = XDom.resolve(target);
  if(!_el.length) return;
  // a node can only have one parent, so there is no point in inserting into any other targets that would just have it immediately removed.
  var targetNode = _el[_el.length-1];
  // since XDom.render results in an array we anticpate that it will be common argument to this function.
  if (newNode.length) {
    // we also copy the list in case a live NodeList is passed, as having the list change during iteration will not have the expected result
    Array.prototype.slice.call(newNode,0).forEach(function(node){
      targetNode.insertBefore(node, referenceNode || null);
    });
  } else {
    targetNode.insertBefore(newNode, referenceNode || null);
  }
};

XDom.remove = function(target){
  _.each(XDom.resolve(target), function(el){
    el.remove();
  });
};

XDom.getAttribute = function(target, prop){
  var _el = XDom.resolve(target);
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(el && el.getAttribute) return el.getAttribute(prop);
  }
  return undefined;
};

XDom.setAttribute = function(target, prop, val){
  _.each(XDom.resolve(target), function(el){
    if(el && el.setAttribute && el.removeAttribute){
      if(typeof val == 'undefined') el.removeAttribute(prop);
      else el.setAttribute(prop, val);
    }
  });
};

XDom.on = function(target, eventType, handler, eventOptions){
  var _eventTypes = eventType.split(' ');
  _.each(XDom.resolve(target), function(el){
    if(el && el.addEventListener){
      _.each(_eventTypes, function(et) {
        el.addEventListener(et, handler, eventOptions);
      });
    }
  });
};

XDom.off = function(target, eventType, handler, eventOptions){
  var _eventTypes = eventType.split(' ');
  _.each(XDom.resolve(target), function(el){
    if(el && el.removeEventListener){
      _.each(_eventTypes, function(et) {
        el.removeEventListener(et, handler, eventOptions);
      });
    }
  });
};

XDom.emit = function(target, event){
  if (typeof(event) == 'string') {
    event = new Event(event);
  }
  _.each(XDom.resolve(target), function(el){
    if (el && el.dispatchEvent) {
      el.dispatchEvent(event);
    }
  });
};

XDom.getValue = function(target){
  var _el = XDom.resolve(target);
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(el && (typeof el.value != 'undefined')) return el.value;
  }
  return undefined;
};

XDom.setValue = function(target, val){
  _.each(XDom.resolve(target), function(el){
    if(el && (typeof el.value != 'undefined')){
      el.value = (val||'').toString();
    }
  });
};

XDom.getData = function(target, prop){
  var _el = XDom.resolve(target);
  if(!_el.length) return undefined;
  return _el[0].dataset[prop];
};

XDom.setData = function(target, prop, val){
  _.each(XDom.resolve(target), function(el){
    if(el && el.dataset){
      if(typeof val == 'undefined') delete el.dataset[prop];
      else el.dataset[prop] = val;
    }
  });
};

XDom.focus = function(target){
  var _el = XDom.resolve(target);
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(el && el.focus) el.focus();
  }
};

XDom.blur = function(target){
  var _el = XDom.resolve(target);
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(el && el.blur) el.blur();
  }
};

XDom.isVisible = function(el){
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
};

function nodeMap(target, f){
  var _el = XDom.resolve(target);
  return _.uniq(_.compact(_.flatMap(_el, f)));
}

function propertyMap(target, property){
  return nodeMap(target, function(el) {return el && el[property];});
}

XDom.parent = function(target, parentSelector){
  return nodeMap(target, parentSelector ?
    function(el){ return el && el.closest(parentSelector); } :
    function(el){ return el && el.parentNode; }
  );
};

XDom.nextSibling = function(target){
  return propertyMap(target, 'nextSibling');
};

XDom.previousSibling = function(target){
  return propertyMap(target, 'previousSibling');
};

XDom.first = function(target){
  var _el = XDom.resolve(target);
  if (_el.length) {
    return _el[0];
  }
};

XDom.last = function(target){
  var _el = XDom.resolve(target);
  if (_el.length) {
    return _el[_el.length-1];
  }
};

XDom.getChildren = function(target){
  var _el = XDom.resolve(target);
  var rslt = [];
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    var startIdx = rslt.length;
    if(el && el.children && el.children.length){
      for(var j=0;j< el.children.length;j++){
        var child = el.children[j];
        var duplicate = false;
        for(var k=0;k<startIdx;k++){
          if(child === rslt[k]){ duplicate = true; break; }
        }
        if(!duplicate) rslt.push(el.children[j]);
      }
    }
  }
  return rslt;
};

XDom.filter = function(target, f){
  var _el = XDom.resolve(target);
  return _.filter(_el, f);
};

XDom.omit = function(target, f){
  var _el = XDom.resolve(target);
  return _.reject(_el, f);
};

XDom.getStyle = function(target, prop){
  var _el = XDom.resolve(target);
  if(!_el.length) return undefined;
  return _el[0].style[prop];
};

XDom.setStyle = function(target, prop, val){
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.style){
      el.style[prop] = val;
    }
  });
};

function styleFunc(prop, valTransform){
  return function(target, val){
    var _el = XDom.resolve(target);
    if(!_el.length) return undefined;
    if(typeof val == 'undefined') return _el[0].style[prop];
    _.each(_el, function(el){
      if(el && el.style){
        var elVal = val;
        if(valTransform) elVal = valTransform(elVal, el);
        if(elVal===null) elVal = '';
        el.style[prop] = elVal;
      }
    });
  };
}

XDom.style = {
  calc: function(target){
    var _el = XDom.resolve(target);
    if(!_el.length || !window.getComputedStyle) return undefined;
    for(var i=0;i<_el.length; i++){
      var rslt = window.getComputedStyle(_el[i]);
      return rslt;
    }
    return undefined;
  },
  display: styleFunc('display', function(val, el){
    if(val === false) return 'none';
    if(val === true){
      if(el.style.display){
        if(el.style.display=='none'){
          el.style.display = '';
        }
        else {
          return el.style.display;
        }
      }
      var elStyles = window.getComputedStyle && window.getComputedStyle(el);
      if(elStyles && elStyles.display == 'none') return 'revert';
      return '';
    }
    return val;
  }),
  width: styleFunc('width', function(val){
    if(_.isNumber(val)) return val.toString()+'px';
    return val;
  }),
  height: styleFunc('height', function(val){
    if(_.isNumber(val)) return val.toString()+'px';
    return val;
  }),
};

function execOnFirstElWithProp(prop, f){
  return function(target, arg1) {
    var _el = XDom.resolve(target);
    if(!_el.length) return undefined;
    for(var i=0;i<_el.length; i++){
      if(_el[i] && (prop in _el[i])) return f(_el[0], arg1);
    }
    return undefined;
  };
}

XDom.innerHTML = execOnFirstElWithProp('innerHTML', function(el){ return el.innerHTML; });
XDom.outerHTML = execOnFirstElWithProp('outerHTML', function(el){ return el.outerHTML; });

XDom.calc = {
  widthToPadding: execOnFirstElWithProp('clientWidth', function(el){
    return el.clientWidth;
  }),
  widthToBorder: execOnFirstElWithProp('offsetWidth', function(el){
    return el.offsetWidth;
  }),
  widthToMargin: execOnFirstElWithProp('offsetWidth', function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.offsetWidth + (parseFloat(elStyles.marginLeft)||0) + (parseFloat(elStyles.marginRight)||0);
  }),
  widthToContent: execOnFirstElWithProp('clientWidth', function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.clientWidth - (parseFloat(elStyles.paddingLeft)||0) - (parseFloat(elStyles.paddingRight)||0);
  }),

  heightToPadding: execOnFirstElWithProp('clientHeight', function(el){
    return el.clientHeight;
  }),
  heightToBorder: execOnFirstElWithProp('offsetHeight', function(el){
    return el.offsetHeight;
  }),
  heightToMargin: execOnFirstElWithProp('offsetHeight', function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.offsetHeight + (parseFloat(elStyles.marginTop)||0) + (parseFloat(elStyles.marginBottom)||0);
  }),
  heightToContent: execOnFirstElWithProp('clientHeight', function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.clientHeight - (parseFloat(elStyles.paddingTop)||0) - (parseFloat(elStyles.paddingBottom)||0);
  }),

  top: execOnFirstElWithProp('getBoundingClientRect', function(el){
    return el.getBoundingClientRect().top;
  }),
  topFromDocument: execOnFirstElWithProp('getBoundingClientRect', function(el){
    return el.getBoundingClientRect().top + window.scrollY;
  }),
  topFromParent: execOnFirstElWithProp('getBoundingClientRect', function(el){
    var parent = el.parentNode;
    if (parent && parent.getBoundingClientRect) {
      return el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    } else {
      return el.getBoundingClientRect().top + window.scrollY;
    }
  }),
  topFromOffsetParent: execOnFirstElWithProp('getBoundingClientRect', function(el){
    var parent = el.offsetParent;
    if (parent && parent.getBoundingClientRect) {
      return el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    } else {
      return el.getBoundingClientRect().top + window.scrollY;
    }
  }),
  topFrom: execOnFirstElWithProp('getBoundingClientRect', function(el, otherEl){
    if (otherEl && otherEl.getBoundingClientRect) {
      return el.getBoundingClientRect().top - otherEl.getBoundingClientRect().top;
    } else {
      console.warn('invalid argument to XDom.calc.topFrom'); // eslint-disable-line no-console
      return undefined;
    }
  }),

  left: execOnFirstElWithProp('getBoundingClientRect', function(el){
    return el.getBoundingClientRect().left;
  }),
  leftFromDocument: execOnFirstElWithProp('getBoundingClientRect', function(el){
    return el.getBoundingClientRect().left + window.scrollX;
  }),
  leftFromParent: execOnFirstElWithProp('getBoundingClientRect', function(el){
    var parent = el.parentNode;
    if (parent && parent.getBoundingClientRect) {
      return el.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    } else {
      return el.getBoundingClientRect().left + window.scrollX;
    }
  }),
  leftFromOffsetParent: execOnFirstElWithProp('getBoundingClientRect', function(el){
    var parent = el.offsetParent;
    if (parent && parent.getBoundingClientRect) {
      return el.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    } else {
      return el.getBoundingClientRect().left + window.scrollX;
    }
  }),
  leftFrom: execOnFirstElWithProp('getBoundingClientRect', function(el, otherEl){
    if (otherEl && otherEl.getBoundingClientRect) {
      return el.getBoundingClientRect().left - otherEl.getBoundingClientRect().left;
    } else {
      console.warn('invalid argument to XDom.calc.leftFrom'); // eslint-disable-line no-console
      return undefined;
    }
  }),
};
XDom.calc.width = XDom.calc.widthToContent;
XDom.calc.height = XDom.calc.heightToContent;
/**
 * parseStyleUnit parses a style string and returns an obj with a value and a unit. Returns null if
 * unable to properly extract a value or unit from style string.
 * @param {String} value - A style string like '100px' or 'rgba(12, 53, 67, 0.5)' or '1' (opacity)
 * @returns {Object}
 */
function parseStyleUnit(value) {
  if (value == null) return null;
  var vals = [];
  var tempArray = [];
  var unit = null;
  value = value.replaceAll(' ', '');
  if(value.indexOf('rgb')===0){     // rbg || rgba
    tempArray = value.replace(')', '').split('(');
    vals = tempArray[1].split(',');
    if(tempArray[0] === 'rgb') vals.push('1');  // normalize to rgba
    unit = 'rgba';
  } else if(value.indexOf('#')===0){
    value = value.replace('#', '');
    vals = value.match(/.{1,2}/g);
    if(value.length === 6) vals.push('FF');     // normalize to rgba
    vals = vals.map(function(hex){return '0x' + hex;});
    vals[3] = Number(vals[3])/255;  // alpha ratio
    unit = 'rgba';
  }
  else{
    tempArray = value.match(/(^-?\d+(?:\.\d+)?)([a-zA-Z%]+)?$/);
    if(tempArray === null){         // if there is no match, make a last attempt for a result
      var testval = Number(value);
      if(isNaN(testval)) return null;
      vals = [testval];
      unit = null;
    }
    else{
      vals = [tempArray[1]];
      unit = tempArray[2];
    }
  }
  vals = vals.map(Number);
  return {val: vals, unit: unit};
}

/**
 * vectorOpp returns a progress vector of style values
 * @param {Array} from        - original starting style array of element(s)
 * @param {Array} to          - desired final style array of elements(s)
 * @param {Number} derivative  - rate of change
 * @returns {Array}
 */
function vectorOpp(from, to, derivative){
  var progressVector = [];
  progressVector = to.map(function(num, idx) { return num - from[idx]; });              // to - from
  progressVector = progressVector.map(function(num) { return num * derivative; });      // (to - from) * (curtime-starttime)/duration
  progressVector = progressVector.map(function(num, idx) { return num + from[idx]; });  // ((to - from) * (curtime-starttime)/duration) + from
  return progressVector;
}

function step(curTime, el, elProps, startTime, endTime, elAnimateIdx, onComplete) {
  var duration = endTime - startTime;
  var inProgress = ((curTime < endTime) && (duration > 0));
  var xdom_animatestopidx = Number(el.dataset.xdom_animatestopidx);
  if(elAnimateIdx <= xdom_animatestopidx) return onComplete(true);
  else {
    _.each(elProps, function(value, key) {
      var from = value.from;
      var to = value.to;
      var unit = value.unit || '';
      var progressVec = [];
      if(inProgress) progressVec = vectorOpp(from, to, ((curTime-startTime)/duration));
      else progressVec = to;
      if(unit == 'rgba') el.style[key] = 'rgba(' + progressVec[0] + ', ' + progressVec[1] + ', ' + progressVec[2] + ', ' + progressVec[3] + ')';
      else el.style[key] = progressVec[0] + unit;
    });
    if(inProgress){
      requestAnimationFrame(function(curTime){
        step(curTime, el, elProps, startTime, endTime, elAnimateIdx, onComplete);
      });
    }
    else {
      onComplete(false); //if an element reaches this point then it would have "completed" naturally
    }
  }
}

XDom.stop = function(target) {
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    el.dataset.xdom_animatestopidx = parseInt(el.dataset.xdom_animateidx);
  });
};

XDom.animate = function(target, props, duration, callback) {
  if(!callback) callback = function(){};
  if(!props) props = {};
  if(!duration) duration = 0;
  var _el = XDom.resolve(target);
  if(_el.length === 0) return;
  var completeCnt = 0;
  var hasSuccess = false;
  _.each( _el, function(el){
    var elAnimateIdx = parseInt(el.dataset.xdom_animateidx || 0) + 1;
    el.dataset.xdom_animateidx = elAnimateIdx;
    var elProps = {};
    var containsProps = false;
    for(var key in props){
      var rawEnd = props[key];
      if((rawEnd === null) || (typeof rawEnd == 'undefined') || (rawEnd === '')) continue;
      rawEnd = rawEnd.toString();
      var rawStart = window.getComputedStyle(el)[key];
      var start = parseStyleUnit(rawStart);
      var end = parseStyleUnit(rawEnd);
      if((!start || !end) || (start.unit != end.unit)) continue; // leave prop out of elProps at unit mismatch (or missing values)
      elProps[key] = {from: start.val, to: end.val, unit: end.unit};
      containsProps = true;
    }
    if(duration <= 0 && containsProps){
      _.each(elProps, function(valueObj, key) {
        var to = valueObj.to;
        var unit = valueObj.unit || '';
        if(unit === 'rgba') el.style[key] = 'rgba(' + to[0] + ', ' + to[1] + ', ' + to[2] + ', ' + to[3] + ')';
        else el.style[key] = to[0] + unit;
      });
    }
    else if(containsProps) {
      var startTime = document.timeline.currentTime;
      var endTime = startTime + duration;
      requestAnimationFrame(function(curTime){
        step(curTime, el, elProps, startTime, endTime, elAnimateIdx, function(aborted){
          completeCnt++;
          if(!aborted) hasSuccess = true;
          if(hasSuccess && (completeCnt === _el.length)) callback();
        });
      });
    }
  });
  if(duration <= 0) callback();
};