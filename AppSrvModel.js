﻿/*
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

var _ = require('lodash');
var Helper = require('./lib/Helper.js');
var ejs = require('ejs');
var ejsext = require('./lib/ejsext.js');
var moment = require('moment');
var async = require('async');

/*
---------------------------
Return model data to client
---------------------------
Current server-side dependencies:
> toptitle
> tabs / bindings
> buttons
> helpurl / helpurl_onclick
> breadcrumbs
> field.serverejs
> link -> jsh.getURL
> onclick -> jsh.getURL_onclick
> jsh.getAuxFields

 * */

function AppSrvModel(appsrv) {
  this.AppSrv = appsrv;
  this.srcfiles = {};
  this.loadEJS();
}


/*******************
|     LOAD EJS     |
*******************/
AppSrvModel.prototype.loadEJS = function () {
  var jsh = this.AppSrv.jsh;
  this.srcfiles = {
    'jsh_form': jsh.getEJS('jsh_client_form'),
    'jsh_embed.js': jsh.getEJS('jsh_client_embed.js'),
    'jsh_controls': jsh.getEJS('jsh_client_controls'),
    'jsh_tabs_bottom': jsh.getEJS('jsh_client_tabs_bottom'),
    'jsh_tabs_top': jsh.getEJS('jsh_client_tabs_top'),
    'jsh_tabs_controls': jsh.getEJS('jsh_client_tabs_controls'),
    'jsh_topmost.js': jsh.getEJS('jsh_client_topmost.js'),
    'jsh_form.js': jsh.getEJS('jsh_client_form.js'),
    'jsh_form.js.datamodel': jsh.getEJS('jsh_client_form.js.datamodel'),
    'jsh_form.js.single': jsh.getEJS('jsh_client_form.js.single'),
    'jsh_form.js.multiple': jsh.getEJS('jsh_client_form.js.multiple'),
    'jsh_grid': jsh.getEJS('jsh_client_grid'),
    'jsh_grid.js': jsh.getEJS('jsh_client_grid.js'),
    'jsh_grid.js.datamodel': jsh.getEJS('jsh_client_grid.js.datamodel'),
    'jsh_multisel': jsh.getEJS('jsh_client_multisel'),
    'jsh_multisel.js': jsh.getEJS('jsh_client_multisel.js'),
    'jsh_multisel.js.datamodel': jsh.getEJS('jsh_client_multisel.js.datamodel'),
    'jsh_exec.js': jsh.getEJS('jsh_client_exec.js'),
    'jsh_exec.js.datamodel': jsh.getEJS('jsh_client_exec.js.datamodel'),
    'jsh_buttons': jsh.getEJS('jsh_client_buttons'),
  };
  for (var sname in this.srcfiles) {
    this.srcfiles[sname] = removeEmptyBytes(this.srcfiles[sname]);
  }
}

function removeEmptyBytes(str){
  //var rslt = str.replace(/div/g, "");
  //var rslt = str.replace(/\p{65279}/g, "");
  var rslt = str.replace(/\uFEFF/g, "");
  return rslt;
}

AppSrvModel.prototype.GetModel = function (req, res, modelid) {
  var _this = this;
  var jsh = this.AppSrv.jsh;
  var model = jsh.getModel(req, modelid);
  if (!Helper.HasModelAccess(req, model, 'B')) { Helper.GenError(req, res, -11, 'Invalid Model Access'); return; }
  req.curtabs = jsh.getTabs(req, modelid);
  req.TopModel = modelid;

  _this.genClientModel(req, res, modelid, true, function(rslt){
    res.end(JSON.stringify(rslt));
  });
};

AppSrvModel.prototype.genClientModel = function (req, res, modelid, topmost, onComplete) {
  var _this = this;
  var jsh = this.AppSrv.jsh;
  if (!jsh.hasModel(req, modelid)) throw new Error('Model ID not found: ' + modelid);
  var model = jsh.getModel(req, modelid);
  
  var targetperm = 'B';
  if ('action' in req.query) {
    if (req.query.action == 'add') targetperm = 'I';
    else if (req.query.action == 'edit') targetperm = 'U'; //Browse is accessed the same way as update
  }
  if (!Helper.HasModelAccess(req, model, 'B'+targetperm)) { return onComplete("<div>You do not have access to this form.</div>"); }

  var rslt = {};

  copyValues(rslt, model, [
    'id', 'layout', 'caption', 'oninit', 'onload', 'onloadimmediate', 'oninsert', 'onupdate', 'oncommit', 'onvalidate', 'onloadstate', 'onrowbind', 'ondestroy', 'js', 'hide_system_buttons',
    'popup', 'rowclass', 'rowstyle', 'tabpanelstyle', 'tablestyle', 'formstyle', 'sort', 'querystring', 'disableautoload', 'tabpos', 'templates',
    'reselectafteredit','newrowposition','commitlevel','validationlevel','nogridadd','grid_expand_filter','grid_rowcount', 'grid_require_filter','grid_save_before_update','noresultsmessage','bindings','ejs',
    //General Data
    function () {
      return {
        'helpurl': ejsext.getHelpURL(req, jsh, model.helpid), 
        'helpurl_onclick': ejsext.getHelpOnClick(req, jsh),
        'actions': ejsext.getaccess(req, model, 'BIUD'),
        'breadcrumbs': ejsext.BreadCrumbs(req, jsh, modelid)
      }
    },
    //Generate Buttons
    function () {
      var rsltbuttons = [];
      var buttons = jsh.parseButtons(model.buttons);
      if (typeof buttons != 'undefined') for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        var link_target = button['link'];
        var link_bindings = button['bindings'];
        var link_actions = button['actions'];
        var link_text = button['text'] || '';
        link_text = link_text.replace(new RegExp('%%%CAPTION%%%', 'g'), model.caption[1]);
        link_text = link_text.replace(new RegExp('%%%CAPTIONS%%%', 'g'), model.caption[2]);
        var link_icon = button['icon'];
        var link_style = button['style'];
        var link_class = button['class'];
        var link_newline = button['nl'] ? 1 : 0;
        var link_group = button['group'] || '';
        if (!ejsext.access(req, model, link_actions)) continue;
        if('roles' in button) if (!ejsext.access(req, button, link_actions)) continue;
        var link_url = '';
        var link_onclick = '';
        if (link_target && link_target.substr(0, 3) == 'js:') {
          link_url = '#';
          link_onclick = "var xformid = '" + modelid + "'; "+link_target.substr(3)+' return false;';
        }
        else {
          var link_targetmodelid = jsh.parseLink(link_target).modelid;
          link_url = jsh.getURL(req, link_target, undefined, undefined, link_bindings);
          link_onclick = jsh.getModelLinkOnClick(link_targetmodelid, req, link_target);
        }
        var rsltbutton = {
          'url': link_url,
          'onclick': link_onclick,
          'actions': link_actions,
          'icon': link_icon,
          'text': link_text,
          'style': link_style,
          'class': link_class,
          'nl' : link_newline,
          'group': link_group,
        };
        rsltbuttons.push(rsltbutton);
      }
      return { 'buttons': rsltbuttons };
    },
  ]);
  if (global.use_sample_data) rslt['sample_data'] = 1;

  if (!model._inherits || (model._inherits.length == 0)) rslt._basemodel = model.id;
  else rslt._basemodel = model._inherits[0];

  //Define whether the model definition needs to be reselected after update
  rslt.modeltype = 'static';
  if(req.jshlocal && (modelid in req.jshlocal.Models)) rslt.modeltype = 'dynamic'; //Model uses onroute to customize properties
  else if(model.tabcode) rslt.modeltype = 'dynamic'; //Model has tabs calculated server-side

  var tabcode = null;

  async.waterfall([
    //Get tabcode, if applicable
    function(cb){
      if(model.tabcode){
        _this.AppSrv.getTabCode(req, res, modelid, function(_tabcode){
          tabcode = _tabcode;
          return cb();
        });
      }
      else return cb();
    },

    function(cb){
      //Generate Tabs
      tabcode = (tabcode || '').toString();
      if(('tabpos' in model) && model.tabs) {
        var tabbindings = {};
        var basetab = req.curtabs[model.id];
        if (!basetab) basetab = '';
        
        var showtabs = [];
        var showmodels = [];

        for(var i=0; i<model.tabs.length;i++){
          var tab = model.tabs[i];
          var tabname = tab.name;
          //if (!ejsext.access(req, model, targetperm, tab.actions)) continue;
          //if('roles' in tab) if (!ejsext.access(req, tab, targetperm, tab.actions)) continue;
          if (tab.showcode) {
            if (_.includes(tab.showcode, tabcode)) {
              showtabs.push(tabname);
              showmodels.push(tab.target);
            }
          }
          else {
            showtabs.push(tabname);
            showmodels.push(tab.target);
          }
        }
        
        if(showtabs.length == 0) { return Helper.GenError(req, res, -9, "No tabs available for display"); }
        if (!(model.id in req.curtabs) || !(_.includes(showmodels, req.curtabs[model.id]))) req.curtabs[model.id] = showmodels[0];

        for(var i=0; i<model.tabs.length;i++){
          var tab = model.tabs[i];
          if (req.curtabs[model.id] == tab.target) {
            tabbindings = tab.bindings;
            break;
          }
        }
        
        //Override Help URL to that of first tab
        if (jsh.hasModel(req, req.curtabs[model.id])){
          var firsttabmodel = jsh.getModel(req, req.curtabs[model.id]);
          rslt.helpurl = ejsext.getHelpURL(req, jsh, firsttabmodel.helpid);
        }

        var rslttabs = [];
        for(var i=0; i<model.tabs.length;i++){
          var tab = model.tabs[i];
          var tabname = tab.name;
          if (!_.includes(showtabs, tabname)) continue;
          var acss = 'xtab xtab' + model.id;
          if (i == (model.tabs.length-1)) acss += ' last';
          var linktabs = new Object();
          var tabmodelid = tab.target;
          linktabs[model.id] = tabmodelid;
          var link = jsh.getURL(req, '', linktabs);
          var caption = tab.caption;
          var tab_selected = false;
          if (!caption) caption = tabname;
          if (req.curtabs[model.id] == tabmodelid){ acss += ' selected'; tab_selected = true; }
          else if (('action' in req.query) && (req.query.action == 'add')) { link = '#'; acss += ' disabled'; }
          var rslttab = {
            'acss': acss,
            'link': link,
            'name': tabname,
            'caption': caption,
            'selected': tab_selected,
            'modelid': tabmodelid
          };
          rslttabs.push(rslttab);
        }
        //Get value of current tab
        _this.genClientModel(req, res, req.curtabs[model.id], false, function(curtabmodel){
          curtabmodel['bindings'] = tabbindings;
          rslt.tabs = rslttabs;
          rslt.curtabmodel = curtabmodel;
          return cb();
        });
      }
      else return cb();
    },

    function(cb){
      //Duplicate Model
      if (model.duplicate && ejsext.access(req, model, 'I')) {
        var dmodelid = model.duplicate.target;
        if (!jsh.hasModel(req, dmodelid)) { throw new Error('Duplicate Model ID not found: ' + dmodelid); }
        var dmodel = jsh.getModel(req, dmodelid);
        _this.genClientModel(req, res, dmodelid, false, function(dclientmodel){
          if (!_.isString(dclientmodel)) {
            rslt.duplicate = {};
            rslt.duplicate.target = dmodelid;
            rslt.duplicate.bindings = model.duplicate.bindings;
            rslt.duplicate.model = dclientmodel;
            rslt.duplicate.model.bindings = model.duplicate.bindings;
            rslt.duplicate.popupstyle = '';
            if ('popup' in dmodel) rslt.duplicate.popupstyle = 'width: ' + dmodel.popup[0] + 'px; height: ' + dmodel.popup[1] + 'px;';
            if(model.layout != 'grid') rslt.buttons.push({
              'url': '#',
              'onclick': "if(XForm_HasUpdates()){ XExt.Alert('Please save changes before duplicating.'); return false; } XExt.popupShow('" + dmodelid + "','" + model.id + "_duplicate','Duplicate " + model.caption[1] + "',undefined,this); return false;",
              'actions': 'I',
              'icon': 'copy',
              'text': (model.duplicate.link_text || 'Duplicate'),
              'style': 'display:none;',
              'class': 'duplicate'
            });
            if ('link' in model.duplicate) {
              rslt.duplicate.link = jsh.getURL(req, model.duplicate.link, undefined, dmodel.fields);
              rslt.duplicate.link_options = "resizable=1,scrollbars=1";
              var ptarget = jsh.parseLink(model.duplicate.link);
              if (!jsh.hasModel(req, ptarget.modelid)) throw new Error("Link Model " + ptarget.modelid + " not found.");
              var link_model = jsh.getModel(req, ptarget.modelid);
              if ('popup' in link_model) {
                rslt.duplicate.link_options += ',width=' + link_model.popup[0] + ',height=' + link_model.popup[1];
              }
            }
          }
          return cb();
        });
      }
      else return cb();
    },

    //Resolve title, if applicable
    function(cb){
      _this.AppSrv.getTitle(req, res, modelid, (targetperm=='U'?'BU':targetperm), function(err, title){
        if(typeof title !== 'undefined') rslt.title = (title||'');
        return cb();
      });
    },

    //Set up fields
    function(cb){
      if (topmost) {
        rslt['topmost'] = 1;
        rslt['topmenu'] = '';
        copyValues(rslt, model, ['topmenu']);
        rslt['toptitle'] = model.id;
        if ('title' in rslt) rslt['toptitle'] = rslt.title;
        rslt['forcequery'] = req.forcequery;
      }
      if ('fields' in model) _this.copyModelFields(req,res,model,function(fields){
        rslt.fields = fields;
        return cb();
      });
      else return cb();
    },

  ],function(err){
    //Return result
    if(onComplete) onComplete(rslt);
  });
}

AppSrvModel.prototype.copyModelFields = function (req, res, srcobj, onComplete) {
  var jsh = this.AppSrv.jsh;
  var model = srcobj;
  var rslt = [];
  var auxfields = null;
  var _this = this;
  if ((model.layout == 'grid') || (model.layout == 'multisel')) { auxfields = jsh.getAuxFields(req,res,model); }
  async.eachOfSeries(srcobj.fields, function(srcfield,i,cb){
    var dstfield = {};
    copyValues(dstfield, srcfield, [
      'name', 'key', 'control', 'caption', 'caption_ext', 'captionstyle', 'captionclass', 'nl', 'eol', 'type', 'length',
      'value', 'controlclass', 'target', 'bindings', 'format', 'readonly', 'virtual', 'static', 'unbound', 'onchange', 'onclick', 'hidden',
      'html', 'cellstyle', 'cellclass', 'lovkey', 'controlstyle', 'disable_sort', 'disable_search'
    ]);
    if (srcfield.popuplov) dstfield.popuplov = 1;
    if (srcfield.sql_search_sound) dstfield.search_sound = 1;
    if (global.use_sample_data && ('sample' in srcfield)) dstfield.sample = srcfield.sample;
    if ('controlparams' in srcfield) {
      dstfield.controlparams = {};
      copyValues(dstfield.controlparams, srcfield.controlparams, [
        'download_button', 'preview_button', 'upload_button', 'delete_button', 'dateformat', 'item_context_menu', 'expand_all', 'expand_to_selected', 'value_true', 'value_false', 'value_hidden', 'codeval', 'popupstyle', 'popupiconstyle', 'popup_copy_results', 'onpopup','base_readonly'
      ]);
      if ('thumbnails' in srcfield.controlparams) for (var tname in srcfield.controlparams.thumbnails) {
        var thumb = srcfield.controlparams.thumbnails[tname];
        if (thumb.resize) dstfield.controlparams.thumbnail_width = thumb.resize[0];
        else if (thumb.crop) dstfield.controlparams.thumbnail_width = thumb.crop[0];
        break;
      }
    }
    if (('serverejs' in srcfield) && (srcfield.serverejs)) {
      dstfield.value = ejs.render(dstfield.value, { ejsext: ejsext, req: req, res: res, _: _, model: model });
    }
    if (('link' in srcfield) && (srcfield.link)) {
      if (srcfield.link == 'select') {
        dstfield.link = jsh.getURL(req, srcfield.link + ':' + model.id, undefined, model.fields);
        dstfield.link_onclick = "XExt.selectLOV(this);return false;";
      }
      else if (srcfield.link.substr(0,3)=='js:') {
        dstfield.link = '#';
        dstfield.link_onclick = srcfield.link.substr(3) + ' return false;';
      }
      else {
        dstfield.link = jsh.getURL(req, srcfield.link, undefined, model.fields);
        if (!('onclick' in srcfield)) {
          dstfield.onclick = jsh.getURL_onclick(req, srcfield, model);
        }
      }
    }
    if (auxfields) {
      copyValues(dstfield, auxfields[i], [
        'sortclass', 'link_onclick'
      ]);
    }
    if ('lov' in srcfield) {
      dstfield.lov = {};
      copyValues(dstfield.lov, srcfield.lov, ['parent','parents','blank']);
      if (('UCOD2' in srcfield.lov) || ('sql2' in srcfield.lov)) dstfield.lov.duallov = 1;
      else if ('sqlmp' in srcfield.lov) dstfield.lov.multilov = 1;
    }
    if ('actions' in srcfield) {
      dstfield.actions = ejsext.getaccess(req, model, srcfield.actions);
      if ('roles' in srcfield) dstfield.actions = ejsext.getaccess(req, srcfield, dstfield.actions);
    }
    dstfield.validate = jsh.GetValidatorClientStr(srcfield);
    if (('control' in dstfield) && ((dstfield.control == 'subform') || (dstfield.popuplov))) {
      _this.genClientModel(req, res, srcfield.target, false, function(subform){
        subform['bindings'] = srcfield.bindings;
        dstfield.model = subform;
        rslt.push(dstfield);
        return cb();
      });
    }
    else {
      rslt.push(dstfield);
      return cb();
    }
  }, function(err){
    if(onComplete) onComplete(rslt);
  });
};

function copyValues(destobj, srcobj, values) {
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    if (_.isFunction(value)) { var fval = value(); if (typeof fval != 'undefined') _.extend(destobj, fval); }
    else if (value in srcobj) destobj[value] = srcobj[value];
  }
}

module.exports = AppSrvModel;