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

var Selector = function(target, options){
  options = _.extend({ base: null }, options);
  target = target || '';
  var _this = this;

  if(!target) throw new Error('Target is required');
  if(_.isString(target)){
    _this.target = target;
    _this.base = options.base;
  }
  else {
    _this.target = '';
    _this.base = target;
  }

  _this.select = function(childSelector){
    return selectWithin((_this.target + ' ' + (childSelector||'')).trim(), _this.base);
  };

  _this.selector = function(childSelector){
    if(!childSelector) return _this;
    if(!_this.target) return new Selector(childSelector, { base: _this.base });
    var _selectorPart = _this.target.split(',');
    var _childSelectorPart = childSelector.split(',');
    return new Selector(_.map(_selectorPart, function(selectorPart){
      return _.map(_childSelectorPart, function(childSelectorPart){
        return (selectorPart.trim() + ' ' + childSelectorPart.trim()).trim();
      }).join(',');
    }).join(','), { base: _this.base });
  };

  _this.addClass = XDom.addClass.bind(XDom, this);
  _this.removeClass = XDom.removeClass.bind(XDom, this);
  _this.containsClass = XDom.containsClass.bind(XDom, this);
  _this.setStyle = XDom.setStyle.bind(XDom, this);
  _this.appendHtml = XDom.appendHtml.bind(XDom, this);
  _this.prependHtml = XDom.prependHtml.bind(XDom, this);
  _this.setHtml = XDom.setHtml.bind(XDom, this);
  _this.clear = XDom.clear.bind(XDom, this);
  _this.setAttribute = XDom.setAttribute.bind(XDom, this);
  _this.getAttribute = XDom.getAttribute.bind(XDom, this);
  _this.on = XDom.on.bind(XDom, this);
  _this.off = XDom.off.bind(XDom, this);
  _this.setValue = XDom.setValue.bind(XDom, this);
  _this.getValue = XDom.getValue.bind(XDom, this);
  _this.getData = XDom.getData.bind(XDom, this);
  _this.setData = XDom.setData.bind(XDom, this);
  _this.style = {
    display: XDom.style.display.bind(XDom, this),
    width: XDom.style.width.bind(XDom, this),
    height: XDom.style.height.bind(XDom, this),
  };
  _this.calc = {
    width: XDom.calc.width.bind(XDom, this),
    height: XDom.calc.height.bind(XDom, this),
  };
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
  if(_.isFunction(target.select)) return target.select();
  return [target];
};

XDom.addClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.classList && el.classList.add) el.classList.add(className);
  });
};

XDom.removeClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.classList && el.classList.remove) el.classList.remove(className);
  });
};

XDom.containsClass = function(target, className){
  if(!className) throw new Error('Invalid class');
  var _el = XDom.resolve(target);
  if(_el.length == 0) return false;
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(!el || !el.classList || !el.classList.contains || !el.classList.contains(className)) return false;
  }
  return true;
};

XDom.setStyle = function(target, prop, val){
  var _el = XDom.resolve(target);
  _.each(_el, function(el){
    if(el && el.style){
      el.style[prop] = val;
    }
  });
};

function renderHtml(val){
  var container = document.createElement('div');
  container.innerHTML = val;
  return container.childNodes;
}

XDom.appendHtml = function(target, val){
  var html = renderHtml(val);
  _.each(XDom.resolve(target), function(el){
    if(el && el.append) el.append.apply(el, html);
  });
};

XDom.prependHtml = function(target, val){
  var html = renderHtml(val);
  _.each(XDom.resolve(target), function(el){
    if(el && el.prepend) el.prepend.apply(el, html);
  });
};

XDom.setHtml = function(target, val){
  var html = renderHtml(val);
  _.each(XDom.resolve(target), function(el){
    if(el && el.replaceChildren) el.replaceChildren.apply(el, html);
  });
};

XDom.clear = function(target){
  _.each(XDom.resolve(target), function(el){
    if(el && el.replaceChildren) el.replaceChildren();
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
  _.each(XDom.resolve(target), function(el){
    if(el && el.addEventListener){
      el.addEventListener(eventType, handler, eventOptions);
    }
  });
};

XDom.off = function(target, eventType, handler, eventOptions){
  _.each(XDom.resolve(target), function(el){
    if(el && el.removeEventListener){
      el.removeEventListener(eventType, handler, eventOptions);
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

function styleFunc(prop, valTransform){
  return function(target, val){
    var _el = XDom.resolve(target);
    if(!_el.length) return undefined;
    if(typeof val == 'undefined') return _el[0].style[prop];
    if(valTransform) val = valTransform(val);
    if(val===null) val = '';
    _.each(_el, function(el){ if(el && el.style) el.style[prop] = val; });
  };
}

XDom.style = {
  display: styleFunc('display', function(val){
    if(val === false) return 'none';
    if(val === true) return '';
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

XDom.calc = {
  width: function(target){
    var _el = XDom.resolve(target);
    if(!_el.length) return undefined;
    return _el[0].offsetWidth;
  },
  height: function(target){
    var _el = XDom.resolve(target);
    if(!_el.length) return undefined;
    return _el[0].offsetHeight;
  },
};
