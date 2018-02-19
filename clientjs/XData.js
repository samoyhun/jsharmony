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

exports = module.exports = {};

function XData(_q,_TemplateID,_PlaceholderID,_CustomScroll,_Paging,_ScrollControl){
	this._this = this;
	this.TemplateID = _TemplateID;
	this.PlaceholderID = _PlaceholderID;
	this.ColSpan = $(this.PlaceholderID).parent().find('thead th').length;
	this.q = _q;
	
	if(_CustomScroll === undefined) this.CustomScroll = ''; 
	else {
		if(lteIE7()){
			this.CustomScroll = '';
			_ScrollControl = _CustomScroll;
			$(_CustomScroll).css('overflow','auto');
		}
		else this.CustomScroll = _CustomScroll
	}
	
	if(_Paging === undefined) this.Paging = true;
	else this.Paging = _Paging;
	if(_ScrollControl === undefined) this.ScrollControl = window; 
	else this.ScrollControl = _ScrollControl;
	this.Sort = new Array();
	this.Search = '';
	this.SearchJSON = '';
	this.scrolledPastBottom = false;
	this.lastDocumentHeight = 0;
  this.scrollPrevious = 0;
  this.scrollFunc = null;
	this.EOF = true;
  this.NoResultsMessage = 'No results %%%FORSEARCHPHRASE%%%';
  this.RequireFilterMessage = 'Please select a filter';
	this.RowCount = 0;
	this.AutoLoadMore = true;
	if(this.Paging) this.EnableScrollUpdate();
	this.IsLoading = false;
	this.TemplateHTMLFunc = null;
	this.LastColumns = new Array(); //Used in Tool Search
	this.Formatters = new Array(); //Used in Tool Search
	this.LastData = null;
	this.Data = null;
  this.PreProcessResult = null;
  this.OnBeforeSelect = null;
  this.OnRowBind = null;
  this.OnMetaData = null; //(data)
  this.OnDBRowCount = null;
  this.OnResetDataSet = null; //()
  this.OnRender = null; //(ejssource,data)
  this.OnLoadMoreData = null; //()
  this.OnLoadComplete = null;
  this.OnLoadError = null;
  this.RequireFilter = false;
  this.State = {};
  this.Prop = {};
  this.GetMeta = true;
  this.GetDBRowCount = false;
  this.DBRowCount = -1;
  this._LOVs = {};
  this._defaults = {};
  this._bcrumbs = {};
  this._title = null;
}
//Passing 0,-1 for rowcount will return total rowcount
XData.prototype.Load = function(rowstart,rowcount,onComplete,getCSV,onFail){
	if(this.IsLoading){
		return;
	}
  this.IsLoading = true;
  if (typeof getCSV == 'undefined') getCSV = false;
	
	var rowstart = typeof rowstart !== 'undefined' ? rowstart : 0;
	var rowcount = typeof rowcount !== 'undefined' ? rowcount : 0;
	var _this = this;
	
	if(rowstart > 0){
		if(_this.EOF) return;
		$(_this.PlaceholderID).find('tr.xtbl_loadmore').remove();
		$(_this.PlaceholderID).append('<tr class="xtbl_loadmore"><td colspan="'+_this.ColSpan+'"><a href="#">Loading...</div></td></tr>');
	}
  var starttime = (new Date()).getTime();
  
  var reqdata = { rowstart: rowstart, rowcount: rowcount, sort: JSON.stringify(this.Sort), search: this.Search, searchjson: this.SearchJSON, d: JSON.stringify(this.Data) };
  if (this.GetMeta) reqdata.meta = 1;
  if (this.GetDBRowCount && (rowstart == 0)) {
    _this.DBRowCount = -1;
    reqdata.getcount = 1;
  }
  if (getCSV) {
    this.IsLoading = false;
    onComplete(global._BASEURL + '_csv/' + this.q + '/?'+$.param(reqdata));
    return;
  }
  if (this.OnBeforeSelect) this.OnBeforeSelect();
	global.xLoader.StartLoading(_this);
	$.ajax({
		type:"GET",
		url:global._BASEURL+'_d/'+this.q+'/',
    data: reqdata,
		dataType: 'json',
		success:function(data){
			loadtime = ((new Date()).getTime() - starttime);
			if((rowstart > 0) && (loadtime < 500)){
				window.setTimeout(function(){ _this.ProcessData(data,rowstart,onComplete,reqdata); },500-loadtime);
			}
			else { _this.ProcessData(data,rowstart,onComplete,reqdata); }
    },
    error: function (data) {
      global.xLoader.StopLoading(_this);
      _this.IsLoading = false;
      if (_this.OnLoadComplete) _this.OnLoadComplete();
      if (onComplete) onComplete();

      var jdata = data.responseJSON;
      if ((jdata instanceof Object) && ('_error' in jdata)) {
        if (DefaultErrorHandler(jdata._error.Number, jdata._error.Message)) { }
        else if (_this.OnLoadError && _this.OnLoadError(jdata._error)) { }
        else if ((jdata._error.Number == -9) || (jdata._error.Number == -5)) { XExt.Alert(jdata._error.Message); }
        else { XExt.Alert('Error #' + jdata._error.Number + ': ' + jdata._error.Message); }
        if (onFail) onFail(jdata._error);
        return;
      }
      if (onFail && onFail(data)) { }
      else if (_this.OnLoadError && _this.OnLoadError(jdata._error)) { }
      else if (('status' in data) && (data.status == '404')) { XExt.Alert('(404) The requested page was not found.'); }
      else if (_debug) XExt.Alert('An error has occurred: ' + data.responseText);
      else XExt.Alert('An error has occurred.  If the problem continues, please contact the system administrator for assistance.');
    }
	});
};
XData.prototype.ProcessData = function(data,rowstart,onComplete,reqdata){
  var _this = this;
	if(rowstart > 0){
		$(_this.PlaceholderID).find('tr.xtbl_loadmore').remove();
	}
  if ((data instanceof Object) && ('_error' in data)) {
    if (DefaultErrorHandler(data['_error'].Number, data['_error'].Message)) { }
    else if ((data._error.Number == -9) || (data._error.Number == -5)) { XExt.Alert(data._error.Message); }
    else { XExt.Alert('Error #' + data._error.Number + ': ' + data._error.Message); }
  }
  else {
    if (_this.GetMeta) {
      _this.GetMeta = false;
      if ('_defaults' in data) { _this._defaults = data['_defaults']; }
      if ('_bcrumbs' in data) { _this._bcrumbs = data['_bcrumbs']; }
      if ('_title' in data) { _this._title = data['_title']; }
      for (var tbl in data) {
        if (tbl.indexOf('_LOV_') == 0) {
          _this._LOVs[tbl.substring(5)] = data[tbl];
        }
      }
      if (_this.OnMetaData) _this.OnMetaData(data);
    }
    if (('_count_' + this.q) in data) {
      var dcount = data['_count_' + this.q];
      if ((dcount != null)) _this.DBRowCount = dcount['cnt'];
      _this.OnDBRowCount();
      //if ((dcount != null) && (dcount.length == 1)) onComplete(dcount[0]['cnt']);
      //else { XExt.Alert('Error retrieving total row count.'); }
      //onComplete = null;  //Clear onComplete event, already handled
    }
    if ((data[this.q].length == 0) && ((_this.NoResultsMessage) || (_this.RequireFilter && _this.RequireFilterMessage))) {
      _this.EOF = true;
      var noresultsmessage = _this.NoResultsMessage.replace(/%%%FORSEARCHPHRASE%%%/g, (($.trim(_this.Search) != '')?'for selected search phrase':''));
      if (_this.RequireFilter && !reqdata.search && !reqdata.searchjson) noresultsmessage = _this.RequireFilterMessage;
      $(_this.PlaceholderID).html('<tr class="xtbl_noresults"><td colspan="' + _this.ColSpan + '" align="center" class="xtbl_noresults">' + noresultsmessage + '</td></tr>');
      _this.RowCount = 0;
      if (_this.OnResetDataSet) _this.OnResetDataSet(data);
    }
    else {
      if (_this.PreProcessResult) _this.PreProcessResult(data);
      var ejssource = "";
      if (_this.TemplateHTMLFunc != null) {
        ejssource = _this.TemplateHTMLFunc(data, rowstart);
        if (ejssource === false) {
          global.xLoader.StopLoading(_this);
          _this.IsLoading = false;
          _this.Load();
          return;
        }
      }
      else ejssource = $(_this.TemplateID).html();
      
      if (rowstart == 0) {
        $(_this.PlaceholderID).empty();
        _this.RowCount = 0;
        if (_this.OnResetDataSet) _this.OnResetDataSet(data);
      }
      if (ejssource) {
        ejssource = ejssource.replace(/<#/g, '<%').replace(/#>/g, '%>')
        if (data[this.q] && _this.OnRender) _this.OnRender(ejssource, data);
        else {
          var ejsrslt = ejs.render(ejssource, {
            rowid: undefined,
            data: data[this.q],
            xejs: XExt.xejs,
          });
          $(_this.PlaceholderID).append(ejsrslt);
          _this.RowCount = $(_this.PlaceholderID).find('tr').length;
        }
      }
      _this.EOF = data['_eof_' + this.q];
      if ((_this.Paging) && (!_this.EOF)) {
        $(_this.PlaceholderID).append('<tr class="xtbl_loadmore"><td colspan="' + _this.ColSpan + '"><a href="#">Load More Data</div></td></tr>');
        $(_this.PlaceholderID).find('.xtbl_loadmore').click(function () {
          if (_this.OnLoadMoreData) { _this.OnLoadMoreData(); return false; }
          _this.Load(_this.RowCount);
          return false;
        });
      }
      if (_this.CustomScroll != '') {
        $(_this.CustomScroll).mCustomScrollbar("update");
      }
    }
  }
	global.xLoader.StopLoading(_this);
  _this.IsLoading = false;
  if (_this.OnLoadComplete) _this.OnLoadComplete();
	if(onComplete) onComplete();
}
XData.prototype.ResetSortGlyphs = function (tblobj){
  var xhtml_thead = tblobj.find('thead tr');
  xhtml_thead.find("th").removeClass('sortAsc').removeClass('sortDesc');
  if (!this.Sort || (this.Sort.length == 0)) return;
  
  var xhtml_th = tblobj.find('.thead' + this.Sort[0].substring(1));
  if (this.Sort[0][0] == '^') { xhtml_th.addClass('sortAsc'); }
  else { xhtml_th.addClass('sortDesc'); }
}
XData.prototype.AddSort = function(obj,col){
	var newdir = '^';
	for(var i = 0; i < this.Sort.length; i++){
		 if(this.Sort[i].substring(1)==col){
			 if(i==0){
				 var curdir = this.Sort[i].substring(0,1);
				 if(curdir == '^') newdir = 'v';
			 }
			 this.Sort.splice(i,1);
			 i--;
		 }
	}
	var xhtml_th = $(obj).parent();
	var xhtml_thead = xhtml_th.parent();
	if(newdir == '^'){ xhtml_thead.find("th").removeClass('sortAsc').removeClass('sortDesc'); xhtml_th.addClass('sortAsc'); }
	else{ xhtml_thead.find("th").removeClass('sortAsc').removeClass('sortDesc'); xhtml_th.addClass('sortDesc'); }
	this.Sort.unshift(newdir+col);
	this.Load();
	return false;
}
XData.prototype.NewSearch = function(txt){
	this.Search = txt;
	this.Load();
	return false;
}
XData.prototype.NewSearchJSON = function(txt, cb){
	this.SearchJSON = txt;
	this.Load(undefined,undefined,cb);
	return false;
}
XData.prototype._WindowOnScrollBottom = function(callback){
	var _this = this;
	_this.scrollFunc = function(){
		var curDocumentHeight = _this._getDocumentHeight();
		if(curDocumentHeight != _this.lastDocumentHeight){
			_this.lastDocumentHeight = curDocumentHeight;
			_this.scrolledPastBottom = false;
		}
		var pastBottom = (($(window).height() + $(window).scrollTop()) >= (curDocumentHeight));
		if(!_this.scrolledPastBottom && pastBottom) {
			callback($(window).height() + $(window).scrollTop());
			_this.scrolledPastBottom = true;
		} else {
			if(!pastBottom) _this.scrolledPastBottom = false;
		}
		_this.scrollPrevious = $(window).scrollTop();
  };
  $(_this.ScrollControl).scroll(_this.scrollFunc);
}
XData.prototype._getDocumentHeight = function() {
	return Math.max(
			Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
			Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
			Math.max(document.body.clientHeight, document.documentElement.clientHeight)
	);
}
XData.prototype._ControlOnScrollBottom = function(callback){
	var _this = this;
  _this.scrollFunc = function () {
    var pastBottom = (($(_this.ScrollControl).outerHeight() + $(_this.ScrollControl).scrollTop()) >= $(_this.ScrollControl).get(0).scrollHeight);
    //console.log(($(_this.ScrollControl).outerHeight()+$(_this.ScrollControl).scrollTop()) + ">=" + $(_this.ScrollControl).get(0).scrollHeight);
    if (!_this.scrolledPastBottom && pastBottom) {
      callback($(_this.ScrollControl).height() + $(_this.ScrollControl).scrollTop());
      _this.scrolledPastBottom = true;
    } else {
      if (!pastBottom) _this.scrolledPastBottom = false;
    }
    _this.scrollPrevious = $(_this.ScrollControl).scrollTop();
  };
  $(_this.ScrollControl).scroll(_this.scrollFunc);
}
XData.prototype.EnableScrollUpdate = function() {
	var _this = this;
	var updateFunc = function(){
		if(_this.AutoLoadMore){
			if(!_this.EOF){
				_this.Load(_this.RowCount);
			}
		}
	};
	if(_this.CustomScroll != ''){
		$(_this.CustomScroll).mCustomScrollbar({
			theme:"dark",
			autoScrollOnFocus: false,
			scrollButtons:{ enable:true },
			scrollInertia:0,
			callbacks:{
				onTotalScroll: updateFunc
			}
		});
	}
	else if(this.ScrollControl == window) this._WindowOnScrollBottom(updateFunc);
	else this._ControlOnScrollBottom(updateFunc);
}
XData.prototype.Destroy = function (){
  var _this = this;
  if (_this.CustomScroll != '') { $(_this.CustomScroll).mCustomScrollbar("destroy"); }
  else { $(_this.ScrollControl).unbind('scroll', _this.scrollFunc); }
}

module.exports = XData;