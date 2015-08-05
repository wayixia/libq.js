
/**
 * 常用dom操作和异步加载javascript模块的封装, 支持继承
 * @author Q
 * @version 1.0
 */

(function() {
  window.undefined = window.undefined;
  // check the name is used
  if(window.Q) {
    alert('conflict name for Q');
    return;
  }
    
  /** 调试输出 */
  var _debug = null;
  /** dom elements cache */
  var _domcache = {};    
  /** QueryString */
  var _querystring = {};
  /**  on_page_load Message Queue */
  var _on_page_load = [];

  // string prototype
  String.prototype.trim = function() { 
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
        throw "The multiple-argument version of Object.create is not provided";
    }
    function ctor() { }
      ctor.prototype = proto;
      return new ctor();
    };
  }

  /** 
   * 基于prototype的继承实现, 调用父类的（被重载的）同名函数调用需要借助
   * 
   ```
   parent_class.prototype.method.call(this, arguments);
   ```
   * @namespace Q
   */
  var Q = function() {};
  Q.prototype.extend = function(props) {
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
  
  /**
   * 类继承方法 
   * @function Q.extend
   * @param props {object} - 派生类的属性
   * @return {class} 返回派生类
   * 
   * @example <caption>派生一个新的class</caption>
var subclass = Q.extend({
  __init__ : function(json) {
   // 构造函数
  }
});
   */
  Q.extend = function(props) {
    return this.prototype.extend.call(this, props);
  }

  window.Q = Q;
 
  /** 
   * DOM 元素节点类型 
   * @const {number} Q.ELEMENT_NODE
   */
  Q.ELEMENT_NODE = 1;

  /** 
   * DOM 文本节点类型 
   * @const {number} Q.ELEMENT_TEXTNODE
   */
  Q.ELEMENT_TEXTNODE = 3;


  /** 
   * 鼠标左键
   * @const {number} Q.LBUTTON
   */
  Q.LBUTTON  = 1;
  
  /** 
   * 鼠标右键 
   * @const {number} Q.RBUTTON
   */
  Q.RBUTTON  = 2;
  
  /** 
   * 鼠标滚轮 
   * @const {number} Q.MBUTTON
   */
  Q.MBUTTON  = 4;

  /** 开启关闭调试功能
   *
   * @function Q.setDebug
   * @param output {dom} - 调试信息输出容器, 如果为null，则关闭调试
   * @return 无
   */
  Q.setDebug = function(output) { _debug = output; }

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
      if(window.console)
        window.console.log(message);
    }
  };

  /** 获取网页元素DOM对象
   *
   * @function Q.$
   * @param id {string|dom} - 网页元素id或者dom对象
   * @return element {dom} - 网页元素或者null
   */
  Q.$ = function(id) {
    if(typeof(id) != 'string') { return id; }
    if(id && id.nodeType === Q.ELEMENT_NODE)
      return id;
    var element = _domcache[id];
    if(!element || (element.parentElement === null)) {
      element = document.getElementById(id);
      if(element) {
        _domcache[id] = element;
      }
    }
    
    return element;
  };

  /** 调用类实例和类函数绑定，返回新的函数对象
   *
   * @function Q.bind_handler
   * @type {function}
   * @param object {object} - 类实例 
   * @param fn {function} - 类方法
   */
  Q.bind_handler = function(object, fn) {
    return function() {
      return fn.apply(object, arguments);
    };
  };

  /** 兼容ff的attachEvent接口
   *
   * @function Q.addEvent
   * @param element {dom} - 绑定事件的网页元素 id或者dom对象
   * @param evtName {string} - 事件名称，不需要'on'前缀
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

  /** 删除网页元素的绑定事件
   *
   * @function Q.removeEvent
   * @param element {dom|string} - 网页元素
   * @param evtName {string} - 事件名称，不需要'on'前缀
   * @param fnHandler {function} - 事件处理回调函数
   * @return 无
   */
  Q.removeEvent = function(element, evtName, fnHandler) {
    obj = Q.$(element); 
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

  /** 网页元素绑定click和dblclick事件， 解决click和dblclick同时触发的冲突
   *
   * @function Q.click
   * @param element {dom} - 网页元素
   * @param click {function} - 单击事件处理函数
   * @param dblclick {function} - 双击事件处理函数
   * @return 无
   */
  Q.dblclick = function(element, dblclick) {
    element = Q.$(element);
    Q.addEvent(element, 'click', (function(r) { return function(evt) {
    if(r.__clickonce__) {
      r.__clickonce__ = false;
      clearTimeout(r.t);
      if(dblclick)
        dblclick(r);
    } else {
      r.__clickonce__ = true;
      r.t = setTimeout((function(b) { return function() { 
      b.__clickonce__ = false; 
      if(click) 
        click(r); 
    }})(r), 200);
    }
    return false;
  }})(element));
 
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

  /** 获取element的绝对位置 
   * 
   * @function Q.absPosition
   * @param element {dom} - 网页元素对象
   * @return {object} width 宽度, height 高度, left 绝对位置的水平定点位置， top 绝对位置的垂直定点位置
   * 
   */
  Q.absPosition = function(element) {
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var t = element.offsetTop;
    var l = element.offsetLeft;
    while( element = element.offsetParent) {
      t+=element.offsetTop;
      l+=element.offsetLeft;
    }
    return { width : w, height : h,  left : l,  top : t  };
  };

  
  /** 获取element的绝对位置, 包含边框宽度
   * 
   * @function Q.absPositionEx
   * @param element {dom} - 网页元素对象
   * @return {object} width 宽度, height 高度, left 绝对位置的水平定点位置， top 绝对位置的垂直定点位置
   * 
   */
  Q.absPositionEx = function(element) {
    var rect = element.getBoundingClientRect();
    var l= rect.left+document.documentElement.scrollLeft;
    var t =rect.top+document.documentElement.scrollTop;
    var w =rect.width;
    var h =rect.height;

    return { width : w, height : h,  left : l,  top : t  };
  }

  /** 获取滚动条信息 
   *
   * @function Q.scrollInfo
   * @return {object} - t 垂直滚动条top位置，l 水平滚动条left位置， w 网页宽度包含隐藏部分， h 网页高度包含隐藏部分
   * 
   */
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

  /**
   * @typedef size {object} 
   * @property width {number} - 宽度
   * @property height {number} - 高度
   */
  /** 获取和设置工作区大小，作用于右键菜单和窗口系统
   * @function Q.workspace
   * @return {size} 工作区大小
   */
  Q.workspace = function() {
    var max_height = document.body.clientHeight;
    if( document.documentElement.clientHeight) {
      max_height = document.documentElement.clientHeight;
    }
  
    var max_width = document.body.clientWidth;
    if( document.documentElement.clientWidth) {
      max_width = document.documentElement.clientWidth;
    }
   
    return  {width: max_width, height: max_height}
  }, 

  /** Object对象拷贝
   * 
   * @function Q.copy
   * @param src_object {object} - 源对象
   * @return {object} - 目标对象
   */
  Q.copy = function(src_object) {
    var target_object = {}; 
    for(var name in src_object) {
      target_object[name] = src_object[name];
    }
    return target_object;
  };

  /** 获取url查询字段
   * 
   * @function Q.query
   * @param key {string} - 字段名称
   * @return {string} - 字段值
   */
  Q.query = function(key) { return _querystring[key]; };
  
  /** 当所有脚本都加载后开始执行Ready回调 */
  Q.delayDOMReady = function() {
    while(_on_page_load.length > 0) { _on_page_load.shift()(); }
  };

  /**
   * 注册函数，当文档加载完成后依次执行
   * 
   * @function
   * @param f {function} - 函数对象
   * @param front {bool} - 追加或者置顶 
   */
  Q.ready = function(f, front) {
    var back = !front;
    if(back)
      _on_page_load.push(f); 
    else 
      _on_page_load.unshift(f); 
  };

  /** 加载js模块
   *
   * @function Q.loadModule
   * @param src {string} - javascript模块地址
   * @param oncomplete(bool) {function} - 加载完成调用， ok 为true 加载成功，否则失败
   */
  Q.loadModule = function(src, oncomplete) {
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

  /** 获取浏览器客户端版本信息 
   *
   * @function Q.agent
   * @return {string} 浏览器版本信息
   */
  Q.agent   = function() { 
    return navigator.userAgent.toLowerCase(); 
  }

  /** 客户端是不是标准的W3C客户端 
   *
   * @function Q.isW3C
   * @type {boolean}
   */
  Q.isW3C   = function() { 
    return document.getElementById ? true:false; 
  }

  /** 客户端是否是Internet Explorer 
   *
   * @function Q.isIE
   * @return  {bool} - true 是， false 否 
   */
  Q.isIE    = function() { 
    var a = Q.agent(); 
    return ((a.indexOf("msie") != -1) && (a.indexOf("opera") == -1) && (a.indexOf("omniweb") == -1)); 
  }


  /** 客户端是否是Opera 
   *
   * @function Q.isOpera
   * @return  {bool} - true 是， false 否 
   */
  Q.isOpera = function() { 
    return Q.agent().indexOf("opera") != -1; 
  }
  
  /** 客户端是否是Netscape 
   *
   * @function Q.isNS6
   * @return  {bool} - true 是， false 否 
   */
  Q.isNS6   = function() { 
    return Q.isW3C() && (navigator.appName=="Netscape"); 
  }

  // get Browser
  //为Firefox下的DOM对象增加innerText属性
  if(Q.isNS6()) { //firefox innerText define
    HTMLElement.prototype.__defineGetter__("innerText", function() { 
      return this.textContent; 
    });
    HTMLElement.prototype.__defineSetter__("innerText", function(sText) { 
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
  
  var tmr = setInterval( ( function( t, r ) { return function() {
    if( document.readyState == 'complete' ) {
      t.loaded = true;
      Q.delayDOMReady();
      clearInterval( r );
    }
  } } )( Q, tmr ), 100 );
  Q.addEvent(window, 'load', function(evt) {
    if( !Q.loaded ) {
      Q.loaded = true;
      Q.delayDOMReady();
    }
  } );
})();
