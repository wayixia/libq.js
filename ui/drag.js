
/*-------------------------------------------------------
 * draging.js
 * date: 2012-10-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

Q.draging = Q.extend({
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

  attach_object : function(obj_or_id, config) {
    var obj = Q.$(obj_or_id);
    var config = config || {};
    obj.setAttribute('q-drag-object', true);
    obj.q_drag_objects = new Q.LIST();
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
      this.add_drag_handler(obj, init_drag_objects[i]);
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

  _mousedown : function(evt) {
    var _this = this;
    evt = evt || window.event;
    if(evt.button == Q.RBUTTON){ return; } // 屏蔽右键拖动
    var target_wnd = drag_handle = Q.isNS6() ? evt.target : evt.srcElement; // 获取鼠标悬停所在的对象句柄
    
    while(target_wnd && !_this.is_dragable(target_wnd) && (target_wnd != document.body)) {
      target_wnd = target_wnd.parentNode;
    }

    //if(target_wnd && (!$IsMaxWindow(target_wnd)) && $IsDragObject(target_wnd, oDragHandle)) {
    if(target_wnd && _this.is_drag_handler(target_wnd, drag_handle)) {
      _this.capture_wnd = target_wnd;
      _this.is_drag = true; 
      _this.x = evt.clientX;
      _this.y = evt.clientY; 
      
      _this.begin_left = target_wnd.offsetLeft;  
      _this.begin_top = target_wnd.offsetTop;
      if(_this.capture_wnd.q_onmove_begin)
        _this.capture_wnd.q_onmove_begin(_this.x, _this.y);
      // 添加mousemove事件
      _this.timer = setTimeout(function() { Q.addEvent(document, 'mousemove', _this.mousemove_handler);  }, 100);
      return false; 
    }
  },
    
  _mousemove : function(evt){
    var _this = this;
    _this.is_moved = true;
    evt = evt || window.event
    if (_this.is_drag) {
      var x = evt.clientX-_this.x;
      var y = evt.clientY-_this.y;
      if(_this.capture_wnd.style.zoom) {
        _this.capture_wnd.q_onmove(_this.begin_left+(x/_this.capture_wnd.style.zoom), _this.begin_top+(y/_this.capture_wnd.style.zoom));
      } else {
        _this.capture_wnd.q_onmove(_this.begin_left+x, _this.begin_top+y);
      }
      return false; 
    }
  },

  _mouseup : function(evt) {
    
    var _this = this;
    clearTimeout(_this.timer);
    if(_this.is_drag ) {
      _this.is_drag=false;
      Q.removeEvent(document,'mousemove',_this.mousemove_handler);
      if(_this.capture_wnd.q_onmove_end)
        _this.capture_wnd.q_onmove_end(_this.x, _this.y);
    }
    _this.is_moved=false;
  }
});

Q.Ready(function() {
  Q.drag = new Q.draging();
}, true);

