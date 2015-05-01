/*------------------------------------------------------------------------------------
 $ class os
 $ date: 2015-1-10 16:31
 $ author: LovelyLife http://jshtml.com
 
 $ bugs Fixed:
--------------------------------------------------------------------------------------*/

var g_simple_os = null;
var g_os_start_menu;
var g_os_setting;
var g_task_items = [];

Q.os = Q.extend({
apps: null,
window_list_bar: null,
task_bar: null,
start_button: null,
skin: "",
__init__ : function(json) {
  g_simple_os = this;
  json = json || {};
  this.apps = {};
  this.on_logout = json.on_logout;
  this.window_list_bar = json.window_list_bar;
  this.task_bar = json.task_bar;
  this.start_button = json.start_button;
  this.skin = json.skin;

  // 重置可显示区域
  Q.workspace = function() {
    var max_width = document.body.clientWidth;
    var max_height = document.body.clientHeight;
    if( document.documentElement.clientWidth) 
      max_width = document.documentElement.clientWidth;
    if( document.documentElement.clientHeight) 
      max_height = document.documentElement.clientHeight;
    max_height = max_height - json.task_bar.offsetHeight;
    return  {width: max_width, height: max_height}
  }

  this._init_menu(json);
  // register window hooks
  register_hook(Q.bind_handler(this, this.wnds_hook));
},

_init_menu : function(json) {
  var _this = this; 
  g_os_start_menu = new class_menu({
    style: "os-start-menu", 
    on_popup: function(popup) {
      if(popup) {
        Q.addClass(_this.start_button, "q-active");
      } else {
        Q.removeClass(_this.start_button, "q-active");
      }
    }
  }); 


  this.start_button.onclick = function() {
    g_os_start_menu.showElement(this);      
  }

  var m1 = new class_menuitem({
    text: "系统设置",
    callback : function(menuitem) {
      if(!g_os_setting) {
        g_os_setting = new Q.Dialog({
          wstyle: json.skin,
          title: "系统设置", width:480, height:370, on_close: function() { delete g_os_setting; g_os_setting=null; }});
      }
      g_os_setting.set_content("test flash");
      g_os_setting.show(true);
      g_os_setting.center(); 
    }
  });

  var m2 = new class_menuitem({text: "程序", popup_style: "os-start-menu"});
  var m3 = new class_menuitem({type: MENU_SEPERATOR, text: ""});
 
  var m4 = new class_menuitem({
    text: "注销", 
    callback : function(menuitem) {
      setTimeout(function() { _this.on_logout()}, 300);
    }
  });
  
  g_os_start_menu.addMenuItem(m1);
  g_os_start_menu.addMenuItem(m2);
  g_os_start_menu.addMenuItem(m3);
  g_os_start_menu.addMenuItem(m4);

  // init applications menus
  for(var i=0; i < json.apps.length; i++) {
    var app = json.apps[i];
    var m2x = new class_menuitem({
      text: app.name,
      callback : (function(app_info) { return function(menuitem) {
        _this.run(app_info);
      }})(app),
    });
    m2.addSubMenuItem(m2x);
  }

  g_os_start_menu.hide();
},

wnds_hook : function(hwnd, message_id) {
  switch(message_id) {
  case MESSAGE.CREATE:
    {
      var _this = this;
      var button = document.createElement('button');
      button.className = "item";
      button.innerText = $GetTitleText(hwnd);  
      button.bind_data = hwnd;  
      button.onclick = function(wnd, btn){ 
        return function() {
          var nodes = _this.window_list_bar.childNodes;
          for(var i=0; i < nodes.length; i++) {
            var item = nodes[i];
            item.className = "item";
          }
          btn.className = "selected-item";
          $BindWindowMessage(wnd, MESSAGE.ACTIVATE)();
        }; 
      }(hwnd, button);
      this.window_list_bar.appendChild(button);
    }
    break;
  case MESSAGE.ACTIVATE:
    {
      var nodes = this.window_list_bar.childNodes;
      for(var i=0; i < nodes.length; i++) {
        var item = nodes[i];
        if(item.bind_data == hwnd) {
          item.className="selected-item";
        } else {
          item.className = "item";
        }
      }
    }
    break;

  case MESSAGE.CLOSE:
    {
      var nodes = this.window_list_bar.childNodes;
      for(var i=0; i < nodes.length; i++) {
        var item = nodes[i];
        if(item.bind_data == hwnd) {
          item.onclick = null;
          item.parentNode.removeChild(item);
        }
      }
    }
    break;
  } // end switch
},  // function wnds_hook

each_apps : function (f) {
  for(var id in this.apps) {
    if(!f(this.apps[id]))
      break;
  }
},

run_error: function (app, err) {
  var dialog = new Q.Dialog({
    wstyle: this.skin + " q-attr-with-bottom",
    width: 500, height: 200,
    title: "ERROR",
    content: "<div style=\"margin: 20px;line-height: 30px;word-break:break-all;\">"+err+"</div>",
    buttons: [
      {text: "关闭", onclick: function() { return true; }}
    ]
  });

  dialog.show(true);
  dialog.center();
},

destroy_instance : function(id) {
  Q.printf(this.apps);
  Q.printf("appid->"+id+" to delete")
  delete this.apps[id];
  Q.printf(this.apps);
},

create_instance : function(app) { 
  var instance = null;
  if(app.single && app.klass) {
    this.each_apps(function(a) {
      if(a instanceof app.klass) {
        instance = a;
        a.__active__();
        return false;
      }
      return true;
    })
  }
  
  if(!instance) {
    var _this = this;
    instance = new app.klass({ui: app.ui_runtime});
    instance.__exit__ = function() {
      Q.printf("app "+ app.name + " is exit.");
      _this.destroy_instance(this.id);
      this.end();
    }
    this.apps[instance.id] = instance;
  }
 
  return instance;
},

// run app
run :function (app) {
  var _this = this;
  var err = "Application [" + app.name + "] is run failed.";
  if(app.klass) {
    // app class have loaded
    try {
      _this.create_instance(app);
      Q.printf("create app ok");
    } catch(e) {
      _this.run_error(app, err + "<br>" + e.description);
    }
  } else {
    var app_class = null;
    window._entry = function(t) { app_class = t; }
    Q.load_module(app.src, function(ok) {
      if(!ok) {
        _this.run_error(app, err + "<br>" + " File("+app.src+") is error.");
        return;
      }
      
      Q.printf("load from file and create app ok");
      app.klass = app_class;
      // load ui
      app.ui_runtime = new Q.ui({src: app.ui, oncomplete: function(ok) {
        // init app instance
        Q.printf("load ui -> " + (ok?"ok":"failed"));
        try {
          _this.create_instance(app); 
        } catch(e) {
          _this.run_error(app, err + "<br>" + e.description);
        }
      }});
    })
  };
}

});


function get_app(id) {
  if(g_simple_os)
    return g_simple_os.apps[id];

  return null;
}


