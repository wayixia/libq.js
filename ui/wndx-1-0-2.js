/*--------------------------------------------------------------------------------
 $ wndx.js
 $ update：2015-1-2 15:27
 $ author：Q
 $ 2014@http://wayixia.com.
----------------------------------------------------------------------------------*/

// global const variables definition
var CONST = {
  no_title    : "q-attr-no-title",
  no_icon     : "q-attr-no-icon",
  no_min      : "q-attr-no-min",
  no_max      : "q-attr-no-max",
  no_close    : "q-attr-no-close",
  with_bottom : "q-attr-with-bottom",
  fixed       : "q-attr-fixed",
  inactive_title : "q-attr-inactive-title",

  // size text
  SIZE_CLOSE:    "close",
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
Q.Ready(function() {
  __GLOBALS.desktop = document.body;
  __GLOBALS.desktop.hook = new Q.LIST();
  __GLOBALS.desktop.wnds   = new Q.LIST();  // popups windows
  __GLOBALS.desktop.active_child = null;
  __GLOBALS.explorer = new Q.UIApplication();
  $CreateMaskLayer(__GLOBALS.desktop, "q-top-mask");
}, true);


/*-------------------------------------------------------------------------
 application base class
 manage the resources, i.e Q.Window
---------------------------------------------------------------------------*/

Q.Application = Q.extend({
id : -1,   // application id
__init__ : function(params) {
  // generator app id
  this.id = ++__GLOBALS.appid;
  __GLOBALS.apps[this.id] = this;
},

end : function() {
  delete __GLOBALS.apps[this.id];
}

});

Q.UIApplication = Q.Application.extend({
wnds_map: null,
__init__ : function(params) {
  Q.Application.prototype.__init__.call(this, arguments);
  this.wnds_map = new Q.LIST();
},

add_window   : function(wndNode) { this.wnds_map.append(wndNode); },
erase_window : function(wndNode) { this.wnds_map.erase(wndNode); },
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

//  Q.Application end

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

function $IsDesktopWindow(wndNode) { return (__GLOBALS.desktop == wndNode); }
function $IsWindow(wndNode)        { return (!$IsNull(wndNode)) && (wndNode.nodeType == Q.ELEMENT_NODE) && wndNode.getAttribute('__QWindow__');}
function $IsMaxWindow(wndNode)     { return ($IsStyle(wndNode, CONST.STYLE_MAX) && (CONST.SIZE_MAX == $GetWindowStatus(wndNode))); }
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
  wndNode.layer_mask.className = 'q-window-mask alpha_1';
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

/*----------------------------------------------------
 窗口激活模式 $ActiveWindow

RootWindow (__GLOBALS.desktop)  
 |               
 +--active_child---> Window 1 
 |        +---------------- child window 1
 |        +---active_child---> child window 2
 |        +---------------- child window 3
 |
 +-------------- Window 2
 +-------------- Window 3
------------------------------------------------------*/
function $ActivateWindow(wndNode, zindex) {
  if(!$IsWindow(wndNode))
    return;
  //Q.printf("active window " + $GetTitleText(wndNode));
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

function $SetActiveChild(wndNode, child)   { wndNode.active_child = child;  }
function $SetWindowZIndex(wndNode, zIndex) { if( isNaN(parseInt(zIndex)) ) { return; } wndNode.style.zIndex = zIndex; }
function $RemoveWindowStyle(wndNode, ws)   { Q.removeClass(wndNode, ws); }
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
  hwnd.wnds         = new Q.LIST();   // 窗口
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
  Q.drag.attach_object(hwnd, {
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

/*-----------------------------------------------------------------
 $ class Q.Window
 $ dialog base class
 $ date: 2014-05-16
-------------------------------------------------------------------*/
// 创建窗口，并返回一个窗口操作类
Q.Window = Q.extend({
hwnd : null,
__init__ : function(config) {
  config = config || {};
  var _this = this;
  var title = config.title || '无标题';
  var left  = config.left || 0;
  var top   = config.top || 0;
  var width = config.width || 600;
  var height= config.height || 400;
  var parent_wnd= $GetDesktopWindow();
  if(config.parent instanceof Q.Window) 
    parent_wnd = config.parent.wnd() || $GetDesktopWindow();
  this.hwnd = $CreateWindow(parent_wnd, title, config.wstyle, left, top, width, height, config.app);
  this.set_content(config.content);
  this.hwnd.on_size     = Q.bind_handler(this, config.on_size || function(w, h) {});
  this.hwnd.on_activate = Q.bind_handler(this, config.on_activate || function(activate) {});
  this.hwnd.on_move_begin = Q.bind_handler(this, config.on_move_begin || function(x,y) {});
  this.hwnd.on_move     = Q.bind_handler(this, config.on_move || function(x, y) {});
  this.hwnd.on_move_end = Q.bind_handler(this, config.on_move_end || function(x, y) {});
  this.hwnd.on_close    = Q.bind_handler(this, config.on_close || function() { return true; });
  Q.bind_handler(this, config.on_create || function() {})();
},

wnd : function() { return this.hwnd; },
set_window_proc : function(new_window_proc) { return $SetWindowProc(this.hwnd, new_window_proc); },
set_zindex : function(zIndex) { $SetWindowZIndex(this.hwnd, zIndex); },
set_content : function(HTMLContent) {
  HTMLContent = HTMLContent || "";
  if(HTMLContent && HTMLContent.nodeType == Q.ELEMENT_NODE) {
    $GetClient(this.hwnd).appendChild(HTMLContent);
    HTMLContent.style.display = '';
  } else {
    $GetClient(this.hwnd).innerHTML = HTMLContent;
  }
},
add_style: function(ws)    { Q.addClass(this.hwnd, ws);        },
remove_style: function(ws) { Q.removeClass(this.hwnd, ws);     },
show : function(isVisible) { $ShowWindow(this.hwnd, isVisible) },
center : function()        { $CenterWindow(this.hwnd);         },
activate : function()      { $BindWindowMessage(this.hwnd, MESSAGE.ACTIVATE)(); },
adjust : function()        { $FitWindow(this.hwnd); },
item: function(q_id)       { return qid($GetClient(this.hwnd), q_id); }
});

/*-----------------------------------------------------------------
 $ class Q.Dialog
 $ dialog base class
 $ date: 2007-11-20
-------------------------------------------------------------------*/
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
  this.old_window_proc = this.set_window_proc( (function(qwindow) {
    return function(hwnd, msgid, json) { return qwindow.window_proc(msgid, json);}
  })(this));
 
  // initialize buttons 
  for(var i=0; i < buttons.length; i++) {
    var button = buttons[i];
    var style = button.style || 'sysbtn';
    this.add_bottom_button(button.text, style, (function(dialog, btn) { 
      return function() { if(btn.onclick()) { dialog.end_dialog(); }}})(this, button));
  }
},

// dialog procedure
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

add_bottom_button : function(text, className, lpfunc) {
  var _this = this;
  var ws = $GetWindowStyle(this.hwnd);
  
  if((!$IsStyle(this.hwnd, CONST.with_bottom)) || $IsNull($GetBottomBar(this.hwnd))) {
    return false;
  }
  var btn = document.createElement('button');
  $GetBottomBar(this.hwnd).appendChild(btn);
  btn.innerText = text;
  btn.onclick = lpfunc;
  btn.className = className;
  return true;
},

domodal : function(wndNode) {
  //Q.printf('domodal window');
  if($IsNull(wndNode)) {
    wndNode = $GetActiveChild($GetDesktopWindow());
    if($IsNull(wndNode)) {
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
    this.set_zindex(100001);
  }
},
 
end_dialog : function(code) {
  $BindWindowMessage(this.hwnd, MESSAGE.CLOSE)();
  if( arguments.length > 1 )  
    return arguments[1];
  else 
    return CONST.IDCANCEL;
}

}); // Q.Dialog

/*-----------------------------------------------------------------
  class Q.MessageBox
-------------------------------------------------------------------*/

Q.MessageBox = Q.Dialog.extend({
__init__: function(config) {
  config = config || {};
  config.width  = config.width  || 360;
  config.height = config.height || 200;
  config.buttons = [];
  config.on_ok = config.on_ok || function() { return true; };
  if( typeof config.on_ok == 'function' ) {
    this.on_ok = config.on_ok;
    config.buttons.push({text: Q.locale_text('qYes', ' 是 '), 
      onclick: Q.bind_handler(this, function() { this.on_ok() && this.end_dialog(CONST.IDOK); })})   
  }
  if( typeof config.on_no == 'function' ) {
    this.on_no = config.on_no;
    config.buttons.push({text: Q.locale_text('qNo', ' 否 '), style:'syscancelbtn', 
      onclick: Q.bind_handler(this, function() { this.on_no() && this.end_dialog(CONST.IDNO); })})   
  }
  if( typeof config.on_cancel == 'function' ) {
    this.on_cancel = config.on_cancel;
    config.buttons.push({text: Q.locale_text('qCancel', ' 取消 '), style:'syscancelbtn', 
      onclick: Q.bind_handler(this, function() { this.on_cancel() && this.end_dialog(CONST.IDCANCEL); })})   
  }
  Q.Dialog.prototype.__init__.call(this, config);
  this.domodal(config.parent);
  //this.adjust();
  //this.center();
}
}); // Q.MessageBox

/* wndx template */
Q.ui = Q.extend({
ui_iframe: null,
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

template: function(id) {
  var doc = this.ui_iframe.contentDocument || this.ui_iframe.contentWindow.document;
  var tpl = doc.getElementById(id);
  if(tpl)
    return tpl.cloneNode(true);

  return null;
},

bind_css : function() {
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


