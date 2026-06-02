/*
Copyright 2018 apHarmony

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

exports = module.exports = function(jsh){
  var XDom = jsh.XDom;

  var XDebugConsole = function(){
    this.isInitialized = false;
    this.SettingsCookieID = 'debugconsole';
    this.socket = null;
    this.socket_url = (window.location.protocol=='https:'?'wss:':'ws:')+'//' + window.location.hostname + ':' + window.location.port + jsh._BASEURL + '_log';
    this.settings = {};
    this.dock_positions = ['bottom','right'];
    this.client_sources = {
      'client_requests': 'Client Requests'
    };
    this.server_sources = {
      'webserver':'Web Server',
      'system': 'System',
      'database': 'Database',
      'database_raw_sql': 'Database Raw SQL',
      'authentication': 'Authentication'
    };
    this.all_sources = _.extend({}, this.client_sources, this.server_sources);
    this.default_settings = {
      'running':0,
      'minimized':0,
      'dock':'bottom',
      'sources': {
        client_requests: false,
        webserver: true,
        system: true,
        database: false,
        database_raw_sql: false,
        authentication: false
      },
      'window_size': { width:500, height:300 },
      'settings_visible': true
    };
    this.saveSettingsTimer = null;

    //DOM Elements
    this.DebugDialog = null;
    this.DebugPanel = null;
    this.DebugPanelMin = null;

    this.init();
  };

  //XDebugConsole.init - Called during jsHarmony.Init on page load
  XDebugConsole.prototype.init = function(){
    this.loadSettings();
    this.saveSettings();

    this.createPanel();

    this.isInitialized = true;

    if(this.settings.running) this.start(true);
  };

  XDebugConsole.prototype.isRunning = function(){
    return (jsh.dev && this.settings && this.settings.running);
  };
  XDebugConsole.prototype.isMinimized = function(){
    return (this.settings.minimized);
  };

  XDebugConsole.prototype.loadSettings = function(){
    this.settings = jsh.XExt.GetSettingsCookie(this.SettingsCookieID)||{};
    this.settings = _.extend({},this.default_settings, this.settings);
  };

  XDebugConsole.prototype.saveSettings = function(options){
    options = _.extend({ debounce: false }, options);
    var _this = this;
    if(options.debounce){
      if(this.saveSettingsTimer) return;
      this.saveSettingsTimer = window.setTimeout(function(){ _this.saveSettings(_.extend(options,{ debounce: false })); });
      return;
    }
    if(this.saveSettingsTimer){ window.clearTimeout(this.saveSettingsTimer); this.saveSettingsTimer = null; }
    try{
      jsh.XExt.SetSettingsCookie(this.SettingsCookieID,this.settings);
    }
    catch(ex){
      console.error(ex); // eslint-disable-line no-console
    }
  };

  XDebugConsole.prototype.getSourcesForWebSocket = function(){
    var sources = _.extend({},this.settings.sources);
    for (var client_source in this.client_sources){
      delete sources[client_source];
    }
    for (var k in sources){
      if (!sources[k]) delete sources[k];
    }
    return sources;
  };
  
  XDebugConsole.prototype.toggle = function(){
    if(this.isRunning()) this.close();
    else this.start();
  };

  XDebugConsole.prototype.start = function(force){
    if(!force && this.isRunning()) return;

    this.settings.running = 1;
    this.saveSettings();

    this.expandWindow();

    this.startWebSocketListener();
    this.bindXMLHttpRequestListener();

    this.saveSettings();
  };

  XDebugConsole.prototype.close = function(){
    this.settings.running = 0;
    this.saveSettings();

    this.DebugDialog.style.display = false;
    this.clear();

    if(this.isRunning()){
      this.endWebSocketListener();
      this.unbindXMLHttpRequestListener();
    }
  };

  XDebugConsole.prototype.onXMLHttpRequestLoad = function(event){
    if (this.settings.sources['client_requests'] && this.settings.running) {
      var t = new Date();
      var client_resp = '';
      try {
        client_resp = JSON.stringify(JSON.parse(event.currentTarget.responseText), null, 2);
      } catch (e) {
        if (e instanceof SyntaxError) {
          client_resp = event.currentTarget.responseText;
        }
      }
      this.log(t.toLocaleString() + ' - Client Request: ' + decodeURIComponent(event.currentTarget.responseURL) + '<br>Client Response: ' + client_resp);
    }
  };

  XDebugConsole.prototype.bindXMLHttpRequestListener = function(){
    if(!XMLHttpRequest.prototype._baseSend) {
      var _this = this;
      XMLHttpRequest.prototype._baseSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (value) {
        this.addEventListener('load', _this.onXMLHttpRequestLoad.bind(_this), false);
        this._baseSend(value);
      };
    }
  };

  XDebugConsole.prototype.unbindXMLHttpRequestListener = function(){
    if(XMLHttpRequest.prototype._baseSend) {
      XMLHttpRequest.prototype.send = XMLHttpRequest.prototype._baseSend;
      delete XMLHttpRequest.prototype._baseSend;
    }
  };

  XDebugConsole.prototype.startWebSocketListener = function(){
    var _this = this;
    if (!this.socket || (typeof this.socket.readyState === 'undefined')){
      this.socket = new WebSocket(this.socket_url);
      this.socket.onopen = function (e) {
        _this.socket.send(JSON.stringify({setSettings: {sources: _this.getSourcesForWebSocket()}}));
        _this.socket.send(JSON.stringify({getHistory: true}));
      };
      this.socket.onclose = function (e) {
        if (!e.wasClean){
          var t = new Date();
          _this.log(
            '<span style="color: red;">'+ t.toLocaleString() + ' - ' +
            ' Can\'t connect to Web Socket (URL: '+XDebugConsole.socket_url +'; Code: '+e.code+') Will try to reconnect in 2 sec.</span>'
          );
          _this.socket=null;
          setTimeout(function(){
            var t = new Date();
            _this.log(
              '<span style="color: green;">'+ t.toLocaleString() + ' - ' + 'Trying to reconnect to Web Socket.</span>'
            );
            if(!_this.settings.running) return;
            _this.startWebSocketListener();
          }, 2000);
        }
      };
      this.socket.onmessage = function (e) {
        try{
          var m = JSON.parse(e.data);
          var t = new Date( m.timestamp);
          _this.log(
            '<span style="color: ' + m.color + '">'+ t.toLocaleString() + ' - ' + _this.all_sources[m.source] + ': ' +  m.txt + '</span>'
          );
        }catch (e) {
          if(e instanceof SyntaxError){
            _this.log(
              '<span style="color: red">Can\'t parse json. Error: ' +  e.message + '</span>'
            );
          }else{
            throw e;
          }
        }
      };
    }
    else{
      this.updateWebSocketSources();
    }
  };

  XDebugConsole.prototype.updateWebSocketSources = function(){
    var _this = this;
    if (this.socket && (typeof this.socket.readyState !== 'undefined')) {
      this.socket.send(JSON.stringify({setSettings: {sources: _this.getSourcesForWebSocket()}}));
    }
  };

  XDebugConsole.prototype.endWebSocketListener = function(){
    if (this.socket && (typeof this.socket.readyState !== 'undefined')) {
      this.socket.close();
      this.socket = null;
    }
  };

  XDebugConsole.prototype.createPanel = function(){
    var _this = this;
    var settingsHtml = '';
    for(var source_id in _this.all_sources){
      var obj_id = 'xdebugconsole_source_'+source_id;
      settingsHtml +=
        '<label for="' + obj_id + '">' +
          '<input type="checkbox" class="xdebugconsole_source" id="' + obj_id + '" value="' + source_id + '"> ' + _this.all_sources[source_id] +
        '</label>';
    }
    this.DebugDialog = XDom(jsh.xdroot, '.xdebugconsole');
    this.DebugPanel = XDom(this.DebugDialog, '.debug-panel');
    XDom.content.append(this.DebugPanel.select('.debug-settings'), settingsHtml);
    this.DebugPanelMin = XDom(this.DebugDialog, '.debug-panel-minimized');
    var checkboxes = this.DebugPanel.select('.xdebugconsole_source');
    for (var i=0; i<checkboxes.length; i++){
      if (this.settings.sources[checkboxes[i].value]){
        checkboxes[i].click();
      }
    }
    this.DebugDialog.style.display = false;
    this.DebugDialog.class.remove('visible');
    this.updatePanelLayout();
    jsh.XExt.makeResizableDiv('.debug-panel',[
      {selector:'.xdebuginfo-body',
        correction_y:function(){ return _this.getBodyHeight(0); },
        correction_x:function(){ return (_this.settings.dock == 'bottom') ? 0 : -3; }
      },
      {selector:'.xdebugconsole',correction_y:0,correction_x:0},
    ], { onDragEnd: function(){
      _this.settings.window_size = _this.getWindowSize();
      _this.saveSettings();
    } });
    //Source Checkboxes
    XDom.on(this.DebugPanel, 'click', function(e){
      if(jsh.XDom.parent(e.target, '.xdebugconsole_source').length) {
        _this.settings.sources[e.target.value] = !!e.target.checked;
        _this.saveSettings();
        _this.updateWebSocketSources();
      }
    });
    XDom.on(this.DebugDialog.select('.controls i'), 'click', function(){
      var action = XDom(this).data.action;
      if(action && _this[action]) _this[action]();
    });
  };

  XDebugConsole.prototype.getWindowSize = function(){
    var debugPanel = XDom('.debug-panel');
    var width = debugPanel.calc.width() || 0;
    var height = debugPanel.calc.height() || 0;
    if(this.settings.dock == 'bottom') return { height: height };
    return { width: width, height: height };
  };

  XDebugConsole.prototype.getBodyHeight = function(baseHeight){
    var settingsEl = XDom(this.DebugPanel, '.debug-settings').select()[0];
    var settingsHeight = (this.settings.settings_visible && settingsEl) ? settingsEl.offsetHeight : 0;
    return baseHeight - 31 - settingsHeight;
  };

  XDebugConsole.prototype.setWindowSize = function(size){
    if(!size) size = {};
    if(!('width' in size)) size.width = this.default_settings.window_size.width;
    if(!('height' in size)) size.height = this.default_settings.window_size.height;

    if(this.settings.dock == 'bottom'){
      XDom('.debug-panel').style.height = size.height;
      XDom('.xdebuginfo-body').style.height = this.getBodyHeight(size.height);
    }
    else if(this.settings.dock == 'right'){
      XDom('.debug-panel').style.width = size.width;
      XDom('.debug-panel').style.height = size.height;
      XDom('.xdebuginfo-body').style.height = this.getBodyHeight(size.height);
    }
  };

  XDebugConsole.prototype.updatePanelLayout = function() {
    for(var i=0; i<this.dock_positions.length; i++){
      this.DebugDialog.class.remove(this.dock_positions[i]);
    }
    this.DebugDialog.class.add(this.settings.dock);
    this.setWindowSize(this.settings.window_size);
    this.renderSettings();
  };

  XDebugConsole.prototype.renderSettings = function(){
    var xdSettings = XDom(this.DebugPanel, '.debug-settings');
    xdSettings.style.display = !!this.settings.settings_visible;
  };

  XDebugConsole.prototype.toggleSettings = function(){
    this.settings.settings_visible = !this.settings.settings_visible;
    this.saveSettings();
    this.renderSettings();
  };

  XDebugConsole.prototype.minimizeWindow = function(){
    this.DebugPanel.style.display = false;
    this.DebugPanelMin.style.display = true;
    this.DebugDialog.class.remove('visible');
    this.settings.minimized = 1;
    this.saveSettings();
  };

  XDebugConsole.prototype.expandWindow = function(){
    this.DebugPanel.style.display = true;
    this.DebugPanelMin.style.display = false;
    this.DebugDialog.style.display = true;
    this.DebugDialog.class.add('visible');
    this.settings.minimized = 0;
    this.saveSettings();
  };

  XDebugConsole.prototype.dockRight = function(){
    this.settings.dock = 'right';
    this.updatePanelLayout();
    this.saveSettings();
  };

  XDebugConsole.prototype.dockBottom = function(){
    this.settings.dock = 'bottom';
    this.DebugPanel.attr.style = null;
    this.DebugPanel.style.display = true;
    XDom.setAttribute(this.DebugPanel.select(".xdebuginfo-body"), 'style', null);
    this.updatePanelLayout();
    this.saveSettings();
  };

  XDebugConsole.prototype.clear = function() {
    XDom.content.clear(this.DebugPanel.select('.xdebuginfo-body'));
  };

  XDebugConsole.prototype.log = function (txt, clear) {
    if(clear) this.clear();
    XDom.content.prepend(this.DebugPanel.select('.xdebuginfo-body'), '<div class="info-message">'+txt+'</div>');
  };

  return XDebugConsole;
};