/*
Copyright 2017 apHarmony

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

var $ = require('./jquery-1.11.2');
$.fn.$find = function(){ return $.fn.find.apply(this, arguments); };
var _ = require('lodash');

exports = module.exports = function(jsh){
  var XDom = jsh.XDom;

  function XLoader(_containerClass){
    var _this = this;
    this.IsLoading = false;
    this.LoadQueue = new Array();
    this.MouseStack = 0;
    this.onSquashedClick = [];
    this.onMouseDown = [];
    this.onMouseUp = [];
    this.containerClass = _containerClass || '.xloadingblock.jsHarmonyElement_'+jsh._instanceClass;

    //DOM Elements
    this.xdContainerClass = XDom(jsh.xdroot, _this.containerClass);
    this.xdLoadingBox = XDom(this.xdContainerClass, ' .xloadingbox');

    //Check if required elements have been rendered to the page
    if(!this.xdContainerClass.select().length){
      console.error(_this.containerClass+' not found on page during XLoader initialization'); // eslint-disable-line no-console
    }

    //Keep counter to match mousedown / mouseup events, to detect squashed clicks (clicks blocked by the transparent loading background)
    XDom.on(this.xdContainerClass, 'mousedown', function(e){
      _this.MouseStack++;
      jsh.XExt.trigger(_this.onMouseDown, e);
    });
    XDom.on(this.xdContainerClass, 'mouseup', function(e){
      jsh.XExt.trigger(_this.onMouseUp, e);
    });
    XDom.on(this.xdContainerClass, 'click mouseup', function(e){
      if(_this.MouseStack<=0){ jsh.XExt.trigger(_this.onSquashedClick, e); }
      _this.MouseStack--;
    });
  }

  XLoader.prototype.StartLoading = function(obj){
    if(!_.includes(this.LoadQueue,obj)) this.LoadQueue.push(obj);
    if(this.IsLoading) return;
    jsh.xdroot.style.cursor = 'wait';
    this.IsLoading = true;
    this.MouseStack = 0;
    if(jsh.xDialog.length) XDom.blur(jsh.xdroot.select('input:not([type=button]),select,textarea'));
    else XDom.blur(jsh.xdroot.select('input,select,textarea'));
    XDom.animate(this.xdLoadingBox, {opacity: 0}, 0);
    XDom.style.display(this.xdContainerClass, true);
    XDom.animate(this.xdLoadingBox, {opacity: 1}, 2000);
  };

  XLoader.prototype.StopLoading = function (obj){
    _.remove(this.LoadQueue, function (val) { return obj == val; });
    if(this.LoadQueue.length != 0) return;
    this.StopLoadingBase();
  };

  XLoader.prototype.ClearLoading = function () {
    this.LoadQueue = [];
    this.StopLoadingBase();
  };

  XLoader.prototype.StopLoadingBase = function () {
    var _this = this;
    this.IsLoading = false;
    XDom.stop(this.xdLoadingBox);
    var curfade = GetOpacity(this.xdLoadingBox.select()[0]);
    XDom.animate(this.xdLoadingBox, {opacity: 0}, 500 * curfade, function () { if (!this.IsLoading) { _this.xdContainerClass.style.display = false; } });
    jsh.xdroot.style.cursor = '';
  };

  function GetOpacity(elem) {
    var opacity = jsh.XDom.getStyle(elem, 'opacity');
    var filter = jsh.XDom.getStyle(elem, 'filter');
    var ori = (opacity) ? opacity : window.getComputedStyle(elem).opacity;
    var ori2 = (filter) ? filter : window.getComputedStyle(elem).filter;
    if (ori2) {
      ori2 = parseInt( ori2.replace(')','').replace('alpha(opacity=','') ) / 100;
      if (!isNaN(ori2) && ori2 != '') {
        ori = ori2;
      }
    }
    return ori;
  }

  return XLoader;
};
