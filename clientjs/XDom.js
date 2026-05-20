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
  _this.data = new Proxy({}, {
    get: function(target, prop, receiver) { return XDom.getData(_this, prop); },
    set: function(target, prop, value) { return XDom.setData(_this, prop, value); },
  });
  _this.style = new Proxy({}, {
    get: function(target, prop, receiver) {
      if(prop == 'display') return XDom.style.display(_this);
      if(prop == 'width') return XDom.style.width(_this);
      if(prop == 'height') return XDom.style.height(_this);
      return XDom.getStyle(_this, prop);
    },
    set: function(target, prop, value) {
      if(prop == 'display') return XDom.style.display(_this, value);
      if(prop == 'width') return XDom.style.width(_this, value);
      if(prop == 'height') return XDom.style.height(_this, value);
      return XDom.setStyle(_this, prop, value);
    },
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
  //offsetParent => .calc.top({ from: 'offsetparent' })
  //offset => offset() .calc.top()
  //wrap => create element, insertBefore, and then put contents inside
  //not => .omit
  //first => .select[0]
  //filter => .select.filter
  //slideUp => .animate({ height: '0px' })
  //slideDown => .animate({ height: 'auto' })
  //fadeTo => .animate({ opacity: 0 })
  //.is(:visible) => .isVisible
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

function renderHtml(val){
  var container = document.createElement('div');
  container.innerHTML = val;
  return container.childNodes;
}

XDom.content = {
  append: function(target, val){
    var html = renderHtml(val);
    _.each(XDom.resolve(target), function(el){
      if(el && el.append) el.append.apply(el, html);
    });
  },
  prepend: function(target, val){
    var html = renderHtml(val);
    _.each(XDom.resolve(target), function(el){
      if(el && el.prepend) el.prepend.apply(el, html);
    });
  },
  replace: function(target, val){
    var html = renderHtml(val);
    _.each(XDom.resolve(target), function(el){
      if(el && el.replaceChildren) el.replaceChildren.apply(el, html);
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
  _el[_el.length-1].insertBefore(newNode, referenceNode || null);
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
}

XDom.blur = function(target){
  var _el = XDom.resolve(target);
  for(var i=0;i<_el.length;i++){
    var el = _el[i];
    if(el && el.blur) el.blur();
  }
}

XDom.isVisible = function(el){
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function nodeMap(target, f){
  var _el = XDom.resolve(target);
  return _.uniq(_.compact(_.flatMap(_el, f)));
}

function propertyMap(target, property){
  return nodeMap(target, function(el) {return el && el[property]});
}

XDom.parent = function(target, parentSelector){
  return nodeMap(target, parentSelector ?
    function(el){ return el && el.closest(parentSelector); } : 
    function(el){ return el && el.parentNode; }
  );
}

XDom.nextSibling = function(target){
  return propertyMap(target, 'nextSibling');
}

XDom.previousSibling = function(target){
  return propertyMap(target, 'previousSibling');
}

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

function withFirstTarget(f){
  return function(target, arg1) {
    var _el = XDom.resolve(target);
    if(_el.length) return f(_el[0], arg1);
  }
}

XDom.calc = {
  widthToPadding: withFirstTarget(function(el){
    return el.clientWidth;
  }),
  widthToBorder: withFirstTarget(function(el){
    return el.offsetWidth;
  }),
  widthToMargin: withFirstTarget(function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.offsetWidth + (parseFloat(elStyles.marginLeft)||0) + (parseFloat(elStyles.marginRight)||0);
  }),
  widthToContent: withFirstTarget(function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.clientWidth - (parseFloat(elStyles.paddingLeft)||0) - (parseFloat(elStyles.paddingRight)||0);
  }),

  heightToPadding: withFirstTarget(function(el){
    return el.clientHeight;
  }),
  heightToBorder: withFirstTarget(function(el){
    return el.offsetHeight;
  }),
  heightToMargin: withFirstTarget(function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.offsetHeight + (parseFloat(elStyles.marginTop)||0) + (parseFloat(elStyles.marginBottom)||0);
  }),
  heightToContent: withFirstTarget(function(el){
    var elStyles = window.getComputedStyle && window.getComputedStyle(el);
    return el.clientHeight - (parseFloat(elStyles.paddingTop)||0) - (parseFloat(elStyles.paddingBottom)||0);
  }),

  top: withFirstTarget(function(el){
    return el.getBoundingClientRect().top;
  }),
  topFromDocument: withFirstTarget(function(el){
    return el.getBoundingClientRect().top + window.scrollY;
  }),
  topFromParent: withFirstTarget(function(el){
    var parent = el.parentNode;
    if (parent) {
      return el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    } else {
      return el.getBoundingClientRect().top + window.scrollY;
    }
  }),
  topFromOffsetParent: withFirstTarget(function(el){
    var parent = el.offsetParent;
    if (parent) {
      return el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    } else {
      return el.getBoundingClientRect().top + window.scrollY;
    }
  }),
  topFrom: withFirstTarget(function(el, otherEl){
    if (otherEl && otherEl.getBoundingClientRect) {
      return el.getBoundingClientRect().top - otherEl.getBoundingClientRect().top;
    } else {
      console.warn('invalid argument to XDom.calc.topFrom');
      return 0;
    }
  }),

  left: withFirstTarget(function(el){
    return el.getBoundingClientRect().left;
  }),
  leftFromDocument: withFirstTarget(function(el){
    return el.getBoundingClientRect().left + window.scrollY;
  }),
  leftFromParent: withFirstTarget(function(el){
    var parent = el.parentNode;
    if (parent) {
      return el.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    } else {
      return el.getBoundingClientRect().left + window.scrollX;
    }
  }),
  leftFromOffsetParent: withFirstTarget(function(el){
    var parent = el.offsetParent;
    if (parent) {
      return el.getBoundingClientRect().left - parent.getBoundingClientRect().left;
    } else {
      return el.getBoundingClientRect().left + window.scrollX;
    }
  }),
  leftFrom: withFirstTarget(function(el, otherEl){
    if (otherEl && otherEl.getBoundingClientRect) {
      return el.getBoundingClientRect().left - otherEl.getBoundingClientRect().left;
    } else {
      console.warn('invalid argument to XDom.calc.leftFrom');
      return 0;
    }
  }),
};
XDom.calc.width = XDom.calc.widthToContent;
XDom.calc.height = XDom.calc.heightToContent;

function parseStyleUnit(value){
  if(value == null) return null;
  var regexp = /(^-?\d+(?:\.\d+)?)([a-zA-Z%]+)?$/;
  var match = String(value).match(regexp);
  if(!match) return {};
  //TODO if Number(match[1]) is NaN, then...
  return {val: Number(match[1]), unit: match[2] || ''};
}

var animationMap = new Map();
var animationID = 0; //there has to be a better way??
var animationStopIndex;

XDom.animate = function(target, props, duration, callback){
  if(!props) props = {};
  if(!duration) duration = 0;
  var _el = XDom.resolve(target);
  var aniobj = {};
  var myAnimationID = animationID++;
  for(var key in props){
    var endStr = props[key];
    if((endStr === null) || (typeof endStr == 'undefined') || (endStr === '')) continue;
    endStr = endStr.toString();
    aniobj[key] = [];
    for(var el of _el){
      var startRaw = window.getComputedStyle(el)[key];
      var start = parseStyleUnit(startRaw);
      var end = parseStyleUnit(endStr);
      // TODO: Consider unit mismatch between start and end - error out
      //    console.warning(...)
      //    Push null onto array, and set to end size at end
      animationMap.set(el, myAnimationID);
      if(start.unit != end.unit){
        console.warning("Unit mismatch between start and end for animate.");
        aniobj[key].push({from: null, to:end.val, unit: end.unit});
      } else {
      // TODO: Add support for "start" and "end"
      //    animate(tgt, { width: '200px' });
      //    animate(tgt, { width: 200 }); => animate(tgt, { width: '200' });
      //    animate(tgt, { width: { from: '100px', to: '200px' } });
        aniobj[key].push({from: start.val, to: end.val, unit: end.unit});
      }
    }
  }
  requestAnimationFrame(step);

  // update animationIndex 
  // TODO: remove elements from animationIndex as the animation is complete
  for(var el of _el){
    animationMap.delete(el);
  }

  var startTime = document.timeline.currentTime;
  var endTime = startTime + duration;
  function step(curTime){
    var inProgress = (curTime < endTime);
    for (var i = 0; i < _el.length; i++){
      var el = _el[i];
      var id = animationMap.get(el);
      if(id === undefined || id < animationStopIndex){ // skip elements with invalid ID
        continue;
      } else {
        for(var key in aniobj){
          var { from, to, unit } = aniobj[key][i];
          if(inProgress && (from != null)){
            el.style[key] = (from + (((to - from) * (curTime - startTime)) / duration)).toString() + unit;
          }
          else {
            el.style[key] = to.toString() + unit;
          }
        }
      }
    }
    if(inProgress){
      requestAnimationFrame(step);
    } else {
      if(typeof callback === 'function') {
        callback();
      }
    }
  }
};

XDom.stop = function(){
  // update animationStopIndex
  animationStopIndex = animationID;
  //TODO: create a function to stop animation
  /*
  * IDEAS:
  * stop all ID < current
  * set attri to "stop"
  */
  //this stops all animations, no matter where it is called?
};