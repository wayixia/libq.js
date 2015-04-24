/*-------------------------------------------------------
 $ name:  loader
 $ function: Q frame work do some initialize
 $ date: 2011-4-6
 $ author: lovelylife
---------------------------------------------------------*/

// 初始化 Javascript Loader
(function() {
  window.undefined = window.undefined;
  // check the name is used
  if(window.Q) {
    alert('conflict name for Q');
    return;
  }
    
  // QLib base dir
  var _libdir = null;
  // dom elements cache
  var _domcache = {};    
  // on_page_load Message Queue
  var _on_page_load = [];
  // QueryString
  var _querystring = {};

  // LoadCompleted
  var _LoadCompleted = false;
  var _delayDOMReady = [];

  // string prototype
  String.prototype.trim      = function() { return this.replace(/(^\s*)|(\s*$)/g, ""); }
　String.prototype.trim_left = function() { return this.replace(/(^\s*)/g,""); }
  String.prototype.trim_right= function() { return this.replace(/(\s*$)/g,""); }

  // fix Object.create not defined error 
  if (!Object.create) {
    Object.create = function(proto, props) {
      if (typeof props !== "undefined") {
        throw "The multiple-argument version of Object.create is not provided by this browser and cannot be shimmed.";
    }
    function ctor() { }
      ctor.prototype = proto;
      return new ctor();
    };
  }
 
  // 基于prototype的继承实现
  // 警告：调用父类的（被重载的）同名函数调用需要借助parent_class.prototype.method.call(this, arguments);
  var CLASS = function() {};
  CLASS.prototype.extend = function(props) {
    var parent_class = this.prototype;  
    var this_class = function() {
      this.__init__.apply(this, arguments);
    };
    // sub class -> parent class 
    this_class.prototype = Object.create(parent_class);
    
    // copy properties
    for(var name in props) {
      this_class.prototype[name] = props[name];  
    }
    this_class.prototype.constructor = this_class;
    this_class.extend = parent_class.extend;

    return this_class;
  }

  CLASS.extend = function(props) {
    return this.prototype.extend.call(this, props);
  }

  var Q = CLASS;
  window.Q = Q;
  
  Q.Browser = {};
  Q.ELEMENT_NODE = 1;
  Q.ELEMENT_TEXTNODE = 3;

  // default ie mouse button
  Q.LBUTTON  = 1;
  Q.RBUTTON  = 2;
  Q.MBUTTON  = 4;

  // debug
  Q._DEBUG    = {
    enable: false,    // 开启debug功能
    stdoutput: null    // 输出
  };

  // enable/disable debug
  Q.setdebug = function(output) { Q._DEBUG.stdoutput = output; }

  // print debug info to 'stdoutput' element
  Q.printf = function(message) {
    if(Q._DEBUG.stdoutput) {
      Q._DEBUG.stdoutput.innerHTML += '<br/>'+message;
      Q._DEBUG.stdoutput.scrollTop = Q._DEBUG.stdoutput.scrollHeight;
    } else {
      //if(console && console.log)
      //  console.log(message);
    }
  };

  // get Element from dom cache if exists
  Q.$ = function(id, bOverride) {
    if(typeof(id) != 'string') { return id; }
    var element = null;
    if(!_domcache[id] || bOverride) {
      element = document.getElementById(id);
      if(element) {
        _domcache[id] = element;
      }
    } else {
      element = _domcache[id];
    }
    return element;
  };

  Q.bind_handler = function(object, func) {
    return function() {
      return func.apply(object, arguments);
    };
  };

  Q.registerDelayDOMReady = function(f) {
    if(!_LoadCompleted) {
      _delayDOMReady.push(f);
    }
  };

  // 兼容ff的attachEvent接口
  Q.addEvent = function(obj, evtName, fnHandler, useCapture) {
    obj = Q.$(obj);
    if(obj.addEventListener) {
      obj.addEventListener(evtName, fnHandler, !!useCapture);
    } else if(obj.attachEvent) {
      obj.attachEvent('on'+evtName, fnHandler);
    } else {
      oTarget["on" + evtName] = fnHandler;
    }
  };

  Q.removeEvent = function(obj, evtName, fnHandler) {
    obj = Q.$(obj); 
    if (obj.removeEventListener) {
      obj.removeEventListener(evtName, fnHandler, false);
    } else if (obj.detachEvent) {
      obj.detachEvent("on" + evtName, fnHandler);
    } else { 
      obj["on" + evtName] = null;
    }
  };

  Q.addClass = function(element, new_class) {
    var arr = (element.className+" "+new_class).trim().split(/\s+/);
    var class_name = '';
    var collections = {};
    for(var i=0; i<arr.length; i++) 
      collections[arr[i]] = 0;
    for(var key in collections) 
      class_name += key + ' ';
    element.className = class_name.trim();
    return element;
  }

  Q.removeClass = function(element, remove_class) {
    var arr = (element.className+'').split(/\s+/);
    var arr2= (remove_class+'').split(/\s+/);
    var arr3= [];
    for(var i=0;i < arr.length; i++) {
      var remove = false;
      for(var j=0; j< arr2.length; j++) {
        if(arr[i] == arr2[j])
          remove = true;
      }
      if(!remove)
        arr3.push(arr[i]);
    }    
    element.className = arr3.join(' ');
    return element;
  }

  Q.hasClass = function(element, class_name) {
    var class_names = (element.className+" ").split(/\s+/);
    for(var i=0;i < class_names.length; i++) {
      if(class_names[i] == class_name) {
        return true;
      }
    }

    return false;
  }

  // default locale_text
  Q.locale_text = function(lang, default_value) {
    return default_value;
  }
  
  Q.set_locale_text = function(fn) {
    if(typeof fn == 'function') {
      Q.locale_text = fn;
    }
  }

  // 获取element的绝对位置
  Q.absPosition = function(element) {
    var left = 0;
    var top = 0;
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    do{
      top += element.offsetTop || 0;
      left += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    
    return { width : width, height : height,  left : left,  top : top  };
  }

  Q.absPositionEx = function(element) {
    var rect = element.getBoundingClientRect();
    var l= rect.left+document.documentElement.scrollLeft;
　　var t =rect.top+document.documentElement.scrollTop;
    var w =rect.width;
    var h =rect.height;

    return { width : w, height : h,  left : l,  top : t  };
  }

  // get scroll info
  Q.scrollInfo = function() {
    var t, l, w, h;
    if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft) ) { 
      t = document.documentElement.scrollTop;
      l = document.documentElement.scrollLeft; 
      w = document.documentElement.scrollWidth;         
      h = document.documentElement.scrollHeight;     
    } else if (document.body) {         
      t = document.body.scrollTop;         
      l = document.body.scrollLeft;
      w = document.body.scrollWidth;         
      h = document.body.scrollHeight;     
    }
    return { t: t, l: l, w: w, h: h };
  };

  Q.copy = function(src_object) {
    var target_object = {}; 
    for(var name in src_object) {
      target_object[name] = src_object[name];
    }
    return target_object;
  };

  // get querystring
  Q.GET = function(key) { return _querystring[key]; };
  
  // OnLoad
  Q.DOMReady = function(evt) {
    if(!_LoadCompleted) {
      Q.registerDelayDOMReady(Q.delayDOMReady);
    } else {
      Q.delayDOMReady();
    }        
  };
  
  // 当所有脚本都加载后开始执行Ready回调
  Q.delayDOMReady = function() {
    while(_on_page_load.length > 0) { _on_page_load.shift()(); }
  };

  // push event when document loaded
  Q.Ready = function(f, push_front) {
    var back = !push_front;
    if(back)
      _on_page_load.push(f); 
    else 
      _on_page_load.unshift(f); 
  };

  // current Q.js所在路径
  Q.__DIR__ = function() {
    var js=document.scripts;
    js=js[js.length-1].src.substring(0,js[js.length-1].src.lastIndexOf("/")+1);
    return js;
  };

  Q.load_module = function(src, oncomplete) {
    var header = document.getElementsByTagName("head")[0];
    var s = document.createElement("script");  
    s.type = "text/javascript";
    s.src = src;
    // 对于IE浏览器，使用readystatechange事件判断是否载入成功  
    // 对于其他浏览器，使用onload事件判断载入是否成功  
    s.done = false;
    s.onload = s.onreadystatechange = (function() {
      if( !this.done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete"))
      {
        this.done = true;
        oncomplete(true);
        this.onload = this.onreadystatechange = null; // Handle memory leak in IE
        header.removeChild( this );
      }
    });
    
    s.onerror = (function() { 
      // Handle memory leak in IE
      this.onload = this.onreadystatechange = null;
      header.removeChild(this); 
      oncomplete(false);
    });
        
    // 获取head结点，并将<script>插入到其中  
    header.appendChild(s);
  }
  // Javascript Loader
  function jsloader() {
    var scripts = document.getElementsByTagName("script");  
    // 判断指定的文件是否已经包含，如果已包含则触发onsuccess事件并返回  
    var libscript = null;
    for (i = 0; i < scripts.length; i++) {
      if(scripts[i].src) {
        var pos = -1;
        if((pos=scripts[i].src.indexOf('/Q.js')) >= 0) {
           _libdir = scripts[i].src.substring(0, pos);
           libscript = scripts[i];
        }
      }
    }

    // 解析script import
    var sImports = libscript.innerHTML;
    var re = /\n/ig;
    var arr = sImports.split(re);

    // 异步顺序加载
    async_load_js(document.getElementsByTagName("head")[0], arr);        
  };

  // 顺序加载js文件
  function async_load_js(header, ar) {
    ar = ar||[];
    if(ar.length<=0) { 
      _LoadCompleted = true;
      while(_delayDOMReady.length > 0) { _delayDOMReady.shift()(); }
      return;
    }
    
    // 加载lib
    var url = ar.shift();
    // 解析格式，并自动加载库文件
    var re2 = /^\s*import\s+(.+);/i;
    if(re2.test(url)) {
      url = RegExp.$1 + '';
      url = url.replace(/\./g, '/')+'.js';
      Q.load_module(_libdir+'/'+url, function(isok) {
        async_load_js(header, ar);
      });
    } else {
      async_load_js(header, ar);
    }
  }

  // get Browser
  Q.agent   = function() { return navigator.userAgent.toLowerCase(); }
  Q.isW3C   = function() { return document.getElementById ? true:false; }
  Q.isIE    = function() { var a = Q.agent(); return ((a.indexOf("msie") != -1) && (a.indexOf("opera") == -1) && (a.indexOf("omniweb") == -1)); }
  Q.isOpera = function() { return Q.agent().indexOf("opera") != -1; }
  Q.isNS6   = function() { return Q.isW3C() && (navigator.appName=="Netscape"); }

  // get Browser
  //为Firefox下的DOM对象增加innerText属性
  if(Q.isNS6()) { //firefox innerText define
    HTMLElement.prototype.__defineGetter__("innerText",    function() { return this.textContent; });
    HTMLElement.prototype.__defineSetter__("innerText",    function(sText) { this.textContent=sText; });
    HTMLElement.prototype.__defineGetter__("currentStyle", function () { return this.ownerDocument.defaultView.getComputedStyle(this, null); });
    // 兼容ff，ie的鼠标按键值
    Q.LBUTTON  = 0;
    Q.MBUTTON  = 1;
  }
    
  // 解析地址页面的查询字段
  var query = location.search.slice(1).split('&');
  for(var i=0; i < query.length; i++) {
    var values = query[i].split('=');
    _querystring[values[0]] = values[1];
  }

  jsloader();
  Q.addEvent(window, 'load', Q.DOMReady);  
})();
