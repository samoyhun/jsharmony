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

var _ = require('lodash');
var moment = require('moment');
var ejs = require('ejs');
var async = require('async');
var jshParser = require('./JSParser.js');

function CodeGen(db, sqlbase){
  this.db = db;
  this.sqlbase = sqlbase || { CustomDataTypes:{}, SQL: {} };
}

CodeGen.prototype.generateModels = function(table, callback){
  var _this = this;
  var rslt = {};
  var rsltmessages = [];
  _this.db.meta.getTables(table, function(err, messages, tabledefs){
    if(err) return callback(err);
    if(messages.length > 0) rsltmessages = rsltmessages.concat(messages);
    async.eachSeries(tabledefs, function(tabledef, table_callback){
      _this.db.meta.getTableFields(tabledef, function(err, messages, fields){
        if(err) return table_callback(err);
        if(messages.length > 0) rsltmessages = rsltmessages.concat(messages);
        tabledef.fields = fields;
        //Model Name
        var model_name = tabledef.model_name;
        async.waterfall([
          //Generate Form
          function(generate_cb){
            _this.generateModelFromTableDefition(tabledef, 'form', {}, function(err, messages, modeltxt){  
              if(err) return generate_cb(err);
              if(messages.length > 0) rsltmessages = rsltmessages.concat(messages);
              if(modeltxt) rslt[model_name+'_form'] = modeltxt;
              return generate_cb(null);
            });
          },
          //Generate Grid
          function(generate_cb){
            _this.generateModelFromTableDefition(tabledef, 'grid', { 'form': model_name+'_form' }, function(err, messages, modeltxt){  
              if(err) return generate_cb(err);
              if(messages.length > 0) rsltmessages = rsltmessages.concat(messages);
              if(modeltxt) rslt[model_name+'_grid'] = modeltxt;
              return generate_cb(null);
            });
          },
        ], table_callback);
      });
    }, function(err){
      if(err) return callback(err);
      if(table && !_.size(rslt)) return callback(new Error('Table not found: '+(table.schema?(table.schema+'.'):'')+table.name));
      return callback(null, rsltmessages, rslt);
    });
  });
}

CodeGen.prototype.generateModelFromTableDefition = function(tabledef, layout, options, callback){
  var _this = this;
  if(!options) options = {};
  var messages = [];
  var model = {};
  model.comment = tabledef.name;
  model.layout = layout;
  model.title = tabledef.description||tabledef.name;
  model.table = tabledef.name;
  if(tabledef.schema) model.table = tabledef.schema + '.' + model.table;
  model.caption = ["", "Item", "Items"];

  var primary_keys = [];
  _.each(tabledef.fields,function(fielddef){
    if(fielddef.coldef.primary_key) primary_keys.push(fielddef.name);
  });

  if(layout=='form'){
    if(primary_keys.length==0){
      model.unbound = 1;
      messages.push('WARNING: Table ' + model.table + ' - MISSING PRIMARY KEY - Adding UNBOUND parameter');
    }
    model.access = 'BIUD';
    model.popup = [900,600];
  }
  else if(layout=='grid'){
    model.access = 'BI';
    model.sort = [];
    _.each(primary_keys,function(fname){ model.sort.push("^" + fname) });
    if(options.form) model.buttons = [{"link":"add:"+options.form}];
  }

  model.fields = [];
  _.each(tabledef.fields,function(fielddef){
    var field = { };
    var coldef = fielddef.coldef;
    for(prop in fielddef){ if(prop != 'coldef') field[prop] = fielddef[prop]; }
    //Caption
    if(coldef.description) field.caption = coldef.description;
    else field.caption = field.name;
    //Primary Key
    if(coldef.primary_key) field.key = 1;

    var finaltype = { type: field.type, datatype_config: {} };
    var fieldtypes = [];
    fieldtypes.push(field.type);
    while(finaltype.type in _this.sqlbase.CustomDataTypes){
      var fieldtype = finaltype.type;
      var datatype = _this.sqlbase.CustomDataTypes[fieldtype];
      for (var prop in datatype) {
        if(!(prop in finaltype) || (prop=='type')) finaltype[prop] = datatype[prop];
        else if(prop=='datatype_config'){
          for(var subprop in datatype.datatype_config){
            if(!(subprop in finaltype.datatype_config)) finaltype.datatype_config[subprop] = datatype.datatype_config[subprop];
          }
        }
      }
      if(finaltype.type==fieldtype) break;
      fieldtypes.push(finaltype.type);
    }
    var finaltypename = finaltype.type;

    if(layout=='form'){
      //Set Controls
      if(finaltypename=='boolean'){
        field.control = 'checkbox';
        field.controlparams = { value_false: '0' };
      }
      else if(finaltypename=='int'){ field.control = 'textbox_S'; }
      else if(finaltypename=='smallint'){ field.control = 'textbox_VS'; }
      else if(finaltypename=='tinyint'){ field.control = 'textbox_VS'; }
      else if(finaltypename=='decimal'){ field.control = 'textbox_decimal'; }
      else if(finaltypename=='float'){ field.control = 'textbox_decimal'; }
      else if(finaltypename=='date'){ field.control = 'date_mmddyyyy'; }
      else if(finaltypename=='time'){
        if(finaltype.datatype_config.preserve_timezone){ field.controlclass = 'xtextbox_tstmp7z'; }
        else{ field.control = 'textbox_hhmmss'; }
      }
      else if(finaltypename=='datetime'){ 
        if(finaltype.datatype_config.preserve_timezone){ field.controlclass = 'xtextbox_tstmp7z'; }
        else{ field.controlclass = 'xtextbox_tstmp7'; }
      }
      else if(_.includes(fieldtypes, 'money')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'interval')){ field.control = 'textbox_M'; }

      else if(_.includes(fieldtypes, 'point')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'line')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'lseg')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'box')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'path')){ field.control = 'textbox_L'; }
      else if(_.includes(fieldtypes, 'polygon')){ field.control = 'textbox_M'; }
      else if(_.includes(fieldtypes, 'circle')){ field.control = 'textbox_M'; }
      
      else if(_.includes(fieldtypes, 'inet')){ field.control = 'textbox_M'; }
      else if(_.includes(fieldtypes, 'cidr')){ field.control = 'textbox_M'; }
      else if(_.includes(fieldtypes, 'macaddr')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'tsvector')){ field.control = 'textbox_L'; }
      else if(_.includes(fieldtypes, 'tsquery')){ field.control = 'textbox_L'; }
      
      else if(_.includes(fieldtypes, 'uuid')){ field.control = 'textbox_L'; }
      else if(_.includes(fieldtypes, 'pg_lsn')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'txid_snapshot')){ field.control = 'textbox_S'; }

      else if(_.includes(fieldtypes, 'uniqueidentifier')){ field.control = 'textbox_L'; }
      else if(_.includes(fieldtypes, 'sql_variant')){ field.control = 'textbox_M'; }
      else if(_.includes(fieldtypes, 'hierarchyid')){ field.control = 'textbox_S'; }
      else if(_.includes(fieldtypes, 'geometry')){ field.control = 'textbox_L'; }
      else if(_.includes(fieldtypes, 'geography')){ field.control = 'textbox_VL'; }

      if(coldef.readonly){
        field.access = "B";
        if(!field.control) field.control = "label";
      }
      else{
        field.access = "BIU";
        if(!field.control){
          field.control = "textbox";
          if((finaltypename=='varchar')||(finaltypename=='char')){
            var flen = field.length||finaltype.length||-1;
            if(_.includes(fieldtypes, 'binary')||_.includes(fieldtypes, 'varbinary')) flen = flen*2;
            if(flen < 0){ field.control = "textarea_M";  field.captionclass = "xtextarea_caption"; }
            else if(flen <= 10) field.control = "textbox_S";
            else if(flen <= 50) field.control = "textbox_M";
            else if(flen <= 100) field.control = "textbox_L";
            else if(flen <= 200) field.control = "textbox_VL";
            else{ field.control = "textarea_M"; field.captionclass = "xtextarea_caption"; }
          }
        }
      }
      //Validation / Required fields
      field.validate = [];
      if(coldef.required && (field.control != 'checkbox')) field.validate.push("Required");
      field.nl = 1;
    }
    else if(layout=='grid'){
      field.access = 'B';

      if(finaltypename=='date'){ field.format = ["date","MM/DD/YYYY"]; }

      if(coldef.primary_key){
        if(options.form) field.link = "edit:"+options.form;
      }
    }
    model.fields.push(field);
  });

  //Format JSON
  formatter = [{Pre:'',Post:''}];
  for(var prop in model){
    var proptoken = {S:prop,SPre:"\r\n  ",SPost:"",VPre:" ",VMid:"",VPost:""};
    if(prop=='fields'){
      proptoken.V = [];
      for(var i=0;i<model.fields.length;i++){
        var fieldtoken = { I:(i+1), VPre: "\r\n    ",VMid: "",VPost:"", V:[] };
        for(var fprop in model.fields[i]){
          fieldtoken.V.push({S:fprop,SPre:" ",SPost:"",VPre:"",VMid:"",VPost:""});
        }
        if(fieldtoken.V.length > 0) fieldtoken.V[0].SPre = "";
        proptoken.V.push(fieldtoken);
      }
      if(proptoken.V.length) proptoken.V[proptoken.V.length-1].VPost = "\r\n  ";
    }
    formatter.push(proptoken);
  }
  formatter[formatter.length-1].VPost = "\r\n";

  //Generate Output
  var rslt = jshParser.GenString(model,formatter);
  return callback(null, messages, rslt);
}

exports = module.exports = CodeGen;