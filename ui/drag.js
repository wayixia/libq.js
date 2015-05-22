
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

