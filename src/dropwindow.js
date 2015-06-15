
/** 下拉窗口封装
 *
 * @tutorial Q.DropWindow
 * @constructor
 * @param {Object} json - 菜单项构造参数
 * @param {function} json.callback - 响应回调
 */
Q.DropWindow = Q.Window.extend( {
timer : null,
_fHide : null,
_fWheel: null,
_fOnPopup : null,

/**
 * @callback Q.DropWindow.callback
 * @param {bool} popup - true 弹出, false 隐藏 
 */

__init__ : function(json) {
  json = json || {};
  this._fHide = (function(o, h) {
    return function(evt) {
      evt = evt || window.event;
      var target = Q.isNS6() ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
      while(target && (!Q.hasClass(target,"q-dropwindow")) && (target != document.body)) {
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

  json.wstyle = "q-dropwindow q-attr-no-title";
  Q.Window.prototype.__init__.call(this, json);
},

/*
show : function(evt){
  var _this = this;
  var scroll = Q.scrollInfo();
  var left = 0, top = 0;
  evt = evt || window.event;
  this.hwnd.show(true);
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
*/

showElement : function(element, isClosed) {
  if(element.nodeType != Q.ELEMENT_NODE)  
    return; 
  this.hide();
  Q.addEvent(document, "mousedown", this._fHide);
  Q.addEvent(window, "blur", this._fHide);
  this._fOnPopup(true);
  this.show(true);
  var workspace = Q.workspace();
  var pos = Q.absPosition(element);
  var wnd_pos = Q.absPosition(this.wnd());
  var left =0, top = 0;
  if(pos.top+pos.height+wnd_pos.height > workspace.height ) {
    top = pos.top-wnd_pos.height;
  } else {
    top = pos.top + pos.height;
  }
  if(wnd_pos.width + pos.left > workspace.width) {
    left = pos.left+pos.width - wnd_pos.width;  
  } else {
    left = pos.left;  
  }
  
  var si = Q.scrollInfo();
  this.moveTo(si.l + left, si.t + top);
},

hide : function() {
  //Q.printf("hide context menu");
  this.show(false);
  Q.removeEvent(window, "blur", this._fHide);
  Q.removeEvent(document, "mousedown", this._fHide);
  document.onmousewheel = this._fWheel;
  this._fOnPopup(false);
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

