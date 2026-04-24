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

var Helper = require('./lib/Helper.js');
var _ = require('lodash');
var fs = require('fs');
var async = require('async');
var path = require('path');

module.exports = exports = {};

exports.SaveImage = function (req, res, fullmodelid) {
  
  var appsrv = this;
  var jsh = appsrv.jsh;
  var dbtypes = appsrv.DB.types;
  var XValidate = jsh.XValidate;
  
  // xxxx hs Validate model access
  if (!jsh.hasModel(req, fullmodelid)) throw new Error('Error: Model ' + fullmodelid + ' not found in collection.');
  
  var model = this.jsh.getModel(req, fullmodelid);
  console.log('model: ', model);

  var Q = req.query || {};
  var P = req.body || {};

  
  console.log('Q: ', Q);
  console.log('P: ', P);

  //Validate parameters
  if (!appsrv.ParamCheck('Q', Q, [])) { Helper.GenError(req, res, -4, 'Invalid Parameters'); return; }
  if (!appsrv.ParamCheck('P', P, ['&upload_model','&upload_model_key','&upload_model_bindings','&images'])) { Helper.GenError(req, res, -4, 'Invalid Parameters'); return; }

  //XValidate
  var validate = new XValidate();
  verrors = {};
  
  validate.AddValidator('_obj.upload_model', 'Upload Model', 'B', [XValidate._v_Required()]);
  validate.AddValidator('_obj.upload_model_key', 'Upload Model Key', 'B', [XValidate._v_Required()]);
  validate.AddValidator('_obj.upload_model_bindings', 'Upload Model Bindings', 'B', [XValidate._v_Required()]);
  validate.AddValidator('_obj.images', 'Images', 'B', [XValidate._v_Required()]);

  verrors = _.merge(verrors, validate.Validate('B', P));
  if (!_.isEmpty(verrors)) { Helper.GenError(req, res, -2, verrors[''].join('\n')); return; }
  
  var upload_model = P.upload_model;
  var upload_model_key = P.upload_model_key;
  var upload_model_bindings = null;
  var images = null;
  var db = jsh.getModelDB(req, upload_model);

  try{
    images = JSON.parse(P.images);
  }
  catch(ex){
    Helper.GenError(req, res, -4, 'Invalid Parameters');
    return;
  }
  if (!images.length) Helper.GenError(req, res, -4, 'Invalid Parameters');

  try{
    upload_model_bindings = JSON.parse(P.upload_model_bindings);
  }
  catch(ex){
    Helper.GenError(req, res, -4, 'Invalid Parameters');
    return;
  }

  console.log('upload_model_bindings: ', upload_model_bindings);

  var image_paths = [];

  function buildSql(upload_model_table, upload_model_key, upload_model_bindings) {
    var field_names = [];
    var field_values = [];
    for(let name in upload_model_bindings) {
      let value = upload_model_bindings[name];
      if (!value) {
        Helper.GenError(req, res, -4, 'Invalid Parameters');
        return;
      }
      field_names.push(name);
      field_values.push(value);
    }

    return [
      '$getInsertKey('+upload_model_table+', '+upload_model_key+',',
      '  insert into '+upload_model_table+'('+field_names.map(function(name) { return db.dbconfig._driver.escape(name); }).join(',')+')',
      '  values('+field_values.map(function(name) { return "'"+db.dbconfig._driver.escape(name)+"'"; }).join(',')+'))',
    ].join('');
  }

  async.eachOfSeries(images, function(image, index, image_cb) {
    var image_data = exports.parsePasteImages(image);
    var media_data = Buffer.from(image_data.data||'', 'base64');
    var id = null;
    
    async.waterfall([
      function(db_cb) {
        // xxxx hs insert new rows for pasted content
        var sql = buildSql(model.table, upload_model_key, upload_model_bindings);
        jsh.AppSrv.ExecScalar(req._DBContext, sql, [], {}, function (err, rslt, stats) {
          if (err != null) { err.sql = sql; appsrv.AppDBError(req, res, err, stats); return; }
          if(!rslt || !rslt[0]){ return Helper.GenError(req, res, -99999, 'Error saving image'); }
          id = rslt[0];
          return db_cb();
        }, undefined, db);
      },

      function(fs_cb) {
        // xxxx hs Write file to disk
        var temp_folder = path.join(jsh.Config.datadir, 'temp');
        var tmp_file_path = path.join(temp_folder, id+'.'+image_data.ext);
        fs.writeFile(tmp_file_path, media_data, function() {
          console.log('file writted to: ', tmp_file_path);
          image_paths.push(tmp_file_path);
          return fs_cb();
        });
      },
    ], function(err) {
      if (err) return image_cb(err);
      return image_cb();
    });

  }, function(err){
    if (err) return Helper.GenError(req, res, -99999, 'An unexpected error has occurred');
    res.type('json');
    // Sample image path: /_dl/<model_path>/<key_value>/<image_field_name>?view=1&_=1776980867633&thumb=x100
    res.end(JSON.stringify({ '_success': 1, '_stats': {}, 'image_paths': image_paths }));
  });

  return;
};

exports.parsePasteImages = function (content){
  //Extract all inline images from the content
  //<img src=\"data:image/png;jshcms=paste;base64,...
  //Expand components
  var origUrl = content;
  if(!Helper.beginsWith(content, 'data:')) return origUrl;
  content = content.substr(5);
  var base64idx = content.indexOf(';base64,');
  if(base64idx<0) return origUrl;
  var imageType = content.substr(0, base64idx);
  var token = ';jshcms=paste';
  if(imageType.indexOf(token)<0) token = token.substr(1);
  imageType = Helper.ReplaceAll(imageType, token, '');
  var base64data = content.substr(base64idx+8);
  var imageTypeIdx = imageType.indexOf('image/');
  var ext = null;
  console.log('imageTypeIdx: ', imageTypeIdx);
  if (imageTypeIdx !== undefined) ext = imageType.substr(imageTypeIdx + 6);
  return {
    url: origUrl,
    type: imageType,
    data: base64data,
    ext: ext,
  };
};

return module.exports;