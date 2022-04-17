
/**菜单分割线
 * @type {string}
 * @readonly
 */
window.MENU_SEPERATOR = "seperator";
window.MENU_ITEM = "item";
window.MENU_ITEM_CHECKBOX = "checkbox";
window.MENU_ITEM_RADIO = "radio";

/** 菜单项
 *
 * @tutorial Q.Menu
 * @constructor
 * @param {Object} json - 菜单项构造参数
 * @param {number} [json.type=MENU_ITEM] - 菜单项类型
 * @param {string} json.text - 菜单项文本
 * @param {string} json.icon - 菜单项图片
 * @param {*} json.data - 菜单项绑定的数
 * @param {string} json.style - 弹出子菜单窗口样式
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
style: null,
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
  this.style = json.style;
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
    if(this.style)
      Q.addClass(this.subwnd, this.style);

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
  
  if(element.nodeType != Q.ELEMENT_NODE)  
    return; 
  
  _this.hide();
  Q.addEvent(document, "mousedown", _this._fHide);
  Q.addEvent(window, "blur", this._fHide);
  this._fOnPopup(true);
  
  _this.hwnd.style.display = '';
  /*
  if(!this.isajust) {
    this.isajust = true;
    var childNodes = this.hwnd.childNodes;
    var len = childNodes.length;
    for(var i=0; i < len; i++) {  
      var node = childNodes[i];
      node.style.width = (_this.hwnd.offsetWidth - 2) + 'px';
    }
  }
  */
  var workspace = Q.workspace();
  var pos = Q.absPositionEx(element);
  var left =0, top = 0;
  if(pos.top+pos.height+_this.hwnd.offsetHeight > workspace.height ) {
    top = pos.top-_this.hwnd.offsetHeight;
  } else {
    top = pos.top + pos.height;
  }

  if( top < 0 ) {
    top = pos.top+pos.height;
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

