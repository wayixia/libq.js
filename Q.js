
/**
 * Simple wrapper of common function and async load js module
 * @namespace Q
 * @author Q
 */

// 初始化 Javascript Loader
(function() {
  window.undefined = window.undefined;
  // check the name is used
  if(window.Q) {
    alert('conflict name for Q');
    return;
  }
    
  /** QLib base dir */
  var _libdir = null;
  // dom elements cache
  var _domcache = {};    
  // on_page_load Message Queue
  var _on_page_load = [];
  // QueryString
  var _querystring = {};
  /** 调试输出 */
  var _debug = null;

  // LoadCompleted
  var _LoadCompleted = false;
  var _delayDOMReady = [];

  // string prototype
  String.prototype.trim      = function() { 
    return this.replace(/(^\s*)|(\s*$)/g, ""); 
  }
　String.prototype.trim_left = function() { 
    return this.replace(/(^\s*)/g,""); 
  }
  String.prototype.trim_right= function() { 
    return this.replace(/(\s*$)/g,""); 
  }

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
  
  /** 类继承方法 
   * @function Q.extend
   * @param props {object} - 派生类的属性
   * @return {CLASS} 返回派生类
   */
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

  /** 开启关闭调试功能
   *
   * @function Q.setdebug
   * @param output {dom} - 调试信息输出容器, 如果为null，则关闭调试
   * @return 无
   */
  Q.setdebug = function(output) { _debug = output; }

  /** 打印调试日志信息
   * 
   * @function Q.printf
   * @param message {string} - 日志消息
   * @return 无
   */ 
  Q.printf = function(message) {
    if(_debug && _debug.nodeType === Q.ELEMENT_NODE) {
      _debug.innerHTML += '<br/>'+message;
      _debug.scrollTop = _debug.scrollHeight;
    } else {
    }
  };

  /** 获取网页元素DOM对象
   *
   * @function Q.$
   * @param id {string|dom} - 网页元素id或者dom对象
   * @param override {bool} - 是否覆盖缓存，一般情况这个参数可以忽略
   * @return element {dom} - 网页元素或者null
   */
  Q.$ = function(id, override) {
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

  /** 调用类实例和类函数绑定，返回新的函数对象
   *
   * @function Q.bind_handler
   * @param object {object} - 类实例 
   * @param fn {function} - 类方法
   */
  Q.bind_handler = function(object, fn) {
    return function() {
      return fn.apply(object, arguments);
    };
  };

  Q.registerDelayDOMReady = function(f) {
    if(!_LoadCompleted) {
      _delayDOMReady.push(f);
    }
  };

  /** 兼容ff的attachEvent接口
   *
   * @function Q.addEvent
   * @param element {dom} - 绑定事件的网页元素 id或者dom对象
   * @param evtName {string} - 绑定事件名称，不需要'on'前缀
   * @param fnHandler {function} - 事件处理回调函数
   * @param useCapture {bool} -  是否使用捕捉, 一般使用false
   * @return 无
   */
  Q.addEvent = function(element, evtName, fnHandler, useCapture) {
    var obj = Q.$(element);
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

  /** 动态添加网页元素的CSS样式
   *
   * @function Q.addClass
   * @param element {dom} - 网页元素
   * @param new_class {string} - 新的CSS样式，使用空格分割多个样式
   * @return element {dom} - 返回当前网页元素
   */
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

  /** 动态删除网页元素的CSS样式
   *
   * @function Q.removeClass
   * @param element {dom} - 网页元素
   * @param remove_class {string} - 删除的CSS样式，使用空格分割多个样式
   * @return element {dom} - 返回当前网页元素
   */
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

  /** 网页元素是否包含CSS样式
   *
   * @function Q.hasClass
   * @param element {dom} - 网页元素
   * @param class_name {string} - CSS样式名称，单个名称
   * @return exists {bool} - true 存在， false 不存在
   */
  Q.hasClass = function(element, class_name) {
    var class_names = (element.className+" ").split(/\s+/);
    for(var i=0;i < class_names.length; i++) {
      if(class_names[i] == class_name) {
        return true;
      }
    }

    return false;
  }

  /** i18n 多语言实现默认实现，直接返回默认值
   *
   * @function Q.locale_text
   * @param message_id {string} - 多语言消息标识
   * @param default_value {string} - 默认值 
   * @return {string} - 多语言值
   */
  Q.locale_text = function(message_id, default_value) {
    return default_value;
  }
 
  /** i18n 设置多语言适配接口 
   *
   * @function Q.set_locale_text
   * @param fn {function} - 适配函数
   * @return 无
   */
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
    var w =rect.right-rect.left;
    var h =rect.bottom-rect.top;

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
    var js = "";
    var scripts = document.getElementsByTagName("script");  
    // 判断指定的文件是否已经包含，如果已包含则触发onsuccess事件并返回  
    for (i = 0; i < scripts.length; i++) {
      if(scripts[i].src) {
        var src = scripts[i].src;
        if(/\/Q\.js$/.test(src)) {
          js = src.substring(0, src.lastIndexOf('/'));
          break;
        }
      }
    }
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
        var src = scripts[i].src;
        if(/\/Q\.js$/.test(src)) {
          _libdir = src.substring(0, src.lastIndexOf('/'));
          libscript = scripts[i];
          break;
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
  Q.agent   = function() { 
    return navigator.userAgent.toLowerCase(); 
  }
  Q.isW3C   = function() { 
    return document.getElementById ? true:false; 
  }
  Q.isIE    = function() { 
    var a = Q.agent(); 
    return ((a.indexOf("msie") != -1) && (a.indexOf("opera") == -1) && (a.indexOf("omniweb") == -1)); 
  }
  Q.isOpera = function() { 
    return Q.agent().indexOf("opera") != -1; 
  }
  Q.isNS6   = function() { 
    return Q.isW3C() && (navigator.appName=="Netscape"); 
  }

  // get Browser
  //为Firefox下的DOM对象增加innerText属性
  if(Q.isNS6()) { //firefox innerText define
    HTMLElement.prototype.__defineGetter__("innerText",    function() { 
      return this.textContent; 
    });
    HTMLElement.prototype.__defineSetter__("innerText",    function(sText) { 
      this.textContent=sText; 
    });
    HTMLElement.prototype.__defineGetter__("currentStyle", function () { 
      return this.ownerDocument.defaultView.getComputedStyle(this, null); 
    });
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
