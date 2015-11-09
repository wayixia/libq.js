
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
/**
 * 常用的数据结构封装， 双向链表和哈希表
 */


/**
 * 双向链表
 * @constructor 
 * @property {Q.List.Node} head -  链表的头部
 * @property {number} length -  链表长度
 */
Q.List = Q.extend({
head : null,  
length : 0,
__init__ : function() {},
/**
 * 节点结构
 * @class Q.List.Node
 * @property {Q.List.Node} next - 下一个节点
 * @property {Q.List.Node} prev - 上一个节点
 * @property {any} next  - 绑定的数据
 * @param data {any} - 绑定的数据
 */
Node : function(data) {
  this.next = null;
  this.prev = null;
  this.data = data;
},

/** 
 * 获取链表开始节点 
 * @memberof Q.List.prototype
 * @type {Q.List.Node}
 * @return {Q.List.Node} - head节点， 如果为null，则说明链表为空
 */
begin : function() {  
  return this.head; 
}, 

/** 
 * 获取链表结尾节点， 返回默认null 
 * @memberof Q.List.prototype
 * @return {null} 总是返回空节点
 */
end : function() {  
  return null;  
},

/** 
 * 返回链表长度 
 * @memberof Q.List.prototype
 * @type {number}
 * @return {number}  链表长度 
 */
size : function() {
  return this.length;
},

/**
 * 获取当前遍历位置的节点数据
 * @memberof Q.List.prototype
 */
item : function() {
  return this.current.data; 
},

/**
 * 遍历链表元素回调函数
 * @callback Q.List.each_handler
 * @param data {any} - 节点的data
 * @return {bool} 返回结果决定是否继续遍历: true 继续遍历,  false 停止遍历
 */

/** 
 * 遍历链表元素
 * @memberof Q.List.prototype
 * @param fn {Q.List.each_handler} - 回调函数
 */
each : function(fn) {
  if(typeof fn == 'function') {
    for(var node = this.begin(); node != this.end(); node = node.next) {
      if(!fn(node.data)) break;
    }
  }
},

/**
 * 在链表末尾追加一个{@link Q.List.Node}节点
 * @memberof Q.List.prototype
 * @param data {any} - 绑定的数据
 */
append : function(data) {
  var node = new this.Node(data);
  if(!this.head) {
    this.head = node;
  } else {
    var tmp = this.head;
    while(tmp.next) { tmp = tmp.next; }
    tmp.next = node;
    node.prev = tmp;
  }

  this.length++;
},

/**
 * 删除链表的一个节点
 * @memberof Q.List.prototype
 * @param data {any} - 指定的数据
 */
erase : function(data){
  var node = this.find(data);
  if( node ) { 
    if(node != this.head) {
      if(node.prev)
        node.prev.next = node.next;
      if(node.next)
        node.next.prev = node.prev;
    } else {
      this.head = node.next;
      if(node.next) {
        node.next.prev = null;
      }
    }

    delete node;
    this.length--;
  }
},

/**
 * 清空链表
 * @memberof Q.List.prototype
 */
clear : function(){
  for(var node = this.begin(); node != this.end(); node = node.next){
    this.removeNode(node);
  }
},

/**
 * 查找data所在的节点
 * @type {Q.List.Node}
 * @memberof Q.List.prototype
 * @param data {any} - 指定查询的数据
 * @return {Q.List.Node} 节点不存在则返回null
 */
find : function(data){
  for(var node = this.begin(); node != this.end(); node = node.next){
    if( node.data == data )  return node;
  }
  return null;
}
  
});

/**
 * 哈希表类封装，提供添加删除遍历查找等操作
 * @constructor
 * @property base {Object} - 存储对象
 * @property length {number} - 元素个数
 * @property dataIndex {number} - 数据项索引, 初始值 0
 */
Q.HashMap = Q.extend({
base : null,
length : 0,
index : 0,
__init__ : function() {
  this.base = new Object();
},
  
/**
 * 遍历哈希表元素回调函数
 * @callback Q.HashMap.each_handler
 * @param data {any} - 节点的data
 * @param key  {any} - 节点索引关键字
 * @return {bool} 返回结果决定是否继续遍历: true 继续遍历,  false 停止遍历
 */

/** 
 * 遍历哈希表元素
 * @memberof Q.HashMap.prototype
 * @param fn {Q.HashMap.each_handler} - 回调函数
 */
each : function(fn) {
  if(typeof fn != 'function') 
    return;
  for(var key in this.base) {
    if(fn(this.base[key], key) == 0) 
      break;
  }
},

/**
 * 获取指定索引的对象
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @return {any} 返回指定索引项的值
 */
item : function(index) {
  return this.base[index];
},

/**
 * 添加项
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @param value {any} 值
 * @return 无
 */
add : function(index, value) {
  this.base[index] = value;
  this.length++;
},
 
/**
 * 删除指定索引项
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 */
remove : function(key) {
  if(!this.has(key)) { return; }
  delete this.base[key];
  this.length--;
},

/**
 * 清空哈希表
 * @memberof Q.HashMap.prototype
 */
clear : function() {
  var _this = this;
  this.each(function(item, key){
    _this.remove(key);
  });
  this.length = 0;
},
  
/**
 * 添加项，自动索引
 * @memberof Q.HashMap.prototype
 * @param value {any} 数据
 */
push : function(value) {
  this.base[this.index] = value;
  this.length++;
  this.index++;
},
  
/**
 * 删除最后一个数字索引项
 * @memberof Q.HashMap.prototype
 */
pop : function() {
  var re = this.base[this.dataIndex];
  delete this.base[this.dataIndex];
  this.length--;
  return re;
},
  
/**
 * 查找value对应的索引
 * @memberof Q.HashMap.prototype
 * @param value {value} 值
 * @return {number|string} 索引
 */
find : function(value) {
  var vkey = null;
  this.each(function(item, key){
    if(item == value) {
      vkey = key;
      return 0;
    }
  });
  return vkey;
},
  
/**
 * 查找索引项是否存在
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @return {bool} 该项是否存在
 */
has : function(key) {
  return !(typeof this.base[key] === 'undefined');
}
});
/*-------------------------------------------------------
  function Tween
  date: 2013-01-30
  author: lovelylife
  tween 算法来源：http://www.robertpenner.com/easing/
---------------------------------------------------------*/

var Tween = {
	Linear: function(t,b,c,d){ return c*t/d + b; },
	Quad: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		}
	},
	Cubic: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		}
	},
	Quart: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return -c * ((t=t/d-1)*t*t*t - 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
			return -c/2 * ((t-=2)*t*t*t - 2) + b;
		}
	},
	Quint: {
		easeIn: function(t,b,c,d){
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOut: function(t,b,c,d){
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		}
	},
	Sine: {
		easeIn: function(t,b,c,d){
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOut: function(t,b,c,d){
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		}
	},
	Expo: {
		easeIn: function(t,b,c,d){
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOut: function(t,b,c,d){
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOut: function(t,b,c,d){
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	Circ: {
		easeIn: function(t,b,c,d){
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		},
		easeOut: function(t,b,c,d){
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
		},
		easeInOut: function(t,b,c,d){
			if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
		}
	},
	Elastic: {
		easeIn: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
		},
		easeInOut: function(t,b,c,d,a,p){
			if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
			if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		}
	},
	Back: {
		easeIn: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOut: function(t,b,c,d,s){
			if (s == undefined) s = 1.70158; 
			if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		}
	},
	Bounce: {
		easeIn: function(t,b,c,d){
			return c - Tween.Bounce.easeOut(d-t, 0, c, d) + b;
		},
		easeOut: function(t,b,c,d){
			if ((t/=d) < (1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if (t < (2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if (t < (2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOut: function(t,b,c,d){
			if (t < d/2) return Tween.Bounce.easeIn(t*2, 0, c, d) * .5 + b;
			else return Tween.Bounce.easeOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	}
}

Q.Animate = Q.extend( {
func : null,
bind : null,
timer: null,
begin: 0,
duration: 0,
max  : 0,
__init__ : function(cfg) {
   var _this = this;
   if(cfg.tween == 'Linear' || !Tween[cfg.tween] ) {
      _this.func = Tween.Linear;
   } else {
      if(Tween[cfg.tween][cfg.ease]) {
	     _this.func = Tween[cfg.tween][cfg.ease];
	  } else {
	     _this.func = Tween[cfg.tween]['easeIn'];
	  }
   }
 
   _this.bind = cfg.bind;
   _this.duration = cfg.duration;
   _this.max = cfg.max;
   _this.begin = cfg.begin;
   

   return this;
},
play : function(){
	var _this = this;
	// var oM = $("idMove").style, oL = $("idLine").style, 
	//var t=0, c=300, d=10;  // d = iDuration
	var t=_this.begin, c=_this.max, d=_this.duration;  // d = iDuration
	// oM.left=oL.left="0px"; 
	clearTimeout(_this._timer);
	function _run(){
		if(t<d){
			t++;
			_this.bind(Math.ceil(_this.func(t,0,c,d)));
			// oM.left = Math.ceil(_this.func(t,0,c,d)) + "px";
			// oL.left = Math.ceil(Tween.Linear(t,0,iChart,d)) + "px";
			_this._timer = setTimeout(_run, 10);
		} else {
			_this.bind(c);
			// oM.left = c + "px";
			// oL.left = iChart + "px";
		}
	}
	_run();
}

});
/*
    http://www.JSON.org/json2.js
    2008-11-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();

/**
 * 生成指定len长度的随机字符串
 * @function
 * @param len {number} - 随机串的长度
 * @return {string} 随机串
 */
Q.rnd = function(len) {
  var str = '';
  var roundArray = 'abcdef1234567890'.split('');
  for(var i=0; i < len; i++) {
    str += '' + roundArray[Math.round( Math.random()* (roundArray.length - 1))];
  }
  return str;
}

/**
 * json2.js 版本的json序列化
 * 将object转成json字符串
 * @function
 * @param jsonObject {object} json对象
 * @return {string} json字符串
 */
Q.json2str = function (jsonObject) {
  return JSON.stringify(jsonObject, function(key, value){return value;});
}

/**
 * 解析json字符串，返回object对象
 * @function
 * @param message {string} json字符串
 * @return {object} javascript 对象
 */
Q.json_decode = function(message) {
  return JSON.parse(message);
}

/**
 * 将json转换成字符串
 * @function
 * @param message {object} javascript对象
 * @return {string} javascript 对象
 */
Q.json_encode = function(v) {
  return JSON.stringify(v);
}


function createAjaxTrans() {
  var transport = null;
  try  {
    transport = new ActiveXObject("Msxml2.XMLHTTP");
  } catch(e){
    try {
      transport = new ActiveXObject("Microsoft.XMLHTTP");
    } catch(sc) {
      transport = null;
    }
  }
  if( !transport && typeof XMLHttpRequest != "undefined" ) {
    transport = new XMLHttpRequest();
  }
    
  return transport;
}

/** ajax请求回调类型
 *
 * @callback ajax_callback
 * @param {Object} xmlhttp - XMLHttpRequest对象
 */

/** 复杂结构ajax请求, 为了处理结构化的请求数据，服务端需要处理postdata字段，并且需要url_decode一次
 * 如果请求字段没有复杂的结构体请使用{@link Q.ajax}
 * @example <caption>PHP服务端处理示例</caption>
 * // 处理客户端请求数据
 * if(isset($_POST['postdata']) {
 *   $postdata = urldecode($_POST['postdata'])
 *   // 重新初始化$_POST
 *   $_POST = json_decode($postdata);
 *   if(!is_array($_POST)) {
 *     $_POST = array();
 *   } 
 * }
 * @function
 * @param {Object} json ajax请求参数
 * @param {string} json.command - 请求url
 * @param {string} [json.method="get"] - ajax请求方法
 * @param {bool}   [json.async=true] - 异步ajax请求
 * @param {*=} json.data - 请求的数据
 * @param {ajax_callback=} json.oncompete - ajax请求完成时的回调
 * @param {ajax_callback=} json.onerror - ajax请求完成时的回调
 * @param {bool=} [json.withCredentials=false] - ajax跨域凭证， 默认false
 */

Q.ajaxc = function(json) {
  newAjax(json, function(data) {
    return "postdata="+encodeURIComponent(encodeURIComponent(Q.json2str(data))); 
  });
}

/** ajax请求
 *
 * @function
 * @param {Object} json ajax请求参数
 * @param {string} json.command - 请求url
 * @param {string} [json.method="get"] - ajax请求方法
 * @param {bool}   [json.async=true] - 异步ajax请求
 * @param {*=} json.data - 请求的数据
 * @param {ajax_callback=} json.oncompete - ajax请求完成时的回调
 * @param {ajax_callback=} json.onerror - ajax请求完成时的回调
 * @param {bool=} [json.withCredentials=false] - ajax跨域凭证， 默认false
 */
Q.ajax = function(json) {
  newAjax(json, function(data) {
    var postdata = null;
    for(var name in data) {
      postdata += encodeURIComponent(name)+'='+encodeURIComponent(data[name])+'&'
    }

    return postdata;
  });
}

function newAjax(json, data_handler) {
  var request = json || {};
  var command = request.command.toString();
  if(command.indexOf('?') == -1) {
    command = command + '?' + '&rnd=' + Q.rnd(16);
  } else {
    command = command + '&rnd=' + Q.rnd(16);
  }

  var method = request.method || "POST";
  method = method.toString().toUpperCase();
  if(method == "GET" || method == "POST") {

  } else {
    method = "GET"
  }

  var xmlhttp = createAjaxTrans();
  var async = true;
  if(request.async) {
    async = !! request.async;
  }

  xmlhttp.open(method, command, async);
  if(request.withCredentials) {
    xmlhttp.withCredentials = !! request.withCredentials;
  }
  xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  //xmlhttp.setRequestHeader( "Content-Type", "text/html;charset=UTF-8" );
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState == 4) {
      if(xmlhttp.status == 200) {
        request.oncomplete &&request.oncomplete(xmlhttp);
      } else {
        request.onerror && request.onerror(xmlhttp);
      }
    }
  };

  var postdata = null;
  if(request.data && typeof data_handler == 'function') {
    postdata = data_handler(request.data);
  }
  
  xmlhttp.send(postdata);
}

/**
 * 拖拽封装，提供简单添加和删除完成元素的拖拽功能，只能创建一个实例
 */
(function (Q) {
  var draging = Q.extend({
  capture_wnd : null,
  is_drag : false,
  x : 0,
  y : 0,
  begin_left : 0,
  begin_top : 0,
  mousedown_Hanlder : null,
  mouseup_handler : null,
  mousemove_handler : null,
  is_moved : false,
  timer : null,
  __init__ : function(){
    var _this = this;

    // 缓存时间
    _this.mousedown_hanlder = function(evt) { _this._mousedown(evt); }
    _this.mouseup_handler = function(evt) { _this._mouseup(evt); }
    _this.mousemove_handler = function(evt) { _this._mousemove(evt); }

    Q.addEvent(document, 'mousedown', _this.mousedown_hanlder);
    Q.addEvent(document, 'mouseup', _this.mouseup_handler);
  },

  attach_object : function(json) {
    var config = json || {};
    var obj = Q.$(config.id);
    var config = config || {};
    obj.setAttribute('q-drag-object', true);
    obj.q_drag_objects = new Q.List();
    obj.q_onmove_begin = config.onmove_begin || function(x, y) {}
    obj.q_onmove_end = config.onmove_end || function(x, y) {}
    obj.q_onmove = config.onmove || function(x, y) {
      // Q.printf('x: ' + x + '; y:' + y + ';');
      var obj = this;    
      obj.style.left = x + 'px'; 
      obj.style.top  = y + 'px'; 
    };
    if(!!config.self) 
      this.add_drag_handler(obj, obj);
    var init_drag_objects = config.objects || [];
    for(var i=0; i < init_drag_objects.length; i++) {
      this.add_drag_handler(obj, Q.$(init_drag_objects[i]));
    }
  },

  deattach_object : function(obj_or_id) {
    var obj = Q.$(obj_or_id);
    obj.removeAttribute('q-drag-object');
  },

  add_drag_handler : function(drag_object, handler) {
    drag_object.q_drag_objects.append(handler); 
  },
  
  remove_drag_handler : function(drag_object, handler) {
    drag_object.q_drag_objects.erase(handler); 
  },
  
  is_drag_handler : function(drag_object, handler) {
    return this.is_dragable(drag_object) && drag_object.q_drag_objects.find(handler); 
  },

  is_dragable : function(drag_object) {
    var obj = Q.$(drag_object);
    return obj && obj.getAttribute && !!obj.getAttribute('q-drag-object'); 
  },

  zoom : function(v) {
    if(this.capture_wnd && this.capture_wnd.style.zoom) {
      return (v / (this.capture_wnd.style.zoom * 1.0));
    } else {
      return v;
    }
  },

  _mousedown : function(evt) {
    evt = evt || window.event;
    if(evt.button == Q.RBUTTON){ return; } // 屏蔽右键拖动
    var target_wnd = drag_handle = Q.isNS6() ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
    
    while(target_wnd && !this.is_dragable(target_wnd) && (target_wnd != document.body)) {
      target_wnd = target_wnd.parentNode;
    }

    if(target_wnd && this.is_drag_handler(target_wnd, drag_handle)) {
      this.capture_wnd = target_wnd;
      this.is_drag = true; 
      this.x = evt.clientX;
      this.y = evt.clientY; 
      
      this.begin_left = target_wnd.offsetLeft;
      this.begin_top = target_wnd.offsetTop;
      //Q.printf("[drag-onbegin]offet x: " + this.begin_left + ", offset y: " + this.begin_top )
      if(this.capture_wnd.q_onmove_begin)
        this.capture_wnd.q_onmove_begin(this.begin_left+this.zoom(this.x), this.begin_top+this.zoom(this.y));
      this.timer = setTimeout(Q.bind_handler(this, function() { Q.addEvent(document, 'mousemove', this.mousemove_handler);  }), 10);
      return false; 
    }
  },
    
  _mousemove : function(evt){
    this.is_moved = true;
    evt = evt || window.event
    if (this.is_drag) {
      var x = evt.clientX-this.x;
      var y = evt.clientY-this.y;
      //Q.printf("[drag-onmove] dx: " + x + ", dy: " + y);
      this.capture_wnd.q_onmove(this.begin_left+this.zoom(x), this.begin_top+this.zoom(y));
      return false; 
    }
  },

  _mouseup : function(evt) {
    clearTimeout(this.timer);
    if(this.is_drag ) {
      this.is_drag=false;
      Q.removeEvent(document,'mousemove', this.mousemove_handler);
      if(this.capture_wnd.q_onmove_end)
        this.capture_wnd.q_onmove_end(this.zoom(this.x), this.zoom(this.y));
    }
    this.is_moved=false;
  }
});

var instance;

/**
 * 事件回调函数
 *
 * @callback drag_event_callback
 * @param {number} left - 水平坐标
 * @param {number} top  - 顶点坐标
 */


/**
 * 初始化一个拖拽元素，同时可以指定多个子节点触发当前拖动对象的移动
 * @tutorial Q.drag
 * @function
 * @param {Object} json - 初始化拖拽参数
 * @param {string|dom} json.id - 拖拽的对象
 * @param {bool} json.self - 拖拽的对象的任何区域可拖拽
 * @param {array} json.objects - 拖拽对象的内部触发拖拽的子节点元素，当鼠标这些元素按下时，可以触发json.id对象的拖拽
 * @param {drag_event_callback} json.onmove_begin - 移动开始
 * @param {drag_event_callback} json.onmove - 移动中
 * @param {drag_event_callback} json.onmove_end - 移动结束
 *
 * @example <caption> 元素自身可拖拽初始化</caption>
Q.ready(function() {
   Q.drag({
     id: 'test-drag',  // 元素id
     self: true   // 元素自身任何区域可以拖拽
   });
});
 *
 * @example <caption> 自定义内部子节点触发的拖拽初始化 </caption>
Q.ready(function() {
   Q.drag({
     id: 'test-drag',  // 元素id
     self: true        // 元素自身任何区域可以拖拽
     objects: ['test-drag-child1', 'test-drag-child2']  // test-drag-child1, test-drag-child2 都为test-drag元素的子节点元素
   });
});
 
 */
Q.drag = function(json) {
  if(!instance)  
    instance = new draging;
  instance.attach_object(json);
}

/**
 * 初始化拖拽元素
 * @function
 * @param id {dom|string} - 解除元素拖拽绑定
 * @example 
 * Q.dragno('test-drag');
 */
Q.dragno = function(id) {
  if(instance) {
    instance.deattach_object(id);
  }
}

})(window.Q);


/**菜单分割线
 * @type {string}
 * @readonly
 */
var MENU_SEPERATOR = "seperator";
var MENU_ITEM = "item";
var MENU_ITEM_CHECKBOX = "checkbox";
var MENU_ITEM_RADIO = "radio";

/** 菜单项
 *
 * @tutorial Q.Menu
 * @constructor
 * @param {Object} json - 菜单项构造参数
 * @param {number} [json.type=MENU_ITEM] - 菜单项类型
 * @param {string} json.text - 菜单项文本
 * @param {string} json.icon - 菜单项图片
 * @param {*} json.data - 菜单项绑定的数
 * @param {string} json.popup_style - 弹出子菜单窗口样式
 * @param {function} json.callback - 响应回调
 */
Q.MenuItem = Q.extend(
{
hwnd : null,
parentMenu : null,
topMenu : null,
titlewnd : null,
subwnd : null,
iconwnd : null,
activeItem : null,
type : -2,
isAjust : false,
clickHidden : true,
items : null,
data : null,
isChecked : true,
popup_style: null,
/**
 * @callback Q.MenuItem.callback
 * @param {Q.MenuItem} item - 子菜单项
 * @returns {bool} true 关闭菜单，false 不关闭菜单
 */

__init__ : function(json) {
  json = json || {};
  var _this = this;
  _this.items = [];
  _this.parentMenu = json.parentMenu;
  _this.data = json.data;
  this.popup_style = json.popup_style;
  this.type = json.type || MENU_ITEM; 
  // construct dom
  _this.hwnd = document.createElement('LI');
  _this.titlewnd = document.createElement('DIV');
  _this.hwnd.appendChild(_this.titlewnd);
  if(json.type == MENU_SEPERATOR) {
    _this.hwnd.className = 'q-item-seperator';
    _this.titlewnd.className = "q-line"
  } else {
    _this.hwnd.className = 'q-item';
    _this.titlewnd.className = "q-item-title";
    _this.iconwnd = document.createElement("button");
    _this.iconwnd.className = "q-item-icon";
    _this.iconwnd.innerHTML = "&nbsp;";
    _this.titlewnd.appendChild(_this.iconwnd);
    _this.titlewnd.appendChild(document.createTextNode(json.text+"\u00A0\u00A0\u00A0\u00A0"));
    
    if(json.icon)
      _this.iconwnd.style.background = json.icon;

    // initialize event callback
    _this.hwnd.onmouseover = function(evt) {
      evt = evt || event;
      if(_this.parentMenu) {
        var activeItem = _this.parentMenu.activeItem;
        if(activeItem) {
          activeItem.hidePopup();
        }
      }
      _this.parentMenu.activeItem = _this;
      _this.showPopup();
    }
  
    _this.hwnd.onmouseout = function(evt) {
      evt = evt || event;
      if(Q.hasClass(_this.hwnd, "q-active")) { 
        return;
      }
      _this.hidePopup();
    }
  
    _this.hwnd.onmousedown = (function(o, c) {
      return function(evt) {
        Q.printf('menu onmousedown');
      }
    })(this, json);
    _this.hwnd.onmouseup = (function(o, c) {
      return function(evt) {
        Q.printf('menu onmouseup');
        evt = evt || window.event;
        
        if(o.subwnd) { 
          return; 
        }
        var call_back = function(e) {};
        if((typeof c == 'function' ))
          call_back = c;
        var retval = call_back(o);
        if(retval !== undefined && retval === false) {
          return false;
        }
        o.topMenu && o.topMenu.hide();
        return true;
      }
    })(this, json.callback);
    
  }
  
  _this.hwnd.oncontextmenu = function(evt) { return false; }
  _this.hwnd.onselectstart = function(evt) { return false; }
},

/** 添加子菜单项
 * @memberof Q.MenuItem.prototype
 * @param {Q.MenuItem} subItem - 子菜单
 */
addSubMenuItem : function(subItem) {
  if((this.type == MENU_SEPERATOR)
   || (this.type == MENU_ITEM_CHECKBOX))
  {
    return;
  }
  if(!this.subwnd) 
  {
    this.subwnd = document.createElement("DIV");
    document.body.appendChild(this.subwnd);
    this.subwnd.className = 'q-contextmenu';
    if(this.popup_style)
      Q.addClass(this.subwnd, this.popup_style);

    Q.addClass(this.hwnd, 'q-more');
    this.subwnd.onmousedown = function(evt) { 
      evt = evt || event;
      //evt.cancelBubble = true;
    }
    this.subwnd.oncontextmenu = function(evt) { return false; }
  }
  
  this.subwnd.appendChild(subItem.hwnd);
  subItem.parentMenu = this;
  subItem.setTopMenu(this.topMenu);
  this.items.push(subItem);
},

setTopMenu : function(topMenu) {
  this.topMenu = topMenu;
  var len = this.items.length;
  for(var i=0; i < len; i++) {
    this.items[i].setTopMenu(topMenu);  
  }
},

hidePopup : function() {
  if(!this.subwnd) 
    return

  Q.removeClass(this.hwnd, "q-active");
  if(this.activeItem) { 
    this.activeItem = null;
  }
  this.subwnd.style.display = 'none';
  var len = this.items.length;
  for(var i=0; i < len; i++) {
    this.items[i].hidePopup();  
  }
},

showPopup : function() {
  if(!this.subwnd)  
    return; 
  Q.addClass(this.hwnd, "q-active");
  this.subwnd.style.display = '';
  var workspace = Q.workspace();
  var pos = Q.absPositionEx(this.hwnd);
  var x =0, y = 0;
  if(pos.top+pos.height+this.subwnd.offsetHeight > workspace.height ) {
    y = pos.top+pos.height-this.subwnd.offsetHeight;
    if(y < 0)  {
      y = 0;
    }
  } else {
    y = pos.top;    
  }
  if((this.subwnd.offsetWidth + pos.left+pos.width) > workspace.width) {
    x = pos.left - this.subwnd.offsetWidth; 
    if(x < 0) 
      x = 0;
  } else {
    x = pos.left+pos.width;
    
  }
  var si = Q.scrollInfo(); 
  this.subwnd.style.left = si.l + x + 'px';
  this.subwnd.style.top = (si.t+y) + 'px';
},

data : function() {
  return this.data;  
}

});

/** 菜单封装，支持右键弹出
 *
 * @tutorial Q.Menu
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string} json.style - 菜单样式
 * @param {Q.Menu.callback} json.on_popup - 弹出菜单 
 */
Q.Menu = Q.extend({
hwnd : null,
subwnd: null,
timer : null,
isajust : false,
activeItem : null,
items : null,
_fHide : null,
_fWheel: null,
_fOnPopup : null,

/**
 * @callback Q.Menu.callback
 * @param {bool} popup - true 弹出, false 隐藏 
 */

__init__ : function(json) {
  json = json || {};
  var _this = this;
  this.items = [];
  this._fHide = (function(o, h) {
    return function(evt) {
      evt = evt || window.event;
      var target = Q.isNS6() ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
      while(target && (!Q.hasClass(target,"q-contextmenu")) && (target != document.body)) {
        target = target.parentNode;
      }
      //Q.printf(target);
      if((!target) || target == document.body)
        h();
      else
      {
        evt.returnValue = false;
        return false;
      }
    }
  })(this, Q.bind_handler(this, this.hide));  //Q.bind_handler(this, this.hide);
  if(typeof json.on_popup == 'function') {
    this._fOnPopup = json.on_popup;
  } else {
    this._fOnPopup = function(popup) {};
  }

  this.initview(json);
},

initview : function(json) {
  this.hwnd = document.createElement('DIV');
  this.hwnd.className = 'q-contextmenu';
  document.body.appendChild(this.hwnd);
  Q.addClass(this.hwnd, json.style);
},

/**
 * 添加子菜单项
 * 
 * @memberof Q.Menu.prototype
 */
addMenuItem : function(item) {
  var _this = this;
  _this.hwnd.appendChild(item.hwnd);
  item.parentMenu = _this;
  item.setTopMenu(_this);
  _this.items.push(item);
},

show : function(evt){
  var _this = this;
  var scroll = Q.scrollInfo();
  var left = 0, top = 0;
  evt = evt || window.event;
  _this.hwnd.style.display = '';
  if((evt.clientX + _this.hwnd.offsetWidth) > document.body.clientWidth)
      left = evt.clientX  + scroll.l - _this.hwnd.offsetWidth - 2;
  else
      left = evt.clientX + scroll.l;
  
  if( (evt.clientY + _this.hwnd.offsetHeight) > document.body.clientHeight)
      top = evt.clientY  + scroll.t - _this.hwnd.offsetHeight - 2;
  else
      top = evt.clientY + scroll.t;
  
  _this.hwnd.style.left = left+'px';
  _this.hwnd.style.top  = top +'px';
  this._fWheel = document.onmousewheel;
  document.onmousewheel = function() { return false; }
  if(!_this.isajust) {
    _this.isajust = true;
    var childNodes = _this.hwnd.childNodes;
    var len = childNodes.length;
    for(var i=0; i < len; i++) {  
      var node = childNodes[i];
      node.style.width = (_this.hwnd.offsetWidth - 2) + 'px';
    }
  }

  Q.addEvent(window, "blur", _this._fHide);
  Q.addEvent(window, "resize", _this._fHide);
  Q.addEvent(document, "mouseup", _this._fHide);
},

showElement : function(element, isClosed) {
  var _this = this;
  _this.hide();
  Q.addEvent(document, "mousedown", _this._fHide);
  Q.addEvent(window, "blur", this._fHide);
  this._fOnPopup(true);
  if(element.nodeType != Q.ELEMENT_NODE)  
    return; 
  
  _this.hwnd.style.display = '';
  if(!this.isajust) {
    this.isajust = true;
    var childNodes = this.hwnd.childNodes;
    var len = childNodes.length;
    for(var i=0; i < len; i++) {  
      var node = childNodes[i];
      node.style.width = (_this.hwnd.offsetWidth - 2) + 'px';
    }
  }
  var workspace = Q.workspace();
  var pos = Q.absPosition(element);
  var left =0, top = 0;
  if(pos.top+pos.height+_this.hwnd.offsetHeight > workspace.height ) {
    top = pos.top-_this.hwnd.offsetHeight;
  } else {
    top = pos.top + pos.height;
  }
  if(_this.hwnd.offsetWidth + pos.left > workspace.width) {
    left = pos.left+pos.width - _this.hwnd.offsetWidth;  
  } else {
    left = pos.left;  
  }
  
  var si = Q.scrollInfo();
  _this.hwnd.style.left = (si.l + left) + 'px';
  _this.hwnd.style.top = (si.t + top) + 'px';
},

hide : function() {
  //Q.printf("hide context menu");
  this.hwnd.style.display = 'none';
  Q.removeEvent(window, "blur", this._fHide);
  Q.removeEvent(document, "mousedown", this._fHide);
  document.onmousewheel = this._fWheel;
  this._fOnPopup(false);

  var len = this.items.length;
  for(var i=0; i < len; i++) {
    this.items[i].hidePopup();
  }
}
});

function fireMouseEvent(element, evtName) {
  if( document.createEvent ) 
  {
     var evObj = document.createEvent('MouseEvents');
     evObj.initEvent( evtName, true, false );
     element.dispatchEvent(evObj);
  }
  else if( document.createEventObject )
  {
      element.fireEvent('on'+evtName);
  }
}

/** 菜单栏
 *
 * @tutorial Q.Menu
 * @constructor
 * @param {Object} json - 构造参数
 */
Q.MenuBar = Q.extend({
focus: null,
items: null,
__init__: function(json) {
  json = json || {};
  this.items = new Q.List();
  this._hide = Q.bind_handler(this, function() {
    Q.printf('blur');
    Q.removeEvent(document, "mousedown", this._hide);
    Q.removeEvent(window, "blur", this._hide);
    this.focus = false;
  });
},

/** 追加菜单到菜单栏，布局用户自定义
 * 
 * @memberof Q.MenuBar.prototype
 * @param {dom} item - 渲染的菜单栏项
 * @param {Q.Menu} menu - 菜单的菜单栏项
 */
append: function(item, menu) {
  item._menu = menu;
  item.onmousedown = (function(bar, i, m) { 
    return function(evt) {
      Q.printf("mousedown item")
      evt = evt || window.event;
      if((bar.focus)) {
        bar._hide();
        if(m)
          m.hide();
      } else {
        fireMouseEvent(document.body, 'mousedown');
        bar.focus = true;
        Q.addEvent(document, "mousedown", bar._hide);
        Q.addEvent(window, "blur", bar._hide);
        if(m)
          m.showElement(i);
      }
      // 阻止事件冒泡
      //evt.returnValue = false;
      evt.cancelBubble = true;
      return true;
    } 
  })(this, item, menu);
  item.onmouseover = (function(bar, i, m) { return function(evt) {
    Q.printf('item onmouseover');
    if(bar.focus)
      bar.focus_item(i);
  }})(this, item, menu);

  this.items.append(item);
},

focus_item : function(item) {
  this.items.each(function(i) {
    if(item != i) {
      if(i._menu)
        i._menu.hide();
    } else {
      if(i._menu)
        i._menu.showElement(i);
    }
    return true;
  })  
}

});

/**
 * 常量定义
 * @readonly
 * @enum {*}
 */
var CONST = {
  /** Q.Window窗口样式, 无标题栏
   * @type {string}
   */
  no_title    : "q-attr-no-title",
  /** Q.Window窗口样式, 无标题栏图标
   * @type {string}
   */
  no_icon     : "q-attr-no-icon",

  /** Q.Window窗口样式, 无最小化按钮
   * @type {string}
   */
  no_min      : "q-attr-no-min",

  /** Q.Window窗口样式, 无最大化按钮
   * @type {string}
   */
  no_max      : "q-attr-no-max",

  /** Q.Window窗口样式, 无关闭按钮
   * @type {string}
   */
  no_close    : "q-attr-no-close",

  /** Q.Window窗口样式, 带底部按钮控制栏
   * @type {string}
   */
  with_bottom : "q-attr-with-bottom",

  /** Q.Window窗口样式, 窗口固定大小，不允许拖拽边框
   * @type {string}
   */
  fixed       : "q-attr-fixed",


  /** Q.Window窗口样式, 未激活标题栏样式
   * @type {string}
   */
  inactive_title : "q-attr-inactive-title",
  
  // size text
  SIZE_MIN:      "min",
  SIZE_MAX:      "max",
  SIZE_NORMAL:   "normal",
  SIZE_RESIZE :  3,
  SIZE_DRAGING:  4,
  SIZE_RESIZING: 5,
  SIZE_MINING :  6,

// dialog define
  IDCANCEL :          '0',
  IDOK     :          '1',
  IDNO     :          '2'
}

var __GLOBALS = {};
__GLOBALS.MIN_HEIGHT = 30;
__GLOBALS.MIN_WIDTH  = 100;
__GLOBALS.Z_INDEX    = 10000;
__GLOBALS.count      = 0;
__GLOBALS.appid      = -1;
__GLOBALS.apps       = {};

// global windows intitalize  
Q.ready(function() {
  __GLOBALS.desktop = document.body;
  __GLOBALS.desktop.hook = new Q.List();
  __GLOBALS.desktop.wnds   = new Q.List();  // popups windows
  __GLOBALS.desktop.active_child = null;
  __GLOBALS.explorer = new Q.UIApplication();
  $CreateMaskLayer(__GLOBALS.desktop, "q-top-mask");
}, true);


/** 应用程序基类, 资源管理，例如窗口模板等等, 默认系统会自动创建全局UIApplication
 * 
 * @constructor
 * @property id {number} - Application ID
 */

Q.Application = Q.extend({
id : -1,
__init__ : function(params) {
  // generator app id
  this.id = ++__GLOBALS.appid;
  __GLOBALS.apps[this.id] = this;
},

/** 释放应用程序相关资源
 * @memberof Q.Application.prototype
 */
end : function() {
  delete __GLOBALS.apps[this.id];
}

});

/** UI应用程序，主要是窗口管理
 *
 * @constructor
 * @augments Q.Application
 * @property wnds_map {Q.List} - 窗口管理
 */
Q.UIApplication = Q.Application.extend({
wnds_map: null,
__init__ : function(params) {
  Q.Application.prototype.__init__.call(this, arguments);
  this.wnds_map = new Q.List();
},

/** 注册窗口到应用程序
 *
 * @memberof Q.UIApplication.prototype
 * @param wndNode {dom} - 注册的窗口
 */
add_window   : function(wndNode) { 
  this.wnds_map.append(wndNode); 
},

/** 注销窗口
 *
 * @memberof Q.UIApplication.prototype
 * @param wndNode {dom} - 注销的窗口
 */
erase_window : function(wndNode) { 
  this.wnds_map.erase(wndNode); 
},

/** UI应用程序释放，同时关闭释放窗口资源
 *
 * @override
 */
end : function() {
  // close all windows
  this.wnds_map.each(function(wndNode) {
    delete wndNode.app;
    wndNode.on_close = function() { return true; }
    $BindWindowMessage(wndNode, MESSAGE.CLOSE)();
  });
  Q.Application.prototype.end.call(this); 
}
});

/*-----------------------------------------------------------------
  common APIs
-------------------------------------------------------------------*/
// check the statement wether be null
function $IsNull(statement) { return  (statement == null); }
function $IsStyle(wndNode, style) { return Q.hasClass(wndNode, style); }

/*-----------------------------------------------------------------
  windows APIs
-------------------------------------------------------------------*/
function register_hook(h) {
  __GLOBALS.desktop.hook.append(h);
}

function unregister_hook(h) {
  __GLOBALS.desktop.hook.erase(h);
}

function invoke_hook(hwnd, message_id) {
  __GLOBALS.desktop.hook.each(function(f) {
    f(hwnd, message_id);
  });
}

function $IsDesktopWindow(wndNode) { 
  return (__GLOBALS.desktop == wndNode); 
}

function $IsWindow(wndNode) {
  return (!$IsNull(wndNode)) && (wndNode.nodeType == Q.ELEMENT_NODE) && wndNode.getAttribute('__QWindow__');
}

function $IsMaxWindow(wndNode) {
  return ($IsStyle(wndNode, CONST.STYLE_MAX) && (CONST.SIZE_MAX == $GetWindowStatus(wndNode))); 
}

function $BindWindowMessage(wndNode, messageid, parameters) {
  return function() {
    if(wndNode != $GetDesktopWindow()) {
      return wndNode.wnd_proc(wndNode, messageid, parameters);
    } else {
      return false;
    }
  }
} 

function $MaskWindow(wndNode, bmask) { 
  var layer_mask = $GetMask(wndNode);
  if($IsDesktopWindow(wndNode)) {
    if(bmask) {
      layer_mask.body_style = document.body.currentStyle.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = layer_mask.body_style;
    }
  }
  if(layer_mask && layer_mask.style)
    layer_mask.style.display=((!!bmask)?'':'none'); 
}

function $CreateMaskLayer(wndNode, extra_style) {
  wndNode.layer_mask = document.createElement('DIV');
  wndNode.layer_mask.body_style = document.body.currentStyle.overflow;
  wndNode.layer_mask.className = 'q-window-mask';
  if(extra_style)
    Q.addClass(wndNode.layer_mask, extra_style);
  wndNode.appendChild(wndNode.layer_mask);
  wndNode.layer_mask.style.display = 'none';
  wndNode.layer_mask.onmousedown = Q.bind_handler(wndNode, function(evt) { 
    evt = evt || window.event;
    $BindWindowMessage(this, MESSAGE.ACTIVATE)();
    // 取消事件冒泡，防止ActivateWindow被调用到
    evt.cancelBubble = true;
    return false; 
  });
  wndNode.layer_mask.onselectstart = function() { return false; }
}

function $ShowWindow(wndNode, visible)  {
  if( visible ){
    wndNode.style.display = '';
    $BindWindowMessage(wndNode, MESSAGE.ACTIVATE)();
  } else {
    wndNode.style.display = 'none';
    $MaskWindow(wndNode, false);
  }
}

function $ActivateWindow(wndNode, zindex) {
  if(!$IsWindow(wndNode))
    return;
  var defined_zindex = 0;
  if(!isNaN(zindex)) 
    defined_zindex = zindex;

  var parent_container = $GetContainerWindow(wndNode);
  $SetActiveChild(parent_container, wndNode);
    // set zindex
  var top_sibling = $GetTopZIndexWindow(parent_container);
  var z_active_sibling = $GetWindowZIndex(top_sibling)+1;
  $SetWindowZIndex(wndNode, (defined_zindex)?defined_zindex:z_active_sibling);
  $SetWindowActive(top_sibling, false);
  $SetWindowActive(wndNode, true);
}

function $SetWindowActive(wndNode, IsActive) {
  var active_child = wndNode;
  while(active_child) {
    if(active_child.on_activate)
      active_child.on_activate(IsActive);
    if(IsActive) {
      Q.removeClass(active_child, CONST.inactive_title);
    } else {
      Q.addClass(active_child, CONST.inactive_title);
    }
    active_child = $GetActiveChild(active_child);
  }
}

function $MaxizeWindow(wndNode){
  if( $GetWindowStatus(wndNode) == CONST.SIZE_MAX ) 
    return; 

  var parent_container = $GetContainerWindow(wndNode);
  var width, height;
  if( parent_container == document.body ) {
    var workspace = Q.workspace();
    width  = workspace.width;   //Math.max(document.body.clientWidth, document.body.scrollWidth);
    height = workspace.height; //Math.max(document.body.clientHeight, document.body.scrollHeight);
  } else if( $IsWindow(parent_container) ) {
    width  = Math.max($GetClient(parent_container).clientWidth, $GetClient(parent_container).scrollWidth);
    height = Math.max($GetClient(parent_container).clientHeight, $GetClient(parent_container).scrollHeight);
  } else { 
    return;  
  }
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, "q-normal");
  $SetWindowPosition(wndNode, 0, 0, width, height);
  $SetWindowStatus(wndNode, CONST.SIZE_MAX);
}

function $RestoreWindow(wndNode){
  $ChangeCtrlButton(wndNode, CONST.SIZE_MAX, "q-max");
  $MoveTo(wndNode, wndNode.rleft, wndNode.rtop);
  $ResizeTo(wndNode, wndNode.rwidth, wndNode.rheight);
  $SetWindowStatus(wndNode, CONST.SIZE_NORMAL);
}

function $MinimizeWindow(wndNode) {
  if($GetWindowStatus(wndNode) == CONST.SIZE_MAX) 
    return;
  
  if( wndNode.minizing ) {    
    $ResizeTo(wndNode, wndNode.nWidth, wndNode.minizie_height);
    wndNode.minizing = false;
  } else {
    wndNode.minizie_height = wndNode.nHeight;
    $ResizeTo(wndNode, wndNode.nWidth, $GetTitle(wndNode).offsetHeight);
    wndNode.minizing = true;
  }
}

function $FitWindow(wndNode) {
  var client = $GetClient(wndNode);
  var oldOverFlow = client.style.overflow;
  client.style.overflow = 'visible';
    
  var lastHeight = client.scrollHeight;
  if( !$IsStyle(wndNode, CONST.no_title)) {
    lastHeight = lastHeight + $GetTitle(wndNode).offsetHeight;
  }
    
  if( $IsStyle(wndNode, CONST.with_bottom)) {
    lastHeight = lastHeight + ($GetBottomBar(wndNode).offsetHeight);
  }
    
  $ResizeTo(wndNode, client.scrollWidth, lastHeight);  // 自适应内容长度
  client.style.overflow = oldOverFlow;
}

/*-----------------------------------------------------------------
  windows APIs Set Methods
-------------------------------------------------------------------*/

function $SetWindowPosition(wndNode, left, top, width, height) {
  $MoveTo(wndNode, left, top);
  $ResizeTo(wndNode, width, height);
}

function $SetWindowTitle(wndNode, title){
  wndNode.title_text = title;
  wndNode.hTitle.hTitleContent.innerText = title;
}

function $SetActiveChild(wndNode, child) {
  wndNode.active_child = child;  
}

function $SetWindowZIndex(wndNode, zIndex) { 
  if(wndNode === $GetDesktopWindow())
    return;
  wndNode.style.zIndex = zIndex; 
}

function $RemoveWindowStyle(wndNode, ws) { 
  Q.removeClass(wndNode, ws); 
}

function $SetWindowStatus(wndNode, status) { 
  wndNode.status_type  = status; 
}

function $MoveTo(wndNode, x, y){
  // save pos before moving
  wndNode.rtop  = wndNode.nTop;
  wndNode.rleft = wndNode.nLeft;

  wndNode.nTop = y;
  wndNode.nLeft = x;
  wndNode.style.top = wndNode.nTop + 'px';
  wndNode.style.left = wndNode.nLeft + 'px';
}

function $ResizeTo(wndNode, width, height) {
  // save size before resize
  wndNode.rwidth = wndNode.nWidth;
  wndNode.rheight= wndNode.nHeight;
   
  width = Math.max(parseInt(width,10) - 0, __GLOBALS.MIN_WIDTH);
  height = Math.max(parseInt(height, 10), __GLOBALS.MIN_HEIGHT);
  
  wndNode.nWidth = width;
  wndNode.nHeight = height;
  wndNode.style.width = width + 'px';
  wndNode.style.height = height + 'px';
  
  if(typeof(wndNode.on_size) == 'function') 
    wndNode.on_size(width, height);
}

function $GetWindowClientHeight() {
  var myHeight = 0;
  if (typeof(window.innerHeight) == 'number') {
    //Non-IE
    myHeight = window.innerHeight;
  } else if (document.documentElement && document.documentElement.clientHeight) {
    //IE 6+ in 'standards compliant mode'
    myHeight = document.documentElement.clientHeight;
  } else if (document.body && document.body.clientHeight) {
    //IE 4 compatible
    myHeight = document.body.clientHeight;
  }
  return myHeight;
}

function $CenterWindow(wndNode) {
  var si = Q.scrollInfo();
  var left = si.l +(document.body.clientWidth - wndNode.nWidth ) / 2;
  var top =  si.t + (($GetWindowClientHeight() - wndNode.nHeight ) / 2);
  $MoveTo(wndNode, left, top);
}

function $SetWindowProc(wndNode, new_window_proc) {
  if(typeof new_window_proc == 'function') {
    var old_wnd_proc = wndNode.wnd_proc;
    wndNode.wnd_proc = new_window_proc;
    return old_wnd_proc;
  }
  return null;
}


/*-----------------------------------------------------------------
  windows APIs Get Methods
-------------------------------------------------------------------*/

function $GetDesktopContainer()    { return __GLOBALS.desktop;   }
function $GetDesktopWindow()       { return __GLOBALS.desktop;   }
function $GetMask(wndNode)         { return wndNode.layer_mask;  }
function $GetActiveChild(wndNode)  { return wndNode.active_child;}
function $GetContainerWindow(wndNode) { return wndNode.container_wnd;  }
function $GetParentWindow(wndNode) { return wndNode.parent_wnd;  }
function $GetWnds(wndNode)         { return wndNode.wnds;        }
function $GetMinCtrlButton(wndNode){ return wndNode.hTitle.hMin; }
function $GetMaxCtrlButton(wndNode){ return wndNode.hTitle.hMax; }
function $GetTitleText(wndNode)    { return wndNode.title_text;  }
function $GetTitleContent(wndNode) { return wndNode.hTitleContent; }
function $GetTitle(wndNode)        { return wndNode.hTitle;      }
function $GetBottomBar(wndNode)    { return wndNode.hBottomBar;  }
function $GetWindowStatus(wndNode) { return wndNode.status_type; }
function $GetWindowStyle(wndNode)  { return wndNode.className;   }
function $GetClient(wndNode)       { return wndNode.hClientArea; }

function $GetWindowZIndex(wndNode){
  if(wndNode && wndNode.style && wndNode.style.zIndex) {
    return parseInt(wndNode.style.zIndex, 10);
  } else {
    return __GLOBALS.Z_INDEX;
  }
}

function $GetTopZIndexWindow(){
  var parent_wnd;
  if( arguments.length > 0 && $IsWindow(arguments[0]) ) {
    parent_wnd = arguments[0];
  } else {
    parent_wnd = $GetDesktopWindow();
  }
  var wnds = $GetWnds(parent_wnd);
  var top_wnd = null; 
 
  wnds.each(function(wnd) {
   if(top_wnd) {
     top_zindex = $GetWindowZIndex(top_wnd);
     wnd_zindex = $GetWindowZIndex(wnd);
     if( wnd_zindex > top_zindex ) {
       top_wnd = wnd;
     }
   } else {
     top_wnd = wnd;
   }
   return true; 
  }); 
  
  return top_wnd;
}


/**
 * @enum MESSAGE
 */
var MESSAGE = {
  CREATE: 0,
  MIN   : 1,
  MAX   : 2,
  CLOSE : 3,
  ACTIVATE : 4,
  MOVE : 5
}

function $DefaultWindowProc(hwnd, msg, data) {
  switch(msg) {
  case MESSAGE.CREATE:
    //Q.printf('DefaultWindowProc MESSAGE.CREATE');
    break;  
  case MESSAGE.MIN:
    //Q.printf('DefaultWindowProc MESSAGE.MIN');
    $MinimizeWindow(hwnd);
    break;
  case MESSAGE.MAX:
    //Q.printf('DefaultWindowProc MESSAGE.MAX');
    if($GetWindowStatus(hwnd) != CONST.SIZE_MAX) { 
      $MaxizeWindow(hwnd); 
    } else { 
      $RestoreWindow(hwnd); 
    }
    break;
  case MESSAGE.CLOSE:
    //Q.printf('DefaultWindowProc MESSAGE.CLOSE');
    var destroy_window = true;
    if(hwnd.on_close) 
      destroy_window = hwnd.on_close();
    
    if(destroy_window === false) {
      $ShowWindow(hwnd, false);
    } else {
      $DestroyWindow(hwnd);
    }
    break;  
  
  case MESSAGE.ACTIVATE:
    {
      //Q.printf('DefaultWindowProc MESSAGE.ACTIVATE -> ' + $GetTitleText(hwnd));
      var top_wnd = $GetTopZIndexWindow($GetDesktopWindow());
      var top_zindex = $GetWindowZIndex(top_wnd);
      var t = hwnd;
      // 最底部的模式窗口
      while(t && t.modal_prev) 
        t = t.modal_prev;
      // 统计增加的层数
      while(t && t.modal_next) { 
        t = t.modal_next;
        ++top_zindex;  
      }

      // 先激活顶层窗口
      $ActivateWindow(t, ++top_zindex);
      if(t != hwnd) {
        $BindWindowMessage(t, MESSAGE.ACTIVATE)();
      }
      // 一层层设置zindex
      while(t && t.modal_prev) {
        t = t.modal_prev;
        $SetWindowZIndex(t, --top_zindex); 
      }
    }
    break;  
  case MESSAGE.MOVE:
    break;
  } 


  invoke_hook(hwnd, msg);

  return false;
}


function $CreateCtrlButton(type) {
  var btn = document.createElement('button');  
  btn.innerHTML = '&nbsp;';
  btn.className = type;
  btn.hideFocus = true;
  return btn;
}

function $ChangeCtrlButton(wndNode, type, dsttype){
  var btn;
  if( type == CONST.SIZE_MIN )
    btn = $GetMinCtrlButton(wndNode);
  else if( type == CONST.SIZE_MAX )
    btn = $GetMaxCtrlButton(wndNode);
  btn.className = dsttype;
}

function $CreateWindowTitlebar(hwnd)  {
  var hTitle = document.createElement('DIV');
  hTitle.className = 'q-title';
  hTitle.onselectstart = function() { return false; };
  hTitle.onclick = (function(btn, wnd) {
    return function() {
      if($IsStyle(wnd, CONST.fixed))
        return;
      if(btn.clickonce) {
        $BindWindowMessage(hwnd, MESSAGE.MAX)(); 
        btn.clickonce = false;
      } else {
        btn.clickonce = true;
      }
      setTimeout(function() { btn.clickonce = false; }, 300);
    };
  })(hTitle, hwnd);
  //hTitle.ondblclick    = function() { Q.printf('WINDOW title dblclick');  }

  hTitle.hIcon = document.createElement('div');
  hTitle.hIcon.className = 'q-icon';
  hTitle.appendChild(hTitle.hIcon);
   
  hTitle.hTitleContent = document.createElement('DIV');
  hTitle.hTitleContent.className = 'q-title-content';
  hTitle.appendChild(hTitle.hTitleContent);
 
  hTitle.hMin = $CreateCtrlButton('q-min');
  hTitle.hMax = $CreateCtrlButton('q-max');
  hTitle.hClose = $CreateCtrlButton('q-close');
  hTitle.hPadding= $CreateCtrlButton('q-padding');

  hTitle.hMin.onclick = $BindWindowMessage(hwnd, MESSAGE.MIN);
  hTitle.hMax.onclick = $BindWindowMessage(hwnd, MESSAGE.MAX); 
  hTitle.hClose.onclick = $BindWindowMessage(hwnd, MESSAGE.CLOSE); 
  
  hTitle.appendChild(hTitle.hPadding);
  hTitle.appendChild(hTitle.hClose);
  hTitle.appendChild(hTitle.hMax);
  hTitle.appendChild(hTitle.hMin);

  hwnd.hTitle = hTitle;
  hwnd.appendChild(hTitle);
}

/** 窗口句柄，是一个DOM元素，不同于Q.Window和Q.Dialog以及后续子类派生的类。
 * @typedef WndNode
 */

function $CreateWindow(parent_wnd, title, wstyle, pos_left, pos_top, width, height, app){
  if(wstyle!=undefined) 
    wstyle = (wstyle+"").replace(/\|+/g, " ");
  else
    wstyle = "";
  var container      = null;
  var container_wnd  = null;
  if( !$IsWindow(parent_wnd) ) 
    parent_wnd = $GetDesktopWindow();
 
  container = $GetDesktopWindow();
  container_wnd = $GetDesktopWindow();
  
  // 创建窗口
  var hwnd = document.createElement('DIV');
  // user data
  hwnd.setAttribute('__QWindow__', true);  // 设置QWindow标记，用于$IsWindow方法
  hwnd.parent_wnd   = parent_wnd;
  hwnd.container_wnd = container_wnd;
  hwnd.modal_next   = null;
  hwnd.model_prev   = null;  
  hwnd.wnds         = new Q.List();   // 窗口
  hwnd.active_child = null; 
  hwnd.title_text   = title || 'untitled';
  hwnd.status_type  = CONST.SIZE_NORMAL;
  hwnd.wnd_proc     = $DefaultWindowProc;
  hwnd.app = app || __GLOBALS.explorer;
  hwnd.app.add_window(hwnd); 

  // dom attributes
  hwnd.className = 'q-window';
  hwnd.style.display = 'none';
  hwnd.style.zIndex = __GLOBALS.Z_INDEX;

  if(isNaN(pos_top)) 
    pos_top = 0;
  if(isNaN(pos_left)) 
    pos_left = 0;
  if(isNaN(width)) 
    width = 300;
  if(isNaN(height)) 
    height = 300;

  hwnd.rtop   = hwnd.nTop   = pos_top;
  hwnd.rleft  = hwnd.nLeft  = pos_left;
  hwnd.rwidth = hwnd.nWidth = width;
  hwnd.rheight= hwnd.nHeight = height;
  
  hwnd.style.top    = pos_top + 'px'; 
  hwnd.style.left   = pos_left + 'px';
  hwnd.style.width  = width + 'px'; 
  hwnd.style.height = height + 'px';
  
  // register to wnds
  $GetWnds(container_wnd).append(hwnd);
 
  // 主窗口
  //if( !$IsStyle(ws, CONST.STYLE_FIXED) ) {
    $MakeResizable(hwnd);
  //}
  
  Q.addEvent(hwnd, 'mousedown', $BindWindowMessage(hwnd, MESSAGE.ACTIVATE));

  // initial title bar
  $CreateWindowTitlebar(hwnd);
  $SetWindowTitle(hwnd, hwnd.title_text);

  hwnd.hClientArea = document.createElement('DIV');
  hwnd.hClientArea.className = 'q-window-client';
  hwnd.appendChild(hwnd.hClientArea);
  
  // bottom bar
  hwnd.hBottomBar = document.createElement('DIV');
  hwnd.hBottomBar.className = 'q-bottom-bar';
  hwnd.appendChild(hwnd.hBottomBar);

  // mask window
  $CreateMaskLayer(hwnd);
  
  Q.addClass(hwnd, wstyle);
  $BindWindowMessage(hwnd, MESSAGE.CREATE)();
  
  // render 
  container.appendChild(hwnd);
  Q.drag({
    id: hwnd,
    objects : [hwnd.hTitle, hwnd.hTitle.hTitleCtrlBar, hwnd.hTitle.hTitleContent],
    onmove_begin: Q.bind_handler(hwnd, function(x, y) {
      if($GetWindowStatus(this) != CONST.SIZE_MAX) 
        if(hwnd.on_move_begin)
          hwnd.on_move_begin(x, y);
    }),
    onmove: Q.bind_handler(hwnd, function(x, y) {
      if($GetWindowStatus(this) != CONST.SIZE_MAX) 
        $MoveTo(this, x, y);
    }),
    onmove_end: Q.bind_handler(hwnd, function(x, y) {
      if($GetWindowStatus(this) != CONST.SIZE_MAX) { 
        if(hwnd.on_move_end){
          hwnd.on_move_end(x, y);
        }
      }
    })
  });
  return hwnd;
}

function $DestroyWindow(wndNode) {
  // 清除子窗口
  var child_wnds = $GetWnds(wndNode);
  child_wnds.each(function(wnd) {
    $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 清除弹出的子窗口
  var parent_container = $GetContainerWindow(wndNode);
  var parent_wnds = $GetWnds(parent_container);
  parent_wnds.each(function(wnd) { 
    if($GetParentWindow(wnd) == wndNode) 
      $BindWindowMessage(wnd, MESSAGE.CLOSE)();
    return true;
  });

  // 从父容器中清除自己
  parent_wnds.erase(wndNode); 
  // 删除渲染节点delete dom   
  wndNode.setAttribute('__QWindow', null);
  if(wndNode.parentNode) 
    wndNode.parentNode.removeChild(wndNode);
  wndNode = 0;

  // 激活相邻窗口 
  var wnd = $GetTopZIndexWindow(parent_container);
  if($IsNull(wnd)) {
    $SetActiveChild(parent_container, null);
  } else if( $IsWindow(wnd) ) {
    $BindWindowMessage(wnd, MESSAGE.ACTIVATE)();
  } else {
    $BindWindowMessage(parent_container, MESSAGE.ACTIVATE)();
  }
}

function $MakeResizable(obj) {
  var d=11;
  var l,t,r,b,ex,ey,cur;
  // 这里存在内存泄露，不需要的时候Q.removeEvent
  // 由于FireFox的CaptureEvents不支持CaptureEvents指定的Element对象
  Q.addEvent(document, 'mousedown', mousedown);
  Q.addEvent(document, 'mouseup',   mouseup);
  Q.addEvent(document, 'mousemove', mousemove);

  function mousedown(evt){
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    Q.printf('mousedown out' + status);
    if( (status != CONST.SIZE_MAX) && (evt.button == Q.LBUTTON) && obj.style.cursor)
    {
      Q.printf('mousedown in' + status);
      $SetWindowStatus(obj, CONST.SIZE_RESIZING);
      if(obj.setCapture)
        obj.setCapture();
      else if(window.captureEvents)
        window.captureEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mouseup(evt) {
    evt = evt || window.event;
    var status = $GetWindowStatus(obj);
    if( ( status != CONST.SIZE_MAX ) && ( status == CONST.SIZE_RESIZING ) && ( evt.button == Q.LBUTTON ) )
    {
      Q.printf('mouseup in '+status);
      $SetWindowStatus(obj, CONST.SIZE_NORMAL);
      if(obj.releaseCapture)
        obj.releaseCapture();
      else if(window.releaseEvents)
        window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP);
    }
  }

  function mousemove(evt) {
    evt = evt || window.event;
    var srcElement = evt.srcElement || evt.target;
    var status = $GetWindowStatus(obj);
    if(( status & CONST.SIZE_MAX ) || ( $IsStyle(obj, CONST.fixed) ) || (status == CONST.SIZE_MIN))
    {
      //Q.printf('wrong status');
      return;  
    }
    if( status == CONST.SIZE_RESIZING ) {
      //Q.printf('move sizing.');  
      var dx=evt.screenX-ex;
      var dy=evt.screenY-ey;

      if(cur.indexOf('w')>-1) l+=dx;
      else if(cur.indexOf('e')>-1) r+=dx;
      if(cur.indexOf('n')>-1) t+=dy;
      else if(cur.indexOf('s')>-1) b+=dy;

      var s = obj.style;
      if(r-l > __GLOBALS.MIN_WIDTH){
        s.left=l+'px';
        s.width = (r-l) +'px';
      }

      if(b-t > __GLOBALS.MIN_HEIGHT){
        s.top= t+'px';
        s.height= (b-t)+'px';
      }

      $ResizeTo(obj, s.offsetWidth, s.offsetHeight);
      ex+=dx;
      ey+=dy;
    } else if( srcElement == obj ) {
      //Q.printf('caculate cursor style');  
      var x = evt.offsetX==undefined?evt.layerX:evt.offsetX;
      var y = evt.offsetY==undefined?evt.layerY:evt.offsetY;
      var c=obj.currentStyle;
      w=parseInt(c.width,  10);
      h=parseInt(c.height, 10);
      var current_style_left = parseInt(c.left, 10);
      var current_style_top  = parseInt(c.top, 10);

      //Q.printf('x='+x+';y='+y+';w='+w+';h='+h);
      // 计算鼠标样式
      cur=y<d?'n':h-y<d?'s':'';
      cur+=x<d?'w':w-x<d?'e':'';
      if(cur){
        obj.style.cursor=cur+'-resize';
        l=current_style_left;
        t=current_style_top;
        r=l+w;
        b=t+h;
        ex=evt.screenX;
        ey=evt.screenY;
      } else if(obj.style.cursor) {
        obj.style.cursor='';
      }
    } else {
      obj.style.cursor = '';
    }
  }
}


// 用于获取指定q:id属性的元素
function qid(p, q_id) {
  function find_item(e) {
    var r = null;
    for (var i = 0; i < e.childNodes.length; i ++) {
      var c = e.childNodes[i];
      if(c.nodeType === Q.ELEMENT_NODE) {
        if(c.getAttribute("q:id") == q_id) {
          r = c;
          break;
        } else {
          if(r = find_item(c))
            break;
        }
      }
    }
    return r;
  }
  return find_item(p);
}

/** 窗口类封装, 创建窗口，并返回一个窗口操作类
 *
 * @tutorial Q.Window 
 * @constructor 
 * @param {Object} config - 窗口构造参数
 * @param {Q.Application=} config.app - 窗口所属App
 * @param {Q.Window=} config.parent - 父窗口
 * @param {string=} config.wstyle - 窗口样式属性，{@link CONST} 使用"|"分割, 例如: "q-attr-no-title|q-attr-with-bottom"
 * @param {string=} config.title - 窗口标题
 * @param {number=} config.left - 窗口水平坐标
 * @param {number=} config.top - 窗口顶点垂直坐标
 * @param {number=} config.width - 窗口宽度
 * @param {number=} config.height - 窗口高度
 */
Q.Window = Q.extend({
/**
 * @type {WndNode}
 */
hwnd : null,
__init__ : function(config) {
  config = config || {};
  var _this = this;
  var title = config.title || 'not';
  var left  = config.left || 0;
  var top   = config.top || 0;
  var width = config.width || 600;
  var height= config.height || 400;
  var parent_wnd= $GetDesktopWindow();
  if(config.parent instanceof Q.Window) 
    parent_wnd = config.parent.wnd() || $GetDesktopWindow();
  this.hwnd = $CreateWindow(parent_wnd, title, config.wstyle, left, top, width, height, config.app);
  this.setContent(config.content);
  this.hwnd.on_size     = Q.bind_handler(this, config.on_size || function(w, h) {});
  this.hwnd.on_activate = Q.bind_handler(this, config.on_activate || function(activate) {});
  this.hwnd.on_move_begin = Q.bind_handler(this, config.on_move_begin || function(x,y) {});
  this.hwnd.on_move     = Q.bind_handler(this, config.on_move || function(x, y) {});
  this.hwnd.on_move_end = Q.bind_handler(this, config.on_move_end || function(x, y) {});
  this.hwnd.on_close    = Q.bind_handler(this, config.on_close || function() { return true; });
  Q.bind_handler(this, config.on_create || function() {})();
},

/** 返回窗口句柄 
 * 
 * @memberof Q.Window.prototype
 * @return {WndNode} 窗口句柄
 */
wnd : function() { 
  return this.hwnd; 
},

/** 设置窗口过程回调 
 * @memberof Q.Window.prototype
 */
setWindowProc : function(new_window_proc) { 
  return $SetWindowProc(this.hwnd, new_window_proc); 
},

/** 设置窗口坐标
 *
 * @memberof Q.Window.prototype
 * @param x - 水平位置
 * @param y - 垂直位置
 */
moveTo : function(x, y) {
  return $MoveTo(this.hwnd, x, y);
},

/** 设置窗口大小
 *
 * @memberof Q.Window.prototype
 * @param width - 窗口宽度
 * @param height - 窗口高度
 */
resizeTo : function(width, height) {
  $ResizeTo(this.hwnd, width, height);
},

/** 设置窗口叠加次序， 值越大越优先显示 
 * 
 * @memberof Q.Window.prototype
 * @param {number} zIndex - 叠加次序
 */
setZIndex : function(zIndex) { 
  $SetWindowZIndex(this.hwnd, zIndex);
},

/** 设置窗体客户区显示内容
 *
 * @memberof Q.Window.prototype
 * @param {dom|string} HTMLContent - 窗口内容可以是element也可以是字符串
 * 
 */
setContent : function(HTMLContent) {
  HTMLContent = HTMLContent || "";
  if(HTMLContent && HTMLContent.nodeType == Q.ELEMENT_NODE) {
    $GetClient(this.hwnd).appendChild(HTMLContent);
    HTMLContent.style.display = '';
  } else {
    $GetClient(this.hwnd).innerHTML = HTMLContent;
  }
},

/** 添加窗口样式 
 *
 * @memberof Q.Window.prototype
 * @param {string} ws - 窗口样式, 多个样式用"|"分割，参考{@link CONST}
 */
addStyle: function(ws)    { 
  Q.addClass(this.hwnd, ws);        
},

/** 删除窗口样式 
 *
 * @memberof Q.Window.prototype
 * @param {string} ws - 窗口样式, 多个样式用"|"分割，参考{@link CONST}
 */
removeStyle: function(ws) { 
  Q.removeClass(this.hwnd, ws);     
},

/**显示隐藏窗口 
 *
 * @memberof Q.Window.prototype
 * @param {bool} isVisibile - 显示隐藏窗口 
 */
show : function(isVisible) { 
  $ShowWindow(this.hwnd, isVisible) 
},

/** 窗口居中 
 *
 * @memberof Q.Widnow.prototype
 */
center : function() { 
  $CenterWindow(this.hwnd);         
},

/** 激活窗口
 *
 * @memberof Q.Window.prototype
 */
activate : function() {
  $BindWindowMessage(this.hwnd, MESSAGE.ACTIVATE)(); 
},

/** 根据窗口内容自动调整窗口大小
 *
 * @memberof Q.Window.prototype
 */
adjust : function() {
  $FitWindow(this.hwnd); 
},

/** 获取客户区q:id为q_id的元素
 *
 * @param {string} q_id - 元素属性q:id
 * @return {dom} 网页元素
 */
item: function(q_id) {
  return qid($GetClient(this.hwnd), q_id); 
}

});

/** 对话框类封装，支持模态和非模态
 *
 * @tutorial Q.Dialog 
 * @extends Q.Window
 * @constructor
 * @param {Object} config - 对话框构造参数, 构造参数继承自{@link Q.Window}
 * @param {array=} config.buttons - 按钮集合， 当buttons不为空，自动应用with_bottom样式
 */
Q.Dialog = Q.Window.extend({
old_window_proc : null,
__init__ : function(config) {
  config = config || {};
  config.wstyle = config.wstyle;
  config.wstyle += "|" + CONST.fixed;
  config.wstyle += "|" +CONST.no_min;
  config.wstyle += "|" +CONST.no_max;
  var buttons = [];
  if(config.buttons instanceof Array) {
    config.wstyle +="|" + CONST.with_bottom;
    buttons = config.buttons;
  } 
  Q.Window.prototype.__init__.call(this, config);
  this.old_window_proc = this.setWindowProc( (function(qwindow) {
    return function(hwnd, msgid, json) { return qwindow.window_proc(msgid, json);}
  })(this));
 
  // initialize buttons 
  for(var i=0; i < buttons.length; i++) {
    var button = buttons[i];
    var style = button.style || 'sysbtn';
    this.addBottomButton(button.text, style, (function(dialog, btn) { 
      return function() { if(btn.onclick()) { dialog.end(); }}})(this, button));
  }
},

/** dialog procedure
 * @memberof Q.Dialog.prototype
 * @private
 */
window_proc : function(msgid, json) {
  switch(msgid) {
  case MESSAGE.CLOSE:
    if(this.hwnd.modal_prev) {
      $MaskWindow(this.hwnd.modal_prev, false);
      this.hwnd.modal_prev.modal_next = null;
      this.hwnd.modal_prev = null;
    }
    break;
  }

  return this.old_window_proc(this.hwnd, msgid, json);
},

/**
 * 添加按钮到窗口底部按钮控制栏
 * @memberof Q.Dialog.prototype
 * @param {string} text - 按钮显示文字
 * @param {string=} className - 按钮样式
 * @param {function} click - 单击事件
 */
addBottomButton : function(text, className, click) {
  var _this = this;
  var ws = $GetWindowStyle(this.hwnd);
  
  if((!$IsStyle(this.hwnd, CONST.with_bottom)) || $IsNull($GetBottomBar(this.hwnd))) {
    return false;
  }
  var btn = document.createElement('button');
  $GetBottomBar(this.hwnd).appendChild(btn);
  btn.innerText = text;
  btn.onclick = click;
  btn.className = className;
  return true;
},

/** 模态显示对话框, 当前无任何激活窗口是，则会阻塞整个网页，否则会自动阻塞当前激活的窗口
 * 
 * @memberof Q.Dialog.prototype
 * @param {WndNode=} wndNode - 阻塞的窗口句柄
 */
domodal : function(wndNode) {
  //Q.printf('domodal window');
  if(!$IsWindow(wndNode)) {
    wndNode = $GetActiveChild($GetDesktopWindow());
    if(!$IsWindow(wndNode)) {
      wndNode = $GetDesktopWindow();
    }
  }
  $MaskWindow(wndNode, true);
  wndNode.modal_next = this.hwnd;
  this.hwnd.modal_prev = wndNode;
  
  this.show(true);
  $ResizeTo(this.hwnd, this.hwnd.nWidth, this.hwnd.nHeight);
  this.center();
  if($IsDesktopWindow(wndNode)) {
    this.setZIndex(100001);
  }
},

/** 销毁对话框
 * 
 * @memberof Q.Dialog.prototype
 * @param {number=} code - 销毁对话框返回值 
 */
end : function(code) {
  $BindWindowMessage(this.hwnd, MESSAGE.CLOSE)();
  if( arguments.length > 1 )  
    return arguments[1];
  else 
    return CONST.IDCANCEL;
}

}); // Q.Dialog

/** 模拟alert对话框， 构造参数继承
 * @see Q.Dialog
 * @function
 * @param {Object} json - 弹窗参数
 * @param {function=} json.on_ok - 按钮"是"
 * @param {function=} json.on_no - 按钮"否"
 * @param {function=} json.on_cancel - 按钮"取消"
 * @return {Q.dialog} 对话框
 */
Q.alert = function(json) {
var _alert = Q.Dialog.extend({
__init__: function(config) {
  config = config || {};
  config.width  = config.width  || 360;
  config.height = config.height || 200;
  config.buttons = [];
  config.on_ok = config.on_ok || function() { return true; };
  if( typeof config.on_ok == 'function' ) {
    this.on_ok = config.on_ok;
    config.buttons.push({text: Q.locale_text('qYes', ' 是 '), 
      onclick: Q.bind_handler(this, function() { this.on_ok() && this.end(CONST.IDOK); })})   
  }
  if( typeof config.on_no == 'function' ) {
    this.on_no = config.on_no;
    config.buttons.push({text: Q.locale_text('qNo', ' 否 '), style:'syscancelbtn', 
      onclick: Q.bind_handler(this, function() { this.on_no() && this.end(CONST.IDNO); })})   
  }
  if( typeof config.on_cancel == 'function' ) {
    this.on_cancel = config.on_cancel;
    config.buttons.push({text: Q.locale_text('qCancel', ' 取消 '), style:'syscancelbtn', 
      onclick: Q.bind_handler(this, function() { this.on_cancel() && this.end(CONST.IDCANCEL); })})   
  }
  Q.Dialog.prototype.__init__.call(this, config);
  this.domodal();
}
});

  return new _alert(json); 
} // Q.alert

/** wndx 模板加载器， 通过{@link Q.UI.template}方法获取指定id的dom克隆对象
 *
 * @constructor
 * @param {Object} json
 * @param {string} json.src - wndx模板文件路径， 引用路径时需要考虑的跨域问题，建议模板跟脚本一个路径
 * @param {Q.UI.callback} json.oncomplete - 加载结果回调
 */
Q.UI = Q.extend({
ui_iframe: null,
/**
 * @callback Q.UI.callback
 * @param {bool} success - wndx模板加载是否成功 
 */

__init__: function(json) {
  json = json || {};
  this.ui_iframe = document.createElement("IFRAME");
  this.ui_iframe.src=json.src;
  this.ui_iframe.onload = function() {    
    json.oncomplete(true);
  }
  
  this.ui_iframe.onerror= function() {
    json.oncomplete(false);
    document.body.removeChild(this);
  }
  this.ui_iframe.style.display = "none";
  this.ui_iframe.src=json.src;
  document.body.appendChild(this.ui_iframe);
},

/** 获取模板指定id的元素的克隆副本 
 *
 * @memberof Q.UI.prototype
 * @param {string} id - 元素id
 * @returns {dom} 如果id元素存在则返回该元素的克隆副本
 */
template: function(id) {
  var doc = this.ui_iframe.contentDocument || this.ui_iframe.contentWindow.document;
  var tpl = doc.getElementById(id);
  if(tpl)
    return tpl.cloneNode(true);

  return null;
},

/** 应用模板的样式到用户界面, 可根据需求调用，建议调用
 *
 * @memberof Q.UI.prototype
 */
bindCss : function() {
  // get ui style
	var heads = document.getElementsByTagName("head");
  var doc = this.ui_iframe.contentDocument || this.ui_iframe.contentWindow.document;
  for(var i=0; i < doc.styleSheets.length; i++) {
    var sheet =doc.styleSheets[i];
    if(!sheet) // no <style>
      return;
    var style;
    if(sheet.ownerNode.innerHTML == "" && (!!sheet.href)) {
      // link
      style=document.createElement("link");
	    style.setAttribute("type", "text/css");
	    style.setAttribute("rel", "stylesheet");
	    style.setAttribute("href", sheet.href);
    } else {
      var cssText = sheet.ownerNode.innerHTML;
      style=document.createElement("style");
	    style.setAttribute("type", "text/css");
	    if(style.styleSheet){// IE
		    style.styleSheet.cssText = cssText;
	    } else {// w3c
		    var textNode = doc.createTextNode(cssText);
		    style.appendChild(textNode);
	    }
    }
	  if(heads.length)
		  heads[0].appendChild(style);
	  else
		  document.documentElement.appendChild(style);
  } // for

}

}); // end of Q.ui
/*-------------------------------------------------------
 * slider.js
 * date: 2012-11-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

function find_item(root, cmp) {
  if(!root) 
    return null;

  var items = root.childNodes;
  for(var i=0; i < items.length; i++) {
    var item = items[i];
    if(cmp(item)) {
      return item;
    } else {
      var e = find_item(item, cmp);
      if(e)
        return e;
    }
  }

  return null;
}

/**
 * @constructor
 * 
 * @param {Object} config - 构造参数
 * @param {string} [config.type=vt] - 滑块类型， 水平(hr)或者垂直(vt) 默认
 * @param {number} [config.max=100] - 值域上限
 * @param {number} [config.min=0] - 值域下限
 * @param {number} [config.duration=1] - 滑动步长
 * @param {value}  [config.value=0] - 初始值
 * @param {Q.Slider.callback=} config.on_xscroll - 水平滑动监听回调   
 * @param {Q.Slider.callback=} config.on_yscroll - 水平滑动监听回调   
 */
Q.Slider = Q.extend({
  min : 0,
  max : 100,
  value : 0,
  duration  : 1,
  hwnd  : null,
  thumb : null,
  __init__: function(config) {
    var _this = this;
    config = config || {};
    this.type = (config.type == 'vt')?'vt':'hr';
    this.min = config.min;
    this.max = config.max;
    this.duration = config.duration || 1;
    this.value = (config.value)?config.value:0;
    if(typeof config.on_xscroll == 'function') {
      this.on_xscroll = config.on_xscroll;
    }
    if(typeof config.on_yscroll == 'function') {
      this.on_yscroll = config.on_yscroll;
    }
    this.hwnd = Q.$(config.id);
    this.thumb = find_item(this.hwnd, function(e) { return (e && e.nodeType == Q.ELEMENT_NODE) && (e.className.indexOf('q-thumb') >= 0); });
      
    if(this.thumb) {
      Q.drag({id: this.thumb, self: true, onmove: function(x, y) {
        if(_this.type != 'hr') {
          if(y < 0) 
            y = 0;
          if(y > (_this.hwnd.offsetHeight-_this.thumb.offsetHeight))
            y =  (_this.hwnd.offsetHeight-_this.thumb.offsetHeight);
          _this.value = Math.floor(_this.min + ((_this.max-_this.min)*(y*1.0)/(_this.hwnd.offsetHeight-_this.thumb.offsetHeight)));
          _this.on_yscroll(_this.value);
          _this.thumb.style.top = y + 'px';
        } else {          
          if(x < 0) 
            x = 0;
          if(x > (_this.hwnd.offsetWidth-_this.thumb.offsetWidth))
            x =  (_this.hwnd.offsetWidth-_this.thumb.offsetWidth);
          _this.value = Math.floor(_this.min + ((_this.max-_this.min)*(x*1.0)/(_this.hwnd.offsetWidth-_this.thumb.offsetWidth)));
          _this.on_xscroll(_this.value);
          _this.thumb.style.left = x + 'px';
        }
      }});
      _this.setValue(config.value);
    }
  },
  
  /** 获取当前滑块的值 
   * 
   * @memberof Q.Slider.prototype
   * @returns {number}  当前滑块值
   */
  getValue : function() {
    return this.value;
  },

  /** 设置滑块值, 设置后会触发滑块事件
   *
   * @memberof Q.Slider.prototype
   * @param {number} value - 值
   */
  setValue : function(value) {
    var _this = this;
    if(value > _this.max) {
      _this.value = _this.max;
    } else if(value < _this.min) { 
      _this.value = _this.min;
    } else {
      _this.value = value;
    }
    var f =  (_this.value-_this.min)*1.0/(_this.max-_this.min);
   
    if(_this.type != 'hr') {
      var y = Math.floor(f*(_this.hwnd.offsetHeight-_this.thumb.offsetHeight));	
      _this.on_yscroll(_this.value);
      _this.thumb.style.top = y + 'px';
    } else {
      var x = Math.floor(f*(_this.hwnd.offsetWidth-_this.thumb.offsetWidth));
      _this.on_xscroll(_this.value);
      _this.thumb.style.left = x + 'px';
    }
  },
  
  /** 滑动回调
   * @callback Q.Slider.callback
   * @param {number} value - 当前滑动的值
   */
  on_xscroll : function(value) {}, 
  on_yscroll : function(value) {}
}); 


/*-------------------------------------------------------
 * checkbox.js
 * date: 2012-10-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

/** 复选框
 * 
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string|dom} json.id - 渲染的元素对象
 * @param {bool} json.checked - 初始状态
 * @param {Q.CheckBox.callback} - onchange事件回调
 */
Q.CheckBox = Q.extend({
  hwnd: null,
  __init__: function(json) {
    json = json || {}
    this.hwnd = Q.$(json.id);
    this.onchange = json.onchange || function(id) {}
    this.setCheck(!!json.checked);
    this.hwnd.onclick = (function(t) { return function() {  
      t.setCheck(!t.checked()); 
    }})(this);
  },

  /** 获取check状态
   * 
   * @memberof Q.CheckBox.prototype
   * @returns {bool} 是否选中
   */
  checked : function() {
    return Q.hasClass(this.hwnd, "checked");
  },

  /** 设置勾选状态， 触发onchange事件
   *
   * @memberof Q.CheckBox.prototype
   * @param {bool} checked - 是否勾选
   */
  setCheck : function(checked) {
    if(this.checked() == checked) 
      return;
    if(checked) {
      Q.addClass(this.hwnd, "checked");
    } else {
      Q.removeClass(this.hwnd, "checked");
    }
    this.onchange(checked);
  }
});

// 当有true返回是，说明结束循环
var BindAsEventHandler = function(object, func) {
  return function(event) {
    return func.call(object, (event || window.event));
  };
};
 
/** 数据管理类
 * @constructor
 * @param {Object} config - 构造参数
 * @param {array=} config.data - 数据数组
 * @param {string} config.proxy - 远程数据接口
 */
Q.Store = Q.extend({
records : null,  // 记录集
proxy : null,
currentpage : -1,
__init__ : function(config) {
  config = config || {}; 
  this.records = new Q.HashMap;
  if(config.data)
    this.appendData(config.data);
  
  if(config.proxy) { 
    this.proxy = config.proxy; 
    this.loadRemote(0, 30, null);
  }
},

/** 清空数据
 *
 * @memberof Q.Store.prototype
 */
clear : function() {
  this.records = new Q.HashMap;
},

/** 加载json数据记录集
 * 
 * @memberof Q.Store.prototype
 * @param {Object[]} arr - 数据集
 */
appendData : function(arr) {
  for(var i=0; i<arr.length; i++) {
    this.push(arr[i]);
  }
},

/** 读取远程数据
 *
 * @memberof Q.Store.prototype
 */
loadRemote : function(page, pagesize, callback) {
  var _this = this;
  Q.Ajax({
    command: _this.proxy+'&page='+page+'&size='+pagesize,
    oncomplete : function(xmlhttp) {
      var s = Q.json_decode(xmlhttp.responseText);
      if(typeof callback == 'function') {
        callback(s.data);
      }
    }
  });
},
 
/** 加载页
 * 
 * @memberof Q.Store.prototype
 * @param page {number} - 指定页
 * @param pagesize {number} - 页大小
 * @param callback {function} - 回调
 */
loadPage : function(page, pagesize, callback) {
  var fnCallback = callback || function(arr) {};
  var _this = this;
    
  if(_this.proxy) {
    _this.loadRemote(page, pagesize, fnCallback);
  } else {
    var pagedata = new Q.HashMap;
    for(var i=(page-1) * pagesize; i < (page * pagesize); i++) {
      if(i >= _this.records.length) { break; }
      pagedata.push(_this.records.item(i));
    }
    fnCallback(pagedata);
  }
},

/** 添加记录
 * 
 * @memberof Q.Store.prototype
 * @param record {object} - 记录数据
 */
push : function(record) {
  var _this = this;
  record["__dataindex__"] = _this.records.index; // 存储数据索引， 用于确定改记录在记录集中的位置
  _this.records.push(record);
},
 
/** 删除一条记录
 *
 * @memberof Q.Store.prototype
 * @param record {object} - 删除的记录
 */
remove : function(record) {
  var key = this.records.find(record);
  this.records.remove(key);
},

/** 渲染数据接口
 *
 * @memberof Q.Store.prototype
 * @param fnHandler {Q.HashMap.each_handler} - 处理记录数据
 */
each : function(fnHanlder) {
  this.records.each(fnHanlder);
},
 
/** 获取指定索引数据
 *
 * @memberof Q.Store.prototype
 * @param index {number} - 索引
 * @return {object} 记录
 */
item : function(index) {
  return this.records[index];
}

});

var __TH = Q.extend({
  hwnd : null,
  hwnd_moveline : null,
  _width : 0,
  _fMove : null,
  _fStop : null,
  _isResizable : false,
  _isDragable  : false,
  _left : 0,
  _right: 0,
  _dx : 5,
  
  __init__ : function(TD, options) {
    options = options || {};
    this.onMove  = options.onMove  || function(oEvent, hander){};
    this.onStart = options.onStart || function(oEvent, hander){};
    this.onStop  = options.onStop  || function(oEvent, hander){};

    this.hwnd = TD;
    this._width = TD.offsetWidth;
    
    // moving line;
    this.hwnd_moveline = options.moveline;
    this.hwnd_moveline.style.display = 'none';
    
    //事件对象(用于绑定移除事件)
    this._fMove = BindAsEventHandler(this, this.Move);
    this._fStop = BindAsEventHandler(this, this.Stop);
    Q.addEvent(this.hwnd, "mousedown", BindAsEventHandler(this, this.Start));
    Q.addEvent(this.hwnd, "mousemove", BindAsEventHandler(this, this.Move));
  },
  
  Start : function(oEvent) {
    var pos = Q.absPosition(this.hwnd);
    
    if(this.hwnd.style.cursor) {
      this._isResizable = true;
      this._dx = pos.left + pos.width - oEvent.clientX;
      // 显示和定位法线
      this.hwnd_moveline.style.display = '';
      this.hwnd_moveline.style.left = (oEvent.clientX) + 'px';
      this.hwnd_moveline.style.top = (pos.top) + 'px';
      //this.div_moveline.style.height = (this.hwnd.offsetHeight - 1 - this.hwnd_title.offsetHeight) + 'px';
    }
    
    //mousemove时移动 mouseup时停止
    Q.addEvent(document, "mousemove", this._fMove);
    Q.addEvent(document, "mouseup", this._fStop);
    if(document.all){
      //焦点丢失
      Q.addEvent(this.hwnd, "losecapture", this._fStop);
      //设置鼠标捕获
      this.hwnd.setCapture();
    }else{
      //焦点丢失
      Q.addEvent(window, "blur", this._fStop);
      //阻止默认动作
      oEvent.preventDefault();
    };

    // extend interface
    this.onStart(oEvent, this);
  },
  
  //拖动
  Move : function(oEvent) {
    //alert("mousemove")
    var scrollinfo = Q.scrollInfo();
    if(this._isDragable ) {
      // on drag 
    } else if(this._isResizable) {
      if( this._left > oEvent.clientX ) {
        this.hwnd_moveline.style.left = this._left + 'px';
        return;
      }
      this.hwnd_moveline.style.left = oEvent.clientX + 'px';
    } else {
      var pos = Q.absPosition(this.hwnd);
      this._left = pos.left;
      this._right = pos.left + pos.width;
      var x = oEvent.clientX - scrollinfo.l;
      if( (x <= (this._right+3)) && (x >= (this._right-5)) ) {  
        // 是否在右边框1像素的范围内
        this.hwnd.style.cursor = 'col-resize';
      } else {
        this.hwnd.style.cursor = '';
      }
    }
    
    // extend interface
    this.onMove(oEvent, this);
  },
    
  //停止拖动
  Stop : function(oEvent) {
    this.hwnd_moveline.style.display = "none";
    if(this._isResizable) {
      this._width = oEvent.clientX - this._left + this._dx;
      this.hwnd.firstChild.style.width = (this._width) + 'px';
    }
    
    if(this._isDragable) {}
    // extend interface
    this.onStop(oEvent, this);
    //移除事件
    Q.removeEvent(document, "mousemove", this._fMove);
    Q.removeEvent(document, "mouseup", this._fStop);
    if(document.all){
      Q.removeEvent(this.hwnd, "losecapture", this._fStop);
      this.hwnd.releaseCapture();
    }else{
      Q.removeEvent(window, "blur", this._fStop);
    }
    
    this._isResizable = false;
    this._isDragable  = false;
  }
});




// 0 是单选， 1 代表多选 2代表shift键按下时的多选
var SELECT_MODE_CTRL  = 1;
var SELECT_MODE_SHIFT  = 2;

/**
 * Q.Table 表格控件
 *
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string} json.title - 表格标题
 * @param {Q.Store} json.store - 表格数据存储管理器
 * @param {Object[]} json.columns - 表格表头
 * @param {string} json.columns[].name - 表头列字段名
 * @param {string} json.columns[].title - 表头列标题
 * @param {string} json.columns[].align - 表头列文字对齐方式 "left", "center", "right";
 * @param {string} json.columns[].width - 表头列宽度
 * @param {bool} json.columns[].isHTML - 是否使用HTML渲染
 * @param {function} json.columns[].renderer - 渲染接口， 默认使用record["列字段名"]
 */


Q.Table = Q.extend({
wndParent : null,
wnd : null,
wndTitleBar : null,
wndFrame : null,
wndGroupHeader : null,
wndGroupBody : null,
wndToolbar : null,
wndTableHeaderRow : null,
wndTableData : null,
wndMoveLine : null,

columns: [],
evtListener : {},
store : null,
selected_row: null,
__init__ : function(json) {
  var _this = this;
  json = json || {};
  
  _this.title = json.title;
  _this.store = json.store;
  _this.columns = json.columns || [];

  // method overrides
  if(typeof json.row_onclick == 'function') {  
    _this.row_onclick = json.row_onclick; 
  }
  if(typeof json.row_ondblclick == 'function') {  
    _this.row_ondblclick = json.row_ondblclick; 
  }
  if(typeof json.row_onmouseover == 'function') { 
    _this.row_onmouseover = json.row_onmouseover; 
  }
  if(typeof json.row_onmouseout == 'function') {  
    _this.row_onmouseout = json.row_onmouseout; 
  }
  _this.row_ondblclick = (typeof json.row_ondblclick == 'function') ? json.row_ondblclick : function(row) {};
  _this.row_oninsert = (typeof json.row_oninsert == 'function') ? json.row_oninsert : function(row, record) {};

  // 初始化父窗口 wndParent,用来显示jtable控件
  // 并初始化jtable视图
  _this.wndParent = Q.$(json.id);
  _this.initview(json);

  _this.render();
  _this.autosize();
},

/**
 * 初始化表格空间视图
 *
 * @private
 * @memberof Q.Table.prototype
 */
initview : function(json) {
  var _this = this;
  _this.wnd = document.createElement('DIV');
    _this.wndTitleBar = document.createElement('DIV');
    _this.wndFrame = document.createElement('DIV');
      _this.wndGroupHeader = document.createElement('DIV');
    _this.wndGroupBody = document.createElement('DIV');
    _this.wndToolbar = document.createElement('DIV');
  
  //!移动法线
  _this.wndMoveLine = document.createElement('DIV');
  document.body.appendChild(_this.wndMoveLine);

  //! 组合主框架
  _this.wnd.appendChild(_this.wndTitleBar);
  _this.wnd.appendChild(_this.wndFrame);
    _this.wndFrame.appendChild(_this.wndGroupHeader);
    _this.wndFrame.appendChild(_this.wndGroupBody);
  _this.wnd.appendChild(_this.wndToolbar);

  //! 设置UI样式
  _this.wnd.className = "q-table";
    _this.wndTitleBar.className = "q-table-titlebar";
    _this.wndFrame.className = "q-table-frame";
      _this.wndGroupHeader.className = "q-group-header";
    _this.wndGroupBody.className = "q-group-body";
    _this.wndToolbar.className = "q-table-toolbar";
  _this.wndMoveLine.className = "q-table-moveline";
  
  _this.wndTitleBar.innerText = _this.title;
  // 在浏览器中渲染控件视图
  _this.wndParent.appendChild(_this.wnd);

  // 初始化表头表格和数据表格
  _this.wndGroupBody.innerHTML = 
    _this.wndGroupHeader.innerHTML = 
    '<table cellpadding="0" cellspacing="0" border="0"><tbody></tbody></table>';
  _this.wndTableHeaderRow = _this.wndGroupHeader.firstChild.insertRow(-1);
  _this.wndTableData = _this.wndGroupBody.firstChild;

  //init style
   if(json.wstyle) {
     var wstyle = (json.wstyle+"").replace(/\|+/g, " ");
     Q.addClass(this.wnd, wstyle);
   }
   if(!Q.hasClass(this.wnd, "q-attr-toolbar"))
     this.wndToolbar.style.display = "none";

  // 加载jtable的列
  _this.load_columns();

  // 添加事件
  _this.wndGroupHeader.onselectstart = function(evt) {return false;};
  _this.wndGroupBody.onscroll = function() { _this._sync_scroll(); };
  _this.wndGroupBody.onselectstart = function() { return false; };
},

/** 更新控件视图
 *
 * @memberof Q.Table.prototype
 */
autosize : function() {
  var _this = this;
  var frame_width, frame_height;
  var fullHeight = parseInt(_this.wndParent.offsetHeight, 10);
  var fullWidth  = parseInt(_this.wndParent.offsetWidth, 10);
  var currentstyle = _this.wnd.currentStyle;
  frame_height = fullHeight 
    - _this.wndTitleBar.offsetHeight 
    - _this.wndToolbar.offsetHeight
    //- parseInt(currentstyle['borderTopWidth'],10)
    //- parseInt(currentstyle['borderBottomWidth'],10)
    ;
  _this.wndFrame.style.height = frame_height+'px';
  _this.wndGroupBody.style.height = (frame_height - _this.wndGroupHeader.offsetHeight)+'px';
  _this.wndGroupHeader.style.width = _this.wndGroupBody.scrollWidth + 'px';
},  

// 滚动条同步
_sync_scroll : function() {
  this.wndGroupHeader.style.left = (-this.wndGroupBody.scrollLeft) + 'px';
  this.sync_scroll();
},

/** 设置表格样式
 * @memberof Q.Table.prototype
 * @param wstyle {string} - css样式属性
 * @return 无
 */
setStyle: function(wstyle) {
  Q.addClass(this.wnd, wstyle);
},

/** 移除表格样式
 * @memberof Q.Table.prototype
 * @param wstyle {string} - 移除的css样式属性
 * @return 无
 */
removeStyle: function(wstyle) {
  Q.removeClass(this.wnd, wstyle);
},

/** 在指定行添加一行
 * @memberof Q.Table.prototype
 * @param nIndex {number} - 插入行位置
 * @param record {object} - 初始化行数据
 * @return 无
 */
append : function(nIndex, record) {
  var _this = this;  
  var ROW = _this.wndTableData.insertRow(-1);
  ROW.onmouseover = (function(t, r) { return function() { 
    if(!t.row_is_enabled(r))
      return;
    if(t.row_is_selected(r)) 
      return;
    Q.addClass(r, "mouseover");
  }})(this, ROW);
  ROW.onmouseout  = (function(t, r) { return function() { 
    if(!t.row_is_enabled(r))
      return;
    if(t.row_is_selected(r)) 
      return;
    Q.removeClass(r, "mouseover");
  }})(this, ROW);
  ROW.onclick = (function(t, r) { return function(evt) {
    if(r.clickonce) {
      r.clickonce = false;
      clearTimeout(r.t);
      t._rows_ondblclick(r);
    } else {
      r.clickonce = true;
      r.t = setTimeout((function(b) { return function() { 
      b.clickonce = false; t._rows_onclick(r); 
    }})(r), 200);
    }
    return false;
  }})(this, ROW);
  ROW.setAttribute('__dataindex__', record['__dataindex__']);  // 设置数据索引
  ROW.data = record;
  var len = _this.wndTableHeaderRow.cells.length;
  for(var j = 0; j < len; j++) {
    var TD = ROW.insertCell(-1);
    var theader = _this.wndTableHeaderRow.cells[j];
    var column = _this.columns[theader.getAttribute('_index')];
    var content = record[column.name];
    if(typeof column.renderer == 'function') {
      content = column.renderer(record);
    }
    
    var width = column.width;
    var cell = _this._create_cell(ROW.rowIndex, j, { content : content,
      align : column.align,
      className: column.className,
      width : width,
      height : 30 ,
      isHTML : column.isHTML
    });
    TD.style.display = theader.style.display;
    TD.appendChild(cell);
  }

  _this.row_oninsert(ROW, record);
},


_create_cell : function(nRow, nCol, json) {
  // 根据json对象创建多样化的TD单元格
  var _this = this;
  var DIV = document.createElement('DIV');
  DIV.className = "q-table-cdata";
  if(json.className) {
    DIV.className += ' ' + json.className;
  }
  DIV.align = json.align;
  DIV.style.cssText = 'width:'+(json.width) + 'px; height:'+json.height + 'px;line-height: '+json.height+'px;';
  DIV.innerHTML = json.content;
  //if(json.isHTML)  DIV.innerHTML = json.content;
  //else DIV.innerText = json.content;
  return DIV;
},

/** 清除表格视图数据
 *
 * @memberof Q.Table.prototype
 */
clear : function() {
  this.store.clear();
  this.wndTableData.innerHTML = ""; //removeChild(_this.wndTableData.firstChild);
},

/** 追加数据到表格视图 
 *
 * @memberof Q.Table.prototype
 * @param data {Object[]} - 数据记录集
 */

appendData : function(data) {
  this.store.appendData(data);
},

render : function() {
  this.store.each((function(t) { return function(record, index) {
    t.append(index, record);
  }})(this));
},

load_columns : function() {
  for(var i=0; i < this.columns.length; i++) {
    var column = this.columns[i];
    column.width = parseInt(column.width, 10);
    this.insert_column(i, column);
  }
},

insert_column : function(arrIndex, json) {
  var _this = this;
  var TD = _this.wndTableHeaderRow.insertCell(-1);
  
  json.isHidden = !!json.isHidden;
  TD.style.display = json.isHidden ? 'none' : '';
  TD.setAttribute('_index', arrIndex);
  TD.innerHTML = '<DIV align="'+json.align+'" class="q-column-header" style="width:'+json.width+'px;"><a HideFocus>'
          +json.title+'</a></DIV>';
  
  TD.firstChild.onclick = function() { _this._column_click(this.parentNode.cellIndex); };

  //!固定宽度
  if(!json.fixed) {
    new __TH(TD, {moveline: _this.wndMoveLine, 
      onStart: function(evt, handler) { 
        _this._column_MouseDown(evt, handler); 
      }, 
      onStop: function(evt, handler) { 
        _this._column_MouseUp(evt, handler); 
      }
    });
  }
},

/** 排序函数原型
 * @callback Q.Table.sortFn
 *
 * @param row1 {dom} - 一个Row
 * @param row2 {dom} - 另一个Row
 * @return {number} 0 - 相等， -1 - 小于， 1 - 大于
 */
/** 指定列排序函数 
 *
 * @memberof Q.Table.prototype
 * @param colIndex {number} - 列号，从0开始
 * @param sortFunc {Q.Table.sortFn} - 排序函数
 */ 
setSortFunc: function(colIndex, sortFunc) {
  var _this = this;
  var column = _this.columns[colIndex];
  if(column) {
    column.sort = sortFunc;
  } else {
    alert('Invalid Column');
  }
},
  
_column_MouseDown : function(evt, handler) {
  var _this = this;
  if(handler._isResizable) {
    _this.wndMoveLine.style.height = 
      (_this.wnd.offsetHeight - _this.wndTitleBar.offsetHeight) + 'px';
  }
},
  
_column_MouseUp : function(evt, handler) {
  var _this = this;
  var TD = handler.hwnd;
  if(handler._isResizable) {
    var nCol = TD.cellIndex;
    _this.rows_each( function(row) { 
      var div = row.cells[nCol].childNodes[0];
      div.style.width = handler._width+'px'; 
    });
    _this.autosize();
    _this._sync_scroll();
  }
},

//! 列表头单击事件
_column_click : function(nCol) {
  var column = this.columns[nCol];
  // 出示排序函数
  if(column.sort) {
    //this.sortTable(nCol, true, column.sort);
  }
  
  if(column&&column.clicks) {
    for(var i=0; i<column.clicks.length; i++) {
      column.clicks[i]();
    }
  }
},
  

  
// 处理鼠标单击事件，处理之后传递给外部接口_rows_onclick
_rows_onclick : function(row) {
  var _this = this;
  if(!this.row_is_enabled(row))
    return false;
  Q.removeClass(row, "mouseover");
  
  // 不支持多选
  if(!Q.hasClass(this.wnd, "q-attr-multiselect")) {
    if(row == this.selected_row)
      return false;
    this.row_set_selected(row, true);
    this.row_set_selected(this.selected_row, false);
    this.selected_row = row;
  } else {
    if(_this.select_mode == SELECT_MODE_CTRL) { // CTRL键按下时
      _this.row_set_selected(row,!_this.row_is_selected(row));  
    } else if(_this.select_mode == SELECT_MODE_SHIFT) { // SHIFT键按下时
    } else {
      _this.rows_selected.each( function(node, key) { 
          _this.row_set_selected(_this.rows_selected.item(key),false);
      });
      _this.row_set_selected(row, true);
    }
  }
  if(_this.row_onclick)
    _this.row_onclick(row);
},

_rows_ondblclick : function(row) {
  if(!this.row_is_enabled(row)) {
    return false;
  }
  if(this.row_ondblclick)
    this.row_ondblclick(row);
},
  

rows_each : function(callback) {
  var _this = this;
  for(var i=0; i < _this.wndTableData.rows.length; i++) {
    callback(_this.wndTableData.rows[i]);
  }
},

row_enable : function(row, enabled) {
  var _this = this;
  // 设置选中颜色
  //row.style.backgroundColor = '#DFE8F6'; //'#A2CAEA'
},
  
row_remove : function(row) {
  var _this = this;
  var record = _this.store.records[_this.row_index(row)];
  _this.wndTableData.deleteRow(row.rowIndex);
  _this.store.remove(record);
  _this.autosize();
},
  
row_insert : function(index, record) {
  var _this = this;
  _this.store.push(record);
  _this.insertrow(index, record);
  _this.autosize();
},

row_index : function(row) { 
  return parseInt(row.getAttribute('__dataindex__'),10); 
},
row_is_enabled  : function(row) { return row && (!row.getAttribute('_disabled')); },
row_is_selected : function(row) { return Q.hasClass(row, "q-selected"); },

// 设置选择
rows_selected_all : function(bSelectAll) {
  var _this = this;
  _this.rows_each(function(row) {
    _this.row_set_selected(row, bSelectAll);
  });
},  
  
row_set_selected : function(row, bSelected) {
  if(this.row_is_enabled(row)) {
    var dataIndex = this.row_index(row);
    // 设置颜色
    if(bSelected) {
      Q.addClass(row, "q-selected");
    } else {
      Q.removeClass(row, "q-selected");
    }      
  }  
},

/**
 * 获取行记录数据
 * @memberof Q.Table.prototype
 * @param {dom} row - 行元素
 * @return {Object} 返回行记录
 */
getRecord : function(row) {
  var dataIndex = this.row_index(row);
  return this.store.records.item(dataIndex);
},

sync_scroll : function() {}
}); 


/** 下拉控件
 *
 * @tutorial Q.DropDownList
 *
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string|dom} json.id - 渲染select元素id
 * @param {string} json.wstyle - 用户定义CSS样式
 * @param {function} json.on_change - 值变化事件回调
 */

Q.DropDownList = Q.extend({
hwnd: null,
drop_wnd: null,
ctrl: null,
__init__: function(json) {
  var _this = this;
  this.hwnd = document.createElement('BUTTON');
  this.hwnd.className = 'q-select';
  Q.addClass(this.hwnd, json.wstyle);
  this.on_change =  json.on_change || function(text, value) {};
  this.ctrl = Q.$(json.id);
  this.ctrl.parentNode.insertBefore(this.hwnd, this.ctrl);
  this.ctrl.onchange = ( function(o, c) {
    return function(evt) {
      Q.printf("ctrl onchage");
      o.on_item_changed(c.options[c.selectedIndex].text, c.options[c.selectedIndex].value);
    }
  })(this, this.ctrl);
  var bar = new Q.MenuBar();
  this.drop_wnd = new Q.Menu({
    style: json.wstyle, 
    on_popup: function(popup) {
      if(popup)
        Q.addClass(_this.hwnd, "checked");
      else
        Q.removeClass(_this.hwnd, "checked");
    }
  });
  if(this.ctrl.tagName.toLowerCase() == "select") {
    var len = this.ctrl.options.length;
    for(var i=0; i < len; i++) {
      var m4 = new Q.MenuItem({text: this.ctrl.options[i].text, data: i, callback: Q.bind_handler(_this, _this.on_menu_clicked)});
      this.drop_wnd.addMenuItem(m4);
      if(i == this.ctrl.selectedIndex) {
        this.setValue(this.ctrl.options[i].value);
        this.setText(this.ctrl.options[i].text);
      }
    }
  }
  this.drop_wnd.hide(); 
  bar.append(this.hwnd, this.drop_wnd);
  if(json.value) {
    this.setValue(json.value);
  }
},

on_menu_clicked: function(menu) {
  Q.printf(menu.data);
  var index = menu.data;
  if(index == this.ctrl.selectedIndex) {
    return;
  } else {
    this.setValue(this.ctrl.options[index].value);
  }
},

on_item_changed : function(text, value) {
  this.setText(text);
  this.on_change(text, value);
},

/** 设置下拉显示文本
 *
 * @memberof Q.DropDownList.prototype
 * @param {string} text - 文本内容
 */
setText : function(text) {
  
  if(this.trim(this.hwnd.innerText) == this.trim(text)) {
    return false;
  } else {
    this.hwnd.innerText = this.trim(text);
  }

  return true;
},

/** 设置下拉控件值，不可见
 * 
 * @memberof Q.DropDownList.prototype
 * @param {string} value - 下拉控件值
 */
setValue : function(value) {
  var e = this.ctrl;
  var selected_index = this.ctrl.selectedIndex;
  for(var i=0;i<e.options.length;i++) {
    if(e.options[i].value == value) {
      if(selected_index != i) {
        e.options[i].selected = true;
        this.on_item_changed(e.options[i].text, e.options[i].value)
        return true;
      }
      break;
    }
  }

  return false;
},
 
trim : function(s) {
  return s.replace(/&nbsp;/, '');
},

}); // code end


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

Q.SimpleOS = Q.extend({
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
  g_os_start_menu = new Q.Menu({
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

  var m1 = new Q.MenuItem({
    text: "系统设置",
    callback : function(menuitem) {
      if(!g_os_setting) {
        g_os_setting = new Q.Dialog({
          wstyle: json.skin,
          title: "系统设置", width:480, height:370, on_close: function() { delete g_os_setting; g_os_setting=null; }});
      }
      g_os_setting.setContent("simpleos system setting");
      g_os_setting.show(true);
      g_os_setting.center(); 
    }
  });

  var m2 = new Q.MenuItem({text: "程序", popup_style: "os-start-menu"});
  var m3 = new Q.MenuItem({type: MENU_SEPERATOR, text: ""});
 
  var m4 = new Q.MenuItem({
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
    var m2x = new Q.MenuItem({
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
    Q.loadModule(app.src, function(ok) {
      if(!ok) {
        _this.run_error(app, err + "<br>" + " File("+app.src+") is error.");
        return;
      }
      
      Q.printf("load from file and create app ok");
      app.klass = app_class;
      // load ui
      app.ui_runtime = new Q.UI({src: app.ui, oncomplete: function(ok) {
        // init app instance
        Q.printf("load ui -> " + (ok?"ok":"failed"));
        //try {
          _this.create_instance(app); 
        //} catch(e) {
        //  _this.run_error(app, err + "<br>" + e.description);
        //}
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


/*------------------------------------------------------------------------------------
 $ class Q.PlaceHolder
 $ date: 2015-1-5 16:31
 $ author: Q http://jshtml.com
 
 $ bugs Fixed:
--------------------------------------------------------------------------------------*/

Q.PlaceHolder = Q.extend({
hwnd : null, 
holder: null,
__init__ : function(json) {
  json = json || {};
  this.hwnd = Q.$(json.id);
  this.holder = Q.$(json.holder);
  Q.addEvent(this.hwnd, "blur", Q.bind_handler(this, this.onblur));
  Q.addEvent(this.hwnd, "focus", Q.bind_handler(this, this.onfocus));
  this.checkValue();
},

onblur : function() {
  this.checkValue();
},

onfocus : function() {
  Q.addClass(this.hwnd, "q-inplace");
},

checkValue : function() {
  if(this.hwnd.value != "") {
    // show place holders
    Q.addClass(this.hwnd, "q-inplace");
  } else {
    Q.removeClass(this.hwnd, "q-inplace");
  }
}

});



/*--------------------------------------------------------------------------------
 $ 类名：__simpleTreeL
 $ 功能：通用树操作
 $ 日期：2008-10-09 23:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
 $ 整理控件代码，集成到QLib库
----------------------------------------------------------------------------------*/


// handle event listen
var BindHandler = function(object, func) {
  return function() {
    return func.apply(object, arguments);
  };
};
 
var BindAsEventHandler = function(object, func) {
  return function(evt) {
    return func.call(object, (evt || window.event));
  };
};

var CurrentStyle = function(element){
  return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

var TREEITEM_NULL     = -1;  // 不存在的节点
var TREEITEM_NOSELECTED = -2;  // 没有任何节点被选择

var TREEITEM_DRAG_NONE  = 0;
var TREEITEM_DRAG_TOP  = 1;
var TREEITEM_DRAG_CENTER= 2;
var TREEITEM_DRAG_BOTTOM= 3;


function treeNode(idx, parentId, level, isopen, text, isLastChild) {
  this.parent  = parentId;  // 父节点的id
  this.idx  = idx;    // 自身id
    this.level  = level;
  this.isLastChild = (isLastChild);
  this.isopen    = isopen;  // 当前的打开状态
  this.lastChild  = TREEITEM_NULL;  
  this.firstChild = TREEITEM_NULL;
  this.text    = text;    // 显示的文本信息
  this.hwnd    = null;    // 节点区域
  this.subarea  = null;    // 子节点区域
  this.textNode  = null;    // 节点信息
  this.expand     = null;   // 节点折叠控制
}
 

var __InitDragItem = Q.extend(
{
  hwnd : null,
  _fMove : null,
  _fStop : null,
  
  __init__ : function(itemWnd, options) {
    options = options || {};
    this.onMove  = options.onMove  || function(oEvent, hander){};
    this.onStart = options.onStart || function(oEvent, hander){};
    this.onStop  = options.onStop  || function(oEvent, hander){};

    this.hwnd = itemWnd;
    //this._width = TD.offsetWidth;

    //事件对象(用于绑定移除事件)
    this._fMove = BindAsEventHandler(this, this.Move);
    this._fStop = BindAsEventHandler(this, this.Stop);
    Q.addEvent(this.hwnd, "mousedown", BindAsEventHandler(this, this.Start));
    // Q.addEvent(this.hwnd, "mousemove", BindAsEventHandler(this, this.Move));
  },
  
  Start : function(oEvent) {
    oEvent = oEvent || window.event;
    //mousemove时移动 mouseup时停止
    Q.addEvent(document, "mousemove", this._fMove);
    Q.addEvent(document, "mouseup", this._fStop);
    if(document.all){
      //焦点丢失
      Q.addEvent(this.hwnd, "losecapture", this._fStop);
      //设置鼠标捕获
      this.hwnd.setCapture();
      oEvent.cancelBubble = true;
    }else{
      //焦点丢失
      Q.addEvent(window, "blur", this._fStop);
      //阻止默认动作
      oEvent.preventDefault();
    };

    oEvent.cancelBubble = true;

    // extend interface
    this.onStart(oEvent, this);
  },
  
  //拖动
  Move : function(oEvent) {
    oEvent = oEvent || window.event;
    // extend interface
    this.onMove(oEvent, this);
  },
    
  //停止拖动
  Stop : function(oEvent) {
    oEvent = oEvent || window.event;
    // extend interface
    this.onStop(oEvent, this);
    //移除事件
    Q.removeEvent(document, "mousemove", this._fMove);
    Q.removeEvent(document, "mouseup", this._fStop);
    if(document.all){
      Q.removeEvent(this.hwnd, "losecapture", this._fStop);
      this.hwnd.releaseCapture();
    }else{
      Q.removeEvent(window, "blur", this._fStop);
    }
  }
});


Q.Tree = Q.extend(
{
//! hwnd 树的主窗口容器， hwndTree： 树窗口
//! 结构 
//  <div class="simpletree_container simpletree">
//    <ul class=""> 树节点 </ul>
//  </div>
hwnd : null,
hwndTree : null,
hwndAccept : null,
hwndMoveLine : null,

//! 保存树节点映射表
// 
ID2Nodes : null,   
// ItemData2Nodes : null,
selected : TREEITEM_NOSELECTED,
idx : -1,
isdraging : false,
ismoved : false,
dragtype : TREEITEM_DRAG_NONE,
Acceptable : false,
onMoveLineMove_ : null,


// 初始化，构造树
__init__ : function(json) {
  var _this = this;
  json = json || {};
  _this.ID2Nodes = {};
  _this.Acceptable = !!json.Acceptable;
  _this.onItemAccept = json.onItemAccept || function(srcid, targid) {};
  _this.onMoveLineMove_ = Q.bind_handler(this, this.onMoveLineMove);
  _this.onContextMenu = json.onContextMenu || function(nItem, evt) {};
  //! 创建容器
  _this.hwnd = document.createElement('DIV');
  _this.hwndTree = document.createElement('ul');
  _this.hwndMoveLine = document.createElement('fieldset');
  document.body.appendChild(_this.hwndMoveLine);

  var nRootItem = this.createNode(-1, json.name, !!json.open);
  var node = this.getItemNode(nRootItem);
  Q.addClass(node.hwnd, "q-root");  
  //! 隐藏根节点的expand
  _this.hwndTree.appendChild(node.hwnd);
  _this.hwnd.appendChild(_this.hwndTree);
        
  _this.hwnd.className = 'q-simpletree';
  _this.hwndMoveLine.className = 'moveline';
  _this.hwndMoveLine.style.display = 'none';
    //! 渲染树
  var render = Q.$(json.id);
  render.appendChild(_this.hwnd);
},

//! 渲染整个树
// json格式：
// {
//  text: "textName"
//  root : "rootValue"
//  key : "keyname", 
//  parentkey: "parentKeyName",
//  data : [{...}]
// }
//
//
render : function(json) {
  this.dorender(0, json, json.root);
},

query : function(json, parentKey, parentValue) {
  var newArr = [];
  var len = json.data.length;
  for(var i=0; i<len; i++) {
    if(json.data[i][parentKey] == parentValue) {
      newArr.push(json.data[i]);
    }
  }
  return newArr;
},

dorender : function(parentTreeItem, json, parentValue) {
  var children = this.query(json, json.parentKey, parentValue);
  var len = children.length;
  for(var i=0; i<len; i++) {
    var item = children[i];
    var n = this.createNode(parentTreeItem, item[json.text],true);
    this.dorender(n, json, item[json.key]);
  }
},
    
getRoot : function() {  return 0; },
  
getSelectedItem : function() {
    if(this.selected == TREEITEM_NOSELECTED) {
        return TREEITEM_NULL;
    }
    return this.selected;
},

setItemSelected : function(nItem) {
  var _this = this;
  var selectedItem = _this.getSelectedItem();
  if(selectedItem == nItem) return;
  
  var node = _this.getItemNode(nItem);
  if(node) {
    node.link.style.background = '#C2CFF1'; 
    _this.selected = nItem; 
  }
  
  var selectedNode = _this.getItemNode(selectedItem);
  if(selectedNode) {
    selectedNode.link.style.background = '';
  }  
},

setItemIcon : function(nItem, iconClassName) {
  var node = this.getItemNode(nItem);
  if(node) {
    node.icon && (node.icon.className = 'icon '+ iconClassName);
  }
},
  
setItemLink : function(nItem, href) {
  var node = this.getItemNode(nItem);
  if(node) {
    node.link && (node.link.href=href);
  }
},

setItemText : function(nItem, text) {
  var node = this.getItemNode(nItem);
  if(node)
    node.textNode.innerText = text;
},
  
getItemText : function(nItem) {
  var node = this.getItemNode(nItem);
  if(node)
      return node.textNode.innerText;
  else
      return '';
},
  
setItemData : function(nItem, data) {
    var _this = this;
    var node = _this.getItemNode(nItem);
    var oldData = node.hwnd.data;
    node.hwnd.data = data;
    // _this.ItemData2Nodes[data] = node;
    return oldData;
},
  
getItemData : function(nItem) {
    var item = this.getItemNode(nItem);
    return item.hwnd.data;
},
  
getItemNode : function(nItem) {
  return this.ID2Nodes[nItem];
},
  
getItemByData : function(data) {

  for(var id in this.ID2Nodes) {
    var node = this.getItemNode(id);
    if(node.hwnd.data == data) {
      return node;
    }
  }

  return null;
},
  
// 获得下一个兄弟节点
getNextItem : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  if(!node) {  return TREEITEM_NULL; }
  var hwnd = node.hwnd.nextSibling;
  if(!hwnd) {  return TREEITEM_NULL; }
  return hwnd.idx;
},

getPrevItem : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  if(!node) {
    return TREEITEM_NULL;  
  }
  var hwnd = node.hwnd.previousSibling ;
  if(!hwnd) {
    return TREEITEM_NULL;
  }
  return hwnd.idx;
},

getParent : function(nItem){
  var node = this.getItemNode(nItem);
  if(!node) { return TREEITEM_NULL; }
  return node.parent;
},

getLastChild : function(nItem) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
  if(Node == null) { return TREEITEM_NULL; }
  return Node.lastChild;
},
  
getFirstChild : function(nItem) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
  if(Node == null) { return TREEITEM_NULL; }
  return Node.firstChild;
},

createNode : function(parentId, text, isopen, isshow) {
  var _this = this;
  //! 
  var isLastChild = true;
  //! id递增
  _this.idx++;
  //! 要创建的树节点
  var node = null;
  //! 节点 id
  var id = _this.idx;
  //! 父节点
  var parentNode = _this.getItemNode(parentId);
  //! 层次
  var level = 0;
  
  if(parentNode) {
    level = parentNode.level+1;
    parentNode.expand.expandable = true;
    //! 子节点
    // 追加在末尾节点的时候， 首先将末尾节点转换成非末尾节点，在将parentNode的lastChild指向新创建的节点
    var lastChildNode = _this.getItemNode(parentNode.lastChild);
    if(lastChildNode) {
      lastChildNode.isLastChild = false;
      if(lastChildNode.expand.expandable) {
        if(lastChildNode.subarea.style.display=='') {
          lastChildNode.expand.className = 'expand expand_on';
        } else {
          lastChildNode.expand.className = 'expand expand_off';
        }
      } else {
        lastChildNode.expand.className = 'expand child';
      }
      //exchangeClassName(,'last_child','child');
    }
    if(parentNode.firstChild == TREEITEM_NULL) {
      parentNode.firstChild = id;
            
      var className = 'expand_';
      if(parentNode.isLastChild) {
        className = 'last_expand_';
      }
      if(parentNode.subarea.style.display == '') {
        className += 'on';
      } else {
        className += 'off';
      }
      //alert(parentNode.expand.className);  
      parentNode.expand.className = 'expand '+className;
    }
    parentNode.lastChild = id;
  }

  node = new treeNode(id, parentId, level, isopen, text, isLastChild);
  _this.ID2Nodes[id]=node;
    
  node.hwnd   = document.createElement('li');
  node.hwnd.idx = id;
  node.expand = document.createElement("DIV");
  node.link = document.createElement("A");
  node.icon = document.createElement("SPAN");
  node.textNode = document.createElement("SPAN");
  node.subarea = document.createElement("ul");
  node.expand.expandable = false;
    
  node.hwnd.className = 'q-tree-item';
  node.expand.className = 'expand last_child';
  node.expand.style.left = ((level)*20)+'px';
  node.link.style.paddingLeft = ((level)*20+25) + 'px';
    
  //! link style
  node.icon.className = 'icon default';
  node.textNode.className = 'textNode';
  node.subarea.className = '';    // line
    
  node.textNode.innerText = node.text;  // + '-' + id;
  node.textNode.href = '#';
  node.textNode.idx = id;
   node.link.idx = id;

  /*
   new __InitDragItem(node.link, {
    'onStart': function(evt, handler) { _this.onStart(evt, handler); },
    'onMove':  function(evt, handler) { _this.onMove(evt, handler); },
    'onStop':  function(evt, handler) { _this.onStop(evt, handler); }
  });
  */
  node.link.onclick = function() {
    _this.itemClick(this.idx);
    _this.setItemSelected(this.idx);
  };

  node.link.oncontextmenu = function(evt) {
      // this.fireEvent('onclick');
      _this.itemClick(this.idx);
      _this.setItemSelected(this.idx);
      _this.onContextMenu(this.idx, evt);
      return false;
  };
  node.link.onselectstart = function(){ return false;};
  node.link.ondblclick=function(){
      _this.itemDblClick(this.idx);
    return false; 
  };
    
  node.expand.onclick = function() {
    _this.expandClick(_this.idx);
    var className = '';
    if(node.isLastChild) { className = 'last_'; }
    if(this.expandable) {
      className += 'expand_';
      if(node.subarea.style.display=='none') {
        node.subarea.style.display='';
        className += 'on';
      } else {
        node.subarea.style.display='none';
        className += 'off';
      }
      this.className = 'expand ' + className;
    }
  };
        
  node.link.appendChild(node.icon);
  node.link.appendChild(node.textNode);
  node.hwnd.appendChild(node.expand);
  node.hwnd.appendChild(node.link);
  node.hwnd.appendChild(node.subarea);
  
  if(parentNode) {
    parentNode.subarea.appendChild(node.hwnd);
  } else {
    _this.hwndTree.appendChild(node.hwnd);
  }
    
  return id;    
},

expand : function(nItem, toTop) {},
  
remove : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  var parentNode = _this.getItemNode(node.parent);
  
  // 节点不存在
  if((!node) ||(!parentNode)) { return null; }

  var firstChild = parentNode.firstChild;
  var lastChild = parentNode.lastChild;
  
  if(firstChild == lastChild) {
    // 只有一个子节点
    parentNode.expand.expandable = false;
    parentNode.firstChild = TREEITEM_NULL;
    parentNode.lastChild = TREEITEM_NULL;
  } else {
    if(firstChild == nItem) {
      // 删除的是第一个节点
      var nextItem = _this.getNextItem(nItem);
      var nextNode = _this.getItemNode(nextItem);
      parentNode.firstChild = nextItem;
      _this.MeasureNodeExpand(nextNode);
    } else if(lastChild == nItem){
      // 删除的是最后一个节点
      var prevItem = _this.getPrevItem(nItem);
      var prevNode = _this.getItemNode(prevItem);
      parentNode.lastChild = prevItem;
      prevNode.isLastChild = true;
      _this.MeasureNodeExpand(prevNode);
    }
  }
  _this.MeasureNodeExpand(parentNode);    
  node.hwnd.parentNode.removeChild(node.hwnd);
  //delete _this.ID2Nodes[nItem];

  return node;
},


// 将已存在的节点移动到指定的父节点上
appendChild : function(nNewItem, nParentItem) {
  var _this = this;
  var parentNode = _this.getItemNode(nParentItem);
    var node = _this.getItemNode(nNewItem);
  if(!parentNode) { return false; }

    // 检测nParentItem不能为nNewItem的子节点的子节点，
    // 不允许将自己插入自己的子节点
    var pItem = nParentItem;
    while(pItem != TREEITEM_NULL) {
        if(nNewItem == pItem) {
            return false;
        }
        pItem = _this.getParent(pItem);
    }
    
  var removeNode = _this.remove(nNewItem);
  node.level = parentNode.level+1;
  node.parent = nParentItem;
  parentNode.expand.expandable = true;

  // 无子节点
    if(parentNode.firstChild == TREEITEM_NULL) {
    parentNode.firstChild = nNewItem;
  } else {
    //! 存在子节点， 将最后一个节点设置为非子节点
    var lastChild = _this.getLastChild(nParentItem); 
    if(lastChild != TREEITEM_NULL) {
      var lastChildNode = _this.getItemNode(lastChild);
      lastChildNode.isLastChild = false;
      _this.MeasureNodeExpand(lastChildNode);
    }
  }
  
  node.isLastChild = true;
  parentNode.lastChild = nNewItem;
  // 自动设置节点的样式
  _this.MeasureNodeExpand(parentNode);
  _this.MeasureNodeExpand(node);

  // 插入nNewItem DOM操作
    var subarea = parentNode.subarea;
  subarea.appendChild(removeNode.hwnd);
  node.expand.style.left = ((node.level-1)*20)+'px';
  node.link.style.paddingLeft = ((node.level-1)*20+25) + 'px';
  _this.updateItemIntent(nNewItem);

},

traverseNode : function(nItem, lpCallBack) {
  var node = this.getItemNode(nItem);
  for(var i=0; i < node.subarea.childNodes.length; i++) {
    if(lpCallBack) {
      if(!lpCallBack(node.subarea.childNodes[i].idx, lpCallBack)) {
        return false;
      }
    }
    if(!this.traverseNode(node.subarea.childNodes[i].idx, lpCallBack)) {
      return false;
    }
  }
  return true;
},

MeasureNodeExpand : function(Node) {
  // 插入nNewItem DOM操作
  var className = 'expand ';
  if(Node.isLastChild) { className += 'last_'; }
  if(Node.firstChild != TREEITEM_NULL) {
    // 存在子节点
    className += 'expand_';
    className += (Node.subarea.style.display == '') ? 'on':'off';
  } else {
    // 叶节点
    className += 'child';
  }

  Node.expand.className = className;
},

insertBefore : function(nNewItem, nItem) {
    this.insertItem(nNewItem, nItem, false);
},


insertAfter : function(nNewItem, nItem) {
    this.insertItem(nNewItem, nItem, true);
},

insertItem : function(nNewItem, nItem, isAfter) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
    var NewNode = _this.getItemNode(nNewItem);
  var ParentNode = _this.getItemNode(Node.parent);
  if( (!Node) || (!NewNode) ||(!ParentNode) ) { return false; }

  var removeNode = _this.remove(nNewItem);
  NewNode.level = Node.level;
  NewNode.parent = Node.parent;
  
  if(isAfter) {
    // 节点后插入
    if(Node.isLastChild) {
      Node.isLastChild = false;
      NewNode.isLastChild = true;
      ParentNode.lastChild = nNewItem;
    } else {
      NewNode.isLastChild = false;
    }
  } else {
    // 节点前插入
    if(ParentNode.firstChild == nItem) {
      ParentNode.firstChild = nNewItem;
    }
    NewNode.isLastChild = false;
  }

  // 自动设置节点的样式
  _this.MeasureNodeExpand(Node);
  _this.MeasureNodeExpand(NewNode);

  // 插入nNewItem DOM操作
    var subarea = ParentNode.subarea;
  if(isAfter) {
    if(subarea.lastChild == Node.hwnd) {
      subarea.appendChild(removeNode.hwnd);
    } else {
      subarea.insertBefore(removeNode.hwnd, Node.hwnd.nextSibling);
    }
  } else {
    subarea.insertBefore(removeNode.hwnd, Node.hwnd);
  }
  NewNode.expand.style.left = ((NewNode.level-1)*20)+'px';
  NewNode.link.style.paddingLeft = ((NewNode.level-1)*20+25) + 'px';

  _this.updateItemIntent(nNewItem);
  
},

// 设置子节点intent
updateItemIntent : function(nNewItem) {
  var _this = this;
  
  _this.traverseNode(nNewItem, function(n) {
    var childNode = _this.getItemNode(n);
    var pNode = _this.getItemNode(_this.getParent(n));
    childNode.level = pNode.level + 1;
    childNode.expand.style.left = ((childNode.level-1)*20)+'px';
    childNode.link.style.paddingLeft = ((childNode.level-1)*20+25) + 'px';
    return true;
  });
},

removeChildren : function(nItem) {
  var _this = this;
  var nChildItem = _this.getFirstChild(nItem);
  while(nChildItem>0) {
    _this.removeChildren(nChildItem);
    var tChildItem = nChildItem;
    nChildItem = _this.getNextItem(nChildItem);
    _this.remove(tChildItem);
  }
},

onExpand : function() {},

// events
onStart : function(evt, handler) {
  var _this = this;
    if(evt.button == 2 || evt.button == 3) {
        return;
    } 
  if(!_this.Acceptable) { return; }
  _this.ismoved = false;
  _this.isdraging = true;
  _this.hwndMoveLine.style.width = (_this.hwnd.offsetWidth-4)+'px';
  var p = Q.absPosition(_this.hwnd);
  _this.hwndMoveLine.style.left = p.left + 'px';
  _this.onMove(evt, handler);
  _this.hwndMoveLine.style.display == 'none';
  Q.addEvent(_this.hwndMoveLine, 'mousemove', _this.onMoveLineMove_);  
  // Q.$('header_title').innerText = this.isdraging;
},

onMove : function(evt, handler) {
    var _this = this;
    if(evt.button == 2 || evt.button == 3) {
        return;
    } 
  
  if(!_this.Acceptable) { return; }

  if(!_this.ismoved) {
    _this.ismoved = true;
  }

  evt = evt || window.event;
  // Q.$('header_title').innerText = _this.isdraging;

  if(_this.isdraging) {
    var bInvalidTreeItem = false;
    var parent = evt.srcElement;
    var objA = null;

    while(parent && (parent != document.body)) {
      if(parent.nodeType==1 && (parent.nodeName+'').toLowerCase() == 'a') {
        objA = parent;
      } else if(parent == _this.hwnd) {
        bInvalidTreeItem = true;
        break;
      }

      parent = parent.parentNode;
    }

    // 有效的树节点
    if(bInvalidTreeItem) {
      if(objA) {
        {
          var pa = _this.getParent(objA.idx);
          while(pa != TREEITEM_NULL ) {
            if(pa == handler.hwnd.idx) {
              _this.hwndMoveLine.style.display = 'none';
              _this.hwndAccept = null;
              return;
            }
            pa = _this.getParent(pa);
          }
        }

        // 检测位置
        var pos = Q.absPosition(objA);

        if((evt.clientY >= pos.top)
          && (evt.clientY < (pos.top + (objA.offsetHeight/2) - 2))
        ) {
          // TOP
          _this.dragtype = TREEITEM_DRAG_TOP;
          _this.hwndMoveLine.style.borderWidth = '1px';
          _this.hwndMoveLine.style.height = '1px';
          _this.hwndMoveLine.style.top = (pos.top-1) + 'px';
          if(_this.ismoved) {
            _this.hwndMoveLine.style.display = '';
          }
          
          return;
        
        }  else if( (evt.clientY >= (pos.top + (objA.offsetHeight/2) - 3))
          &&  (evt.clientY <= (pos.top + (objA.offsetHeight/2) + 3)) ) {
          // CENTER
          if(objA != handler.hwnd)  {

            // if(_this.hwndAccept != objA) {
              _this.hwndMoveLine.style.top = pos.top + 'px';
              _this.hwndMoveLine.style.borderWidth = '2px';
              _this.hwndMoveLine.style.height = (objA.offsetHeight-4)+'px';
              
              _this.hwndAccept = objA;
              _this.dragtype = TREEITEM_DRAG_CENTER;
            // }
            return ;
          }
          
        } else if( (evt.clientY <= (pos.top + objA.offsetHeight))
          && (evt.clientY >= (pos.top + (objA.offsetHeight/2) + 3)) ){
          // Bottom
          _this.dragtype = TREEITEM_DRAG_BOTTOM;
          _this.hwndMoveLine.style.borderWidth = '1px';
          _this.hwndMoveLine.style.height = '1px';
          _this.hwndMoveLine.style.top = (pos.top-1+objA.offsetHeight) + 'px';
          // Q.$('header_title').innerText = 'top ' +pos.top + '; height:' + objA.offsetHeight + '; clientY : ' + evt.clientY;
          if(_this.ismoved) {
            _this.hwndMoveLine.style.display = '';
          }
          return;
        }  
      }
      _this.hwndAccept = null;
    }
  } 
},

onStop : function(evt, handler) {
    
  var _this = this;
  if(!_this.Acceptable) { return; }
  
  _this.isdraging = false;
  _this.ismoved = false;
  this.hwndMoveLine.style.display = 'none';
  Q.removeEvent(_this.hwndMoveLine, 'mousemove', _this.onMoveLineMove_);
  if(_this.hwndAccept) {
    if(_this.hwndAccept != handler.hwnd) {
      _this.onAccept(handler.hwnd.idx, _this.hwndAccept.idx);
    }
    _this.hwndAccept = null;
  }
  _this.dragtype = TREEITEM_DRAG_NONE;

},

onMoveLineMove : function(evt) {
  var _this = this;
  if(!_this.Acceptable) { return; }
  evt = evt || window.event;
  var pos = Q.absPosition(_this.hwndMoveLine);
  if( (evt.clientY >= (pos.top + (_this.hwndMoveLine.offsetHeight/2) - 3))
    &&  (evt.clientY <= (pos.top + (_this.hwndMoveLine.offsetHeight/2) + 3)) ) {
    
  } else {
    _this.hwndMoveLine.style.borderWidth='1px';
    _this.hwndMoveLine.style.height='1px';
    //_this.hwndMoveLine.style.display = 'none';
  }
},

onAccept : function(srcid, targetid){
  var _this = this;
  if(!_this.Acceptable) { return; }
  _this.onItemAccept(srcid, targetid, _this.dragtype);
},

// virtual function to be overrided
itemClick : function(nItem) {},
expandClick : function(nItem) {},
itemDblClick : function(nItem) {},
onNodeDelete : function(nItem) {},
onItemAccept : function(srcid, targetid, dragtype) {}

});
/*--------------------------------------------------------------------------------
 $ tabs.js
 $ update：2015-1-30 23:17
 $ author：Q
 $ 2015@http://wayixia.com.
----------------------------------------------------------------------------------*/


Q.tabs = Q.extend({
items  : null,
active : null,
__init__: function(json) {
  json = json || {};
  var this_ = this;
  this.items = json.items || [];  // {tab: id, content: id}
  this.each(function(item) {
    Q.addEvent(Q.$(item.tab), 'click', (function(p, tab) { 
        return function() { p.set_active(tab); }
        })(this_, item.tab)); 
  });
  if(json.active) { 
    this.set_active(json.active);
  }
},

set_active : function(tab_id) {
  var e = Q.$(tab_id);
  if(!e) 
    return
  this.active = tab_id;
  this.each(function(item) {
    if(item.tab == tab_id) {
      Q.addClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content))
        Q.$(item.content).style.display = '';
    } else {
      Q.removeClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content))
        Q.$(item.content).style.display = 'none';
    }
  })
},

each : function(f) {
  for(var i=0; i<this.items.length; i++) {
    f(this.items[i]);
  }       
}
});


/*-------------------------------------------------------
 $ file:  images_box.js
 $ powered by wayixia.com
 $ date: 2014-12-09
 $ author: Q 
---------------------------------------------------------*/

Q.ImagesBox = Q.extend({
hwnd: null,
__init__ : function(json) {
  json = json || {};
  var container = Q.$(json.id);
  this.hwnd = document.createElement('div');
  container.appendChild(this.hwnd);
  this.hwnd.className = "q-images-box";

  this.on_item_changed = json.on_item_changed || function(item, checked) {};
  this.is_item_enabled = json.is_item_enabled || function(item) { return true; };
  if(typeof json.on_item_dblclick == 'function') 
    this.on_item_dblclick= json.on_item_dblclick;
},

create_element: function(config, init) {
  var _this = this;
  var box = document.createElement('DIV');
  box.setAttribute('data-url', config.src);
  box.setAttribute('data-width', config.width);
  box.setAttribute('data-height', config.height);
  box.className = 'q-box-item';
  this.hwnd.appendChild(box);
  // init box
  box.innerHTML = '<span class="q-box-info"> \
    <span class="wh">'+config.width+'x'+config.height+' </span> \
    </span>';
  // image container
  var img_container = document.createElement('div');
  var a = document.createElement('a');
  var img = document.createElement('img');
  box.inner_img = img;
  a.appendChild(img);
  img_container.appendChild(a);
  box.appendChild(img_container);

  // mask layer
  var mask = document.createElement('div');
  mask.className = 'select-mask';
  box.appendChild(mask);

  // init event
  img_container.className = 'wayixia-image';
  a.href='javscript:void(0);';
  a.onclick=function(evt){ evt.preventDefault();};
  // calculate size
  var size = this.calculate(box.offsetWidth, box.offsetHeight, config.width, config.height);
  img.src=config.src;
  img.className = 'image';
  img.style.cssText = 'margin-top:'+size.top+'px;width:'+size.width+'px;height:'+size.height+'px;'
  
  box.onmouseover = function() {
    if(!_this.is_item_enabled(this))
      return;
    if(Q.hasClass(this, 'mouseselected')) 
      return;
    Q.addClass(this, "mouseover");
  } 
  
  box.onmouseout = function(e) {
    if(!_this.is_item_enabled(this))
      return;
    if(Q.hasClass(this, 'mouseselected')) 
      return;
    Q.removeClass(this, "mouseover");
  }

  box.onclick = function() {
    _this.set_check(this, !Q.hasClass(this, 'mouseselected'));
  }

  Q.click(box, 
    function(o) {
      _this.set_check(o, !Q.hasClass(o, 'mouseselected'));
    },
    
    this.on_item_dblclick
  );
  init(box);
},
  
each_item : function(callback) {
  var items = this.hwnd.childNodes;
  for(var i=0; i < items.length; i++) {
    var item = items[i];
    if(item.nodeType == Q.ELEMENT_NODE && (!item.id)) {
      callback(item);
    }
  }
 
},

select_all : function(checked) {
  this.each_item((function(o, state) { return function(item) { o.set_check(item, state); } })(this, checked));
},

set_check : function(item, checked) {
  if(!this.is_item_enabled(item))
      return;

  Q.removeClass(item, "mouseover");
  if(checked == Q.hasClass(item, 'mouseselected'))
    return;
  if(checked)
    Q.addClass(item, 'mouseselected');
  else
    Q.removeClass(item, 'mouseselected');

  this.on_item_changed(item, checked); 
}, 

set_style : function(new_class) {
  Q.removeClass(this.hwnd, this.old_style);
  this.old_style = new_class;
  Q.addClass(this.hwnd, new_class);
  this.each_item((function(o) { 
    return function(i) {
      o.on_item_size(i);
    }; 
  })(this))

},

on_item_size : function(box) {
  var img = box.inner_img;
  // warning: don't use box.offsetWidth or box.offsetHeight when display is none; 
  var size = this.calculate(parseInt(box.currentStyle.width, 10), parseInt(box.currentStyle.height, 10), img.width, img.height);
  img.style.cssText = 'margin-top:'+size.top+'px;width:'+size.width+'px;height:'+size.height+'px;'
},

calculate : function(max_width, max_height, img_width, img_height) {
  // filter image by size
  var result = max_width * img_height - max_height * img_width;
  var width = 0;
  var height = 0;
  if(result<0) {
    //img.width = max_width;  // 宽度
    width  = max_width;
    height = (max_width*img_height)/(img_width*1.0);
  } else {
    //img.height = max_height;
    height = max_height;
    width  = (img_width*height)/(img_height*1.0);
  }
  
  return { width: width, height: height, top: (max_height-height)/2 };
},

//
// Returns a function which will handle displaying information about the
// image once the image has finished loading.
//
getImageInfoHandler : function(data, init) {
  var _this = this;
  return function() {
    var img = this;
    var image_item = _this.copy_data(data);        
    image_item['src'] = img.src;
    image_item['width'] = img.width;
    image_item['height'] = img.height;
    _this.create_element(image_item, init);
  };
},

display_images : function(accept_images, data, init) {
  var _this = this;
  init = init || function(item) {}
  this.hwnd.innerHTML = '';
  return function() {
    for(var src in accept_images) {
        var img = new Image();
        img.onload=_this.getImageInfoHandler(data, init);
        img.src=src;
    }
  }
},

check_size : function(item, min_width, min_height) {
  var width = item.getAttribute('data-width');
  var height = item.getAttribute('data-height');
  item.style.display = ((width < min_width) || (height < min_height)) ? 'none':'';
},


copy_data : function(src_object) {
  var target_object = {}; 
  for(var name in src_object) {
    target_object[name] = src_object[name];
  }
  return target_object;
},

}); // Q.ImagesBox

var controlid = null;
var currdate = null;
var startdate = null;
var enddate  = null;
var yy = null;
var mm = null;
var hh = null;
var ii = null;
var currday = null;
var addtime = false;
var today = new Date();
var lastcheckedyear = false;
var lastcheckedmonth = false;

function _cancelBubble(event) {
  e = event ? event : window.event ;
  if(document.all) {
    e.cancelBubble = true;
  } else {
    e.stopPropagation();
  }
}

function loadcalendar() {
  s = '';
  s += '<div id="calendar" style="display:none; position:absolute; z-index:9;" onclick="_cancelBubble(event)">';
  if (document.all)
  {
    s += '<iframe width="200" height="160" src="about:blank" style="position: absolute;z-index:-1;"></iframe>';
  }
  s += '<div style="width: 200px;"><table class="tableborder" cellspacing="0" cellpadding="0" width="100%" style="text-align: center">';
  s += '<tr align="center" class="header"><td class="header"><a href="#" onclick="refreshcalendar(yy, mm-1);return false" title="上一月">&lt;&lt;</a></td><td colspan="5" style="text-align: center" class="header"><a href="#" onclick="showdiv(\'year\');_cancelBubble(event);return false" title="点击选择年份" id="year"></a>&nbsp;/ &nbsp;<a id="month" title="点击选择月份" href="#" onclick="showdiv(\'month\');_cancelBubble(event);return false"></a></td><td class="header"><A href="#" onclick="refreshcalendar(yy, mm+1);return false" title="下一月">&gt;&gt;</A></td></tr>';
  s += '<tr class="category"><td>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td></tr>';
  for(var i = 0; i < 6; i++) {
    s += '<tr class="altbg2">';
    for(var j = 1; j <= 7; j++)
      s += "<td id=d" + (i * 7 + j) + " height=\"19\">0</td>";
    s += "</tr>";
  }
  s += '<tr id="hourminute"><td colspan="7" align="center"><input type="text" size="1" value="" id="hour" onKeyUp=\'this.value=this.value > 23 ? 23 : zerofill(this.value);controlid.value=controlid.value.replace(/\\d+(\:\\d+)/ig, this.value+"$1")\'> 点 <input type="text" size="1" value="" id="minute" onKeyUp=\'this.value=this.value > 59 ? 59 : zerofill(this.value);controlid.value=controlid.value.replace(/(\\d+\:)\\d+/ig, "$1"+this.value)\'> 分</td></tr>';
  s += '</table></div></div>';
  s += '<div id="calendar_year" onclick="_cancelBubble(event)"><div class="col">';
  for(var k = 1930; k <= 2019; k++) {
    s += k != 1930 && k % 10 == 0 ? '</div><div class="col">' : '';
    s += '<a href="#" onclick="refreshcalendar(' + k + ', mm);Q.$(\'calendar_year\').style.display=\'none\';return false"><span' + (today.getFullYear() == k ? ' class="today"' : '') + ' id="calendar_year_' + k + '">' + k + '</span></a><br />';
  }
  s += '</div></div>';
  s += '<div id="calendar_month" onclick="_cancelBubble(event)">';
  for(var k = 1; k <= 12; k++) {
    s += '<a href="#" onclick="refreshcalendar(yy, ' + (k - 1) + ');Q.$(\'calendar_month\').style.display=\'none\';return false"><span' + (today.getMonth()+1 == k ? ' class="today"' : '') + ' id="calendar_month_' + k + '">' + k + ( k < 10 ? '&nbsp;' : '') + ' 月</span></a><br />';
  }
  s += '</div>';

  var nElement = document.createElement("div");
  nElement.innerHTML=s;
  document.getElementsByTagName("body")[0].appendChild(nElement);

//  document.write(s);
  document.onclick = function(event) {
    Q.$('calendar').style.display = 'none';
    Q.$('calendar_year').style.display = 'none';
    Q.$('calendar_month').style.display = 'none';
  }
  Q.$('calendar').onclick = function(event) {
    _cancelBubble(event);
    Q.$('calendar_year').style.display = 'none';
    Q.$('calendar_month').style.display = 'none';
  }
}

function parsedate(s) {
  /(\d+)\-(\d+)\-(\d+)\s*(\d*):?(\d*)/.exec(s);
  var m1 = (RegExp.$1 && RegExp.$1 > 1899 && RegExp.$1 < 2101) ? parseFloat(RegExp.$1) : today.getFullYear();
  var m2 = (RegExp.$2 && (RegExp.$2 > 0 && RegExp.$2 < 13)) ? parseFloat(RegExp.$2) : today.getMonth() + 1;
  var m3 = (RegExp.$3 && (RegExp.$3 > 0 && RegExp.$3 < 32)) ? parseFloat(RegExp.$3) : today.getDate();
  var m4 = (RegExp.$4 && (RegExp.$4 > -1 && RegExp.$4 < 24)) ? parseFloat(RegExp.$4) : 0;
  var m5 = (RegExp.$5 && (RegExp.$5 > -1 && RegExp.$5 < 60)) ? parseFloat(RegExp.$5) : 0;
  /(\d+)\-(\d+)\-(\d+)\s*(\d*):?(\d*)/.exec("0000-00-00 00\:00");
  return new Date(m1, m2 - 1, m3, m4, m5);
}

function settime(d) {
  Q.$('calendar').style.display = 'none';
  controlid.value = yy + "-" + zerofill(mm + 1) + "-" + zerofill(d) + (addtime ? ' ' + zerofill(Q.$('hour').value) + ':' + zerofill(Q.$('minute').value) : '');
}

function showcalendar(event, controlid1, addtime1, startdate1, enddate1) {
  controlid = controlid1;
  addtime = addtime1;
  startdate = startdate1 ? parsedate(startdate1) : false;
  enddate = enddate1 ? parsedate(enddate1) : false;
  currday = controlid.value ? parsedate(controlid.value) : today;
  hh = currday.getHours();
  ii = currday.getMinutes();
  var p = Q.absPosition(Q.$(controlid));
  Q.$('calendar').style.display = 'block';
  Q.$('calendar').style.left = (p.left+p.width+1)+'px';
  Q.$('calendar').style.top  = (p.top+2)+'px';
  _cancelBubble(event);
  refreshcalendar(currday.getFullYear(), currday.getMonth());
  if(lastcheckedyear != false) {
    Q.$('calendar_year_' + lastcheckedyear).className = 'default';
    Q.$('calendar_year_' + today.getFullYear()).className = 'today';
  }
  if(lastcheckedmonth != false) {
    Q.$('calendar_month_' + lastcheckedmonth).className = 'default';
    Q.$('calendar_month_' + (today.getMonth() + 1)).className = 'today';
  }
  Q.$('calendar_year_' + currday.getFullYear()).className = 'checked';
  Q.$('calendar_month_' + (currday.getMonth() + 1)).className = 'checked';
  Q.$('hourminute').style.display = addtime ? '' : 'none';
  lastcheckedyear = currday.getFullYear();
  lastcheckedmonth = currday.getMonth() + 1;
}

function refreshcalendar(y, m) {
  var x = new Date(y, m, 1);
  var mv = x.getDay();
  var d = x.getDate();
  var dd = null;
  yy = x.getFullYear();
  mm = x.getMonth();
  Q.$("year").innerHTML = yy;
  Q.$("month").innerHTML = mm + 1 > 9  ? (mm + 1) : '0' + (mm + 1);

  for(var i = 1; i <= mv; i++) {
    dd = Q.$("d" + i);
    dd.innerHTML = "&nbsp;";
    dd.className = "";
  }

  while(x.getMonth() == mm) {
    dd = Q.$("d" + (d + mv));
    dd.innerHTML = '<a href="###" onclick="settime(' + d + ');return false">' + d + '</a>';
    if(x.getTime() < today.getTime() || (enddate && x.getTime() > enddate.getTime()) || (startdate && x.getTime() < startdate.getTime())) {
      dd.className = 'expire';
    } else {
      dd.className = 'default';
    }
    if(x.getFullYear() == today.getFullYear() && x.getMonth() == today.getMonth() && x.getDate() == today.getDate()) {
      dd.className = 'today';
      dd.firstChild.title = '今天';
    }
    if(x.getFullYear() == currday.getFullYear() && x.getMonth() == currday.getMonth() && x.getDate() == currday.getDate()) {
      dd.className = 'checked';
    }
    x.setDate(++d);
  }

  while(d + mv <= 42) {
    dd = Q.$("d" + (d + mv));
    dd.innerHTML = "&nbsp;";
    d++;
  }

  if(addtime) {
    Q.$('hour').value = zerofill(hh);
    Q.$('minute').value = zerofill(ii);
  }
}

function showdiv(id) {

  var p = Q.absPosition(Q.$(id));
  Q.$('calendar_' + id).style.left = p.left+'px';
  Q.$('calendar_' + id).style.top = (p.top + 16)+'px';
  Q.$('calendar_' + id).style.display = 'block';
}

function zerofill(s) {
  var s = parseFloat(s.toString().replace(/(^[\s0]+)|(\s+$)/g, ''));
  s = isNaN(s) ? 0 : s;
  return (s < 10 ? '0' : '') + s.toString();
}

Q.ready(function() {
  loadcalendar();
}, true );
