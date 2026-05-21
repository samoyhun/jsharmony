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

  function XLoader(_containerClass){
    var _this = this;
    this.IsLoading = false;
    this.LoadQueue = new Array();
    this.MouseStack = 0;
    this.onSquashedClick = [];
    this.onMouseDown = [];
    this.onMouseUp = [];
    this.containerClass = _containerClass || '.xloadingblock.jsHarmonyElement_'+jsh._instanceClass;

    //Check if required elements have been rendered to the page
    if(!jsh.$XDroot(_this.containerClass).length){
      console.error(_this.containerClass+' not found on page during XLoader initialization'); // eslint-disable-line no-console
    }

    //Keep counter to match mousedown / mouseup events, to detect squashed clicks (clicks blocked by the transparent loading background)
    jsh.$XDroot(_this.containerClass).on('mousedown', function(e){
      _this.MouseStack++;
      jsh.XExt.trigger(_this.onMouseDown, e);
    });
    jsh.$XDroot(_this.containerClass).on('mouseup', function(e){
      jsh.XExt.trigger(_this.onMouseUp, e);
    });
    jsh.$XDroot(_this.containerClass).on('click mouseup', function(e){
      if(_this.MouseStack<=0){ jsh.XExt.trigger(_this.onSquashedClick, e); }
      _this.MouseStack--;
    });
  }

  XLoader.prototype.StartLoading = function(obj){
    var _this = this;
    if(!_.includes(this.LoadQueue,obj)) this.LoadQueue.push(obj);
    if(this.IsLoading) return;
    jsh.XDroot.style.cursor = 'wait';
    this.IsLoading = true;
    this.MouseStack = 0;
    if(jsh.xDialog.length) jsh.$XDroot('input:not([type=button]),select,textarea').select()[0].blur();
    else jsh.$XDroot('input,select,textarea').select()[0].blur();
    jsh.$XDroot(_this.containerClass+' .xloadingbox').animate({opacity: 0}, 0);
    jsh.$XDroot(_this.containerClass).style.display = true;
    jsh.$XDroot(_this.containerClass+' .xloadingbox').animate({opacity: 1}, 2000);
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
    jsh.$XDroot(_this.containerClass+' .xloadingbox').stop();
    var curfade = GetOpacity(jsh.$XDroot(_this.containerClass+' .xloadingbox').select()[0]);
    jsh.$XDroot(_this.containerClass+' .xloadingbox').animate({opacity:500 * curfade}, 0, function () { if (!this.IsLoading) { jsh.$XDroot(_this.containerClass).style.disply = false; } });
    jsh.XDroot.style.cursor = '';
  };

  function GetOpacity(elem) {
    var ori = jsh.XDom(elem).style.opacity;
    var ori2 = jsh.XDom(elem).style.filter;
    if (ori2) {
      ori2 = parseInt( ori2.content.replace(')','').replace('alpha(opacity=','') ) / 100;
      if (!isNaN(ori2) && ori2 != '') {
        ori = ori2;
      }
    }
    return ori;
  }

  return XLoader;
};
