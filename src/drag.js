
/**
 * 拖拽封装，提供简单添加和删除完成元素的拖拽功能，只能创建一个实例
 */
class draging
{
  capture_wnd = null;
  is_drag = false;
  x = 0;
  y = 0;
  begin_left = 0;
  begin_top = 0;
  mousedown_Hanlder = null;
  mouseup_handler = null;
  mousemove_handler = null;
  is_moved = false;
  timer = null;
  constructor()
  {
    var _this = this;

    // 缓存时间
    this.mousedown_hanlder = Q.bind_handler( this, function(evt) { return this._mousedown(evt); } );
    this.mousemove_handler = Q.bind_handler( this, function(evt) { return this._mousemove(evt); } );
    this.mouseup_handler = Q.bind_handler( this, function(evt) { return this._mouseup(evt); } );

    Q.addEvent(document, 'mousedown', this.mousedown_hanlder);
    Q.addEvent(document, 'mouseup', this.mouseup_handler);
    
    Q.addEvent( document, 'touchstart', this.mousedown_hanlder, {passive:false} );
    Q.addEvent( document, 'touchend', ( function( self ) {
      return function( evt ) {
        return self._mouseup( evt );
      }
    } )( this ), false );

  }

  attach_object(json) {
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
  }

  deattach_object(obj_or_id) {
    var obj = Q.$(obj_or_id);
    obj.removeAttribute('q-drag-object');
  }

  add_drag_handler(drag_object, handler) {
    drag_object.q_drag_objects.append(handler); 
  }
  
  remove_drag_handler(drag_object, handler) {
    drag_object.q_drag_objects.erase(handler); 
  }
  
  is_drag_handler(drag_object, handler) {
    return this.is_dragable(drag_object) && drag_object.q_drag_objects.find(handler); 
  }

  is_dragable(drag_object) {
    var obj = Q.$(drag_object);
    return obj && obj.getAttribute && !!obj.getAttribute('q-drag-object'); 
  }

  zoom (v) {
    if(this.capture_wnd && this.capture_wnd.style.zoom) {
      return (v / (this.capture_wnd.style.zoom * 1.0));
    } else {
      return v;
    }
  }

  _mousedown(evt) {
    //Q.printf("touchstart or mousedown");
    evt = evt || window.event;

    if(evt.button == Q.RBUTTON){ return; } // 屏蔽右键拖动
    var target_wnd = drag_handle = evt.targetTouches?evt.targetTouches[0].target : ( Q.isNS6() ? evt.target : evt.srcElement ); // 获取鼠标悬停所在的对象句柄
    
    while(target_wnd && !this.is_dragable(target_wnd) && (target_wnd != document.body)) {
      target_wnd = target_wnd.parentNode;
    }

    if(target_wnd && this.is_drag_handler(target_wnd, drag_handle)) {
      //evt.preventDefault();
      this.capture_wnd = target_wnd;
      this.is_drag = true; 

      if( evt.targetTouches ) {
        this.x = evt.targetTouches[0].pageX;
        this.y = evt.targetTouches[0].pageY;
      } else {
        this.x = evt.clientX;
        this.y = evt.clientY; 
      }
      
      
      this.begin_left = target_wnd.offsetLeft;
      this.begin_top = target_wnd.offsetTop;
      //Q.printf("[drag-onbegin]offet x: " + this.begin_left + ", offset y: " + this.begin_top )
      if(this.capture_wnd.q_onmove_begin)
        this.capture_wnd.q_onmove_begin(this.begin_left+this.zoom(this.x), this.begin_top+this.zoom(this.y));
      this.timer = setTimeout(Q.bind_handler(this, function() { 
        Q.addEvent(document, 'mousemove', this.mousemove_handler); 
        Q.addEvent(document, 'touchmove', this.mousemove_handler, {passive:false}); 
      //  Q.printf("attch move event");
      }), 10);

      //evt.preventDefault();
      return false; 
    }
  }
    
  _mousemove(evt){
    this.is_moved = true;
    evt = evt || window.event
    evt.preventDefault(); //阻止屏幕滚动的默认行为
    //Q.printf("[drag-onmove] ");

    if (this.is_drag) {
      //evt.preventDefault(); //阻止屏幕滚动的默认行为
      var x = 0;
      var y = 0;
      if( evt.targetTouches ) {
        x = evt.targetTouches[0].pageX-this.x;
        y = evt.targetTouches[0].pageY-this.y;
      } else {
        x = evt.clientX-this.x;
        y = evt.clientY-this.y;
      }

      //Q.printf("[drag-onmove] dx: " + x + ", dy: " + y);
      this.capture_wnd.q_onmove(this.begin_left+this.zoom(x), this.begin_top+this.zoom(y));
      evt.stopPropagation();
      evt.preventDefault(); //阻止屏幕滚动的默认行为
      //return false; 
    }
    
  }

  _mouseup(evt) {
    //Q.printf("touchend event");
    clearTimeout(this.timer);
    
    if(this.is_drag ) {
      this.is_drag=false;
      Q.removeEvent(document,'mousemove', this.mousemove_handler);
      Q.removeEvent(document,'touchmove', this.mousemove_handler);
      //Q.printf("deattch move event");
      if(this.capture_wnd.q_onmove_end)
        this.capture_wnd.q_onmove_end(this.zoom(this.x), this.zoom(this.y));
    }
    this.is_moved=false;
    
  }
}; // end drag class

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
export function drag(json) {
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
export function dragno(id) {
  if(instance) {
    instance.deattach_object(id);
  }
}

