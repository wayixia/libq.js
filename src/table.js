/**
 * 表格控件 Q.Table
 * @author Q
 * @version 1.0
 */




/** 数据管理类
 * @constructor
 * @param {Object} config - 构造参数
 * @param {array=} config.data - 数据数组
 * @param {String=} config.keyname - 数据索引字段名
 * @param {Object} config.proxy - 远程数据接口
 * @param {Function} config.proxy.fetch - 获取远程数据
 */
Q.Store = Q.extend({
__records : null,  // 记录集
__proxy : null,
__currentpage : -1,
__page_size: 0,
__proxy_total_size: 0,
__proxy_page_current: 0,
__keyname : null,
__init__ : function(config) {
  config = config || {}; 
  this.__keyname = config.keyname || '';
  this.__records = new Q.HashMap;
  if(config.data) {
    this.append_array(config.data);
  } else if(config.proxy) { 
    this.__proxy = config.proxy;
  }

  if( config.pagesize ) {
    this.__page_size = config.pagesize;
  }
},


/** 清空数据
 *
 * @memberof Q.Store.prototype
 */
clear : function() {
  this.__records = new Q.HashMap;
},

/** 加载json数据记录集
 * 
 * @memberof Q.Store.prototype
 * @param {Object[]} arr - 数据集
 */
append_array : function(arr) {
  for(var i=0; i<arr.length; i++) {
    this.push(arr[i]);
  }
},

/** 读取远程数据
 *
 * @memberof Q.Store.prototype
 */
__load_remote : function(page, callback) {
  var self = this;
  if( !self.__proxy ) {
    callback([]);
    return;
  }

  const pagesize = self.__page_size;

  self.__proxy.fetch( page, pagesize, function( err, res ) {
    if(err) {
      console.error("load remote data error: " + err);
      return;
    }

    // save proxy info
    self.__proxy_total_size = parseInt(res.total,10);
    self.__page_size = pagesize;
    self.__proxy_page_current = page;
    callback( res.data );
  } )
},
 
/** 加载页
 * 
 * @memberof Q.Store.prototype
 * @param page {number} - 指定页
 * @param callback {function} - 回调
 */
load_page : function(page, callback) {
  var fnCallback = callback || function(arr) {};
  var _this = this;
  if(_this.__proxy) {
    _this.__load_remote(page, fnCallback);
  } else {
    var pagedata = new Q.HashMap;
    for(var i=(page-1) * _this.__page_size; i < (page * _this.__page_size); i++) {
      if(i >= _this.__records.length) { break; }
      pagedata.push(_this.__records.item(i));
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
  record["__dataindex__"] = this.__records.index; // 存储数据索引， 用于确定改记录在记录集中的位置
  this.__records.push(record);

  return record["__dataindex__"];
},
 
/** 删除一条记录
 *
 * @memberof Q.Store.prototype
 * @param record {object} - 删除的记录
 */
remove : function(index) {
  this.__records.remove(index);
},

/** 渲染数据接口
 *
 * @memberof Q.Store.prototype
 * @param fnHandler {Q.HashMap.each_handler} - 处理记录数据
 */
each : function(fnHanlder) {
  this.__records.each(fnHanlder);
},
 
/** 获取指定索引数据
 *
 * @memberof Q.Store.prototype
 * @param index {number} - 索引
 * @return {object} 记录
 */
item : function(index) {
  return this.__records.item(index);
},

total_size: function() {
  if( this.__proxy ) {
    return this.__proxy_total_size;
  } else {
    return this.__records.length;
  }
}

});

Q.TableColumn = Q.extend({
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
    this._fMove = Q.bind_handler( this, this.Move);
    this._fStop = Q.bind_handler(this, this.Stop);
    Q.addEvent(this.hwnd, "mousedown", Q.bind_handler(this, this.Start));
    Q.addEvent(this.hwnd, "mousemove", Q.bind_handler(this, this.Move));
  },
  
  Start : function(oEvent) {
    var pos = Q.absPositionEx(this.hwnd);
    
    if(this.hwnd.style.cursor) {
      this._isResizable = true;
      this._dx = pos.left + pos.width - oEvent.clientX;
      // 显示和定位法线
      var parent = Q.absPosition(this.hwnd_moveline.parentNode);
      this.hwnd_moveline.style.display = '';
      this.hwnd_moveline.style.left = (oEvent.clientX-parent.left ) + 'px';
      //this.hwnd_moveline.style.top = (pos.top) + 'px';
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
    var scrollinfo = Q.scrollInfo();
    if(this._isDragable ) {
      // on drag 
    } else if(this._isResizable) {
      var parent = Q.absPositionEx(this.hwnd_moveline.parentNode);
      if( this._left > oEvent.clientX ) {
        this.hwnd_moveline.style.left = (this._left-parent.left) + 'px';
        return;
      }
      this.hwnd_moveline.style.left = (oEvent.clientX-parent.left) + 'px';
    } else {
      var pos = Q.absPositionEx(this.hwnd);
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
      var div = this.hwnd.firstChild;
      this._width = oEvent.clientX - this._left + this._dx; // - div.style.borderLeftWidth - div.style.borderRightWidth;
      Q.printf( "column width " + this._width );
      if( this.hwnd.firstChild.style ) {
        this.hwnd.firstChild.style.width = (this._width) + 'px';
      }
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
window.SELECT_MODE_CTRL  = 1;
window.SELECT_MODE_SHIFT  = 2;

window.get_scrollbar_size = function(r) {
  // 创建⼀个临时的元素
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // 强制出现滚动条
  outer.style.width = '100px'; // 设置宽度
  outer.style.height = '100px'; // 设置⾼度
  document.body.appendChild(outer);
  // 创建⼀个内部元素
  const inner = document.createElement('div');
  inner.style.width = '100%'; // 设置宽度为100%
  inner.style.height = '100%'; // 设置⾼度为100%
  outer.appendChild(inner);
  // 计算滚动条宽度
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  // 移除临时元素
  outer.parentNode.removeChild(outer);
  
  return scrollbarWidth;
 }

//window.cached;
window.get_scrollbar_size2 = function (fresh) {
    const inner = document.createElement('div');
    inner.style.width = '100%';
    inner.style.height = '200px';

    const outer = document.createElement('div');
    const outerStyle = outer.style;

    outerStyle.position = 'absolute';
    outerStyle.top = 0;
    outerStyle.left = 0;
    outerStyle.pointerEvents = 'none';
    outerStyle.visibility = 'hidden';
    outerStyle.width = '200px';
    outerStyle.height = '150px';
    outerStyle.overflow = 'hidden';

    outer.appendChild(inner);

    document.body.appendChild(outer);

    const widthContained = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    let widthScroll = inner.offsetWidth;

    if (widthContained === widthScroll) {
        widthScroll = outer.clientWidth;
    }

    document.body.removeChild(outer);
    return widthContained - widthScroll;
}


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
wndOwner: null,
wndOwnerProc: null,
wndOwnerOldProc: null,
renderer: null,
wnd : null,
wndTitleBar : null,
wndFrame : null,
wndGroupHeader : null,
wndGroupBody : null,
wndToolbar : null,
wndTableHeaderRow : null,
wndTableData : null,
wndMoveLine : null,
viewStyle: "list",  // "list", "grid"
columns: [],
evtListener : {},
store : null,
selected_item: null,
oldframewidth: 0,
items_selected: null,
pagesize: -1,
__init__ : function(json) {
  var _this = this;
  
  _this.items_selected = new Q.HashMap;
  //if( !window.scrollbarwidth )
  {
    window.scrollbarwidth = get_scrollbar_size( 1 );
    console.log( "scrollbar size " + window.scrollbarwidth );
  }
  json = json || {};
  _this.item_height = json.item_height || 30;
  _this.wndOwner = json.wnd;
  _this.title = json.title;
  _this.store = json.store;
  _this.columns = json.columns || [];
  _this.grid_render = json.grid_render || function(record) { return ""; }
  _this.item_key = json.item_key || function(record) { return ""; }
  // method overrides
  if(typeof json.item_onclick == 'function') {  
    _this.item_onclick = json.item_onclick; 
  }
  if(typeof json.item_ondblclick == 'function') {  
    _this.item_ondblclick = json.item_ondblclick; 
  }
  if(typeof json.item_onmouseover == 'function') { 
    _this.item_onmouseover = json.item_onmouseover; 
  }
  if(typeof json.item_onmouseout == 'function') {  
    _this.item_onmouseout = json.item_onmouseout; 
  }
  _this.item_ondblclick = (typeof json.item_ondblclick == 'function') ? json.item_ondblclick : function(item) {};
  _this.item_oninsert = (typeof json.item_oninsert == 'function') ? json.item_oninsert : function(item, record) {};

  // 初始化父窗口 renderer,用来显示jtable控件
  // 并初始化jtable视图
  _this.renderer = json.renderer;
  _this.initview(json);
  _this.on_viewstyle_changed();
  //_this.autosize();

  if( _this.wndOwner )
  {
    this.wndOwnerOldProc = _this.wndOwner.setWindowProc( ( function( ctx ) {
      return function( hwnd, msgid, json ) { 
        return ctx.window_proc( msgid, json);
      }
    })(this) );
  }
  else
  {
    Q.addEvent(window, 'resize', function(evt) {
      _this.autosize();
    } );
  }
},

/** dialog procedure
 * @memberof Q.Dialog.prototype
 * @private
 */
window_proc : function(msgid, json) {
  switch(msgid) {
  case MESSAGE.SIZE:
    this.autosize();
    break;
  }

  return this.wndOwnerOldProc(this.wndOwner.hwnd, msgid, json);
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

  //! 组合主框架
  _this.wnd.appendChild(_this.wndTitleBar);
  _this.wnd.appendChild(_this.wndFrame);
    _this.wndFrame.appendChild(_this.wndGroupHeader);
    _this.wndFrame.appendChild(_this.wndGroupBody);
    _this.wndFrame.appendChild(_this.wndMoveLine);
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
  _this.renderer.appendChild(_this.wnd);

  // 初始化表头表格和数据表格
  _this.wndGroupBody.innerHTML = 
    _this.wndGroupHeader.innerHTML = 
    '<table cellpadding="0" cellspacing="0" border="0"><tbody></tbody></table>';
  _this.wndTableHeaderRow = _this.wndGroupHeader.firstChild.insertRow(-1);
  _this.wndTableData = _this.wndGroupBody.firstChild;
  // Grid container
  _this.wndGridData = document.createElement("DIV");
  _this.wndGridData.className = "q-group-grid";
  _this.wndGroupBody.appendChild(_this.wndGridData);
  
  //init style
  if(json.wstyle) {
    var wstyle = (json.wstyle+"").replace(/\|+/g, " ");
    Q.addClass(this.wnd, wstyle);
  }
  if(!Q.hasClass(this.wnd, "q-attr-toolbar"))
    this.wndToolbar.style.display = "none";

  if(!Q.hasClass(this.wnd, "q-attr-grid")) {
    this.wndGridData.style.display = "none";
  } else {
    //this.viewStyle = "grid";
  }

  // 加载jtable的列
  _this._load_columns();

  // 添加事件
  _this.wndGroupHeader.onselectstart = function(evt) {return false;};
  _this.wndGroupBody.onscroll = function() { _this._sync_scroll(); };
  _this.wndGroupBody.onselectstart = function() { return false; };
},

on_viewstyle_changed: function() {
  if( Q.hasClass( this.wnd, "q-attr-grid") )
  { 
    if( this.viewStyle != "grid" ) {
      // change to grid 
      this.viewStyle = "grid";
      this.wndTitleBar.style.display = 'none';
      this.wndGroupHeader.style.display = 'none';
      this.wndTableData.style.display = 'none';
      this.wndGridData.innerHTML = '';
      this.wndGridData.style.display = '';
      this.render();
    }
  }
  else
  {
    if( this.viewStyle == "grid" ) {
      // change to list
      this.viewStyle = "list";
      this.wndTitleBar.style.display = '';
      this.wndGroupHeader.style.display = '';
      this.wndTableData.innerHTML = '';
      this.wndTableData.style.display = '';
      this.wndGridData.style.display = 'none';
      this.render();
    }
  }
  this.autosize();
},
  
/** 更新控件视图
 *
 * @memberof Q.Table.prototype
 */
autosize : function() {
  //Q.printf("table auto size");
  var _this = this;

  //if( !_this.isVisible )
  //  return;

  var frame_width, frame_height;
  var fullHeight = parseInt(_this.renderer.offsetHeight, 10);
  var fullWidth  = parseInt(_this.renderer.offsetWidth, 10);

  if( fullHeight == 0 || fullWidth == 0)
    return;
  //var currentstyle = _this.renderer.currentStyle;
  var currentstyle = _this.wnd.currentStyle;
  frame_height = fullHeight 
    - _this.wndTitleBar.offsetHeight 
    - _this.wndToolbar.offsetHeight
    - parseInt(currentstyle['borderTopWidth'],10)
    - parseInt(currentstyle['borderBottomWidth'],10)
    ;
  _this.wndFrame.style.height = frame_height+'px';
  if( Q.hasClass( this.wnd, "q-attr-grid") ) {
    _this.wndGroupBody.style.height = (frame_height)+'px';
    //_this.wndGroupBody.style.marginTop = 0;
  } else {
    //_this.wndGroupBody.style.marginTop = _this.wndGroupHeader.offsetHeight + 'px';
    _this.wndGroupBody.style.height = (frame_height - _this.wndGroupHeader.offsetHeight)+'px';
    _this._column_autosize();
  }
 
  // Save old frame width
  _this.oldframewidth = _this.wndFrame.offsetWidth;
  //_this.wndGroupBody.style.height = (frame_height - _this.wndGroupHeader.offsetHeight)+'px';
  //_this.wndGroupHeader.style.width = _this.wndGroupBody.scrollWidth + 'px';
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
  this.on_viewstyle_changed();
},

/** 移除表格样式
 * @memberof Q.Table.prototype
 * @param wstyle {string} - 移除的css样式属性
 * @return 无
 */
removeStyle: function(wstyle) {
  Q.removeClass(this.wnd, wstyle);
  this.on_viewstyle_changed();
},


/** 在指定行添加一行
 * @memberof Q.Table.prototype
 * @param nIndex {number} - 插入行位置
 * @param record {object} - 初始化行数据, record 必须是store的记录
 * @return 无
 */
insertItem : function(nIndex, record) {
  var _this = this;

  var ROW = null;
  if( this.viewStyle == "grid") {

    var content = "";
    if(typeof this.grid_render == 'function') {
      content = this.grid_render(record);
      var keyClassName = this.item_key( record );
      //content = content.replace( /\{([^\}]+)\}/ig, function(k) {
      //  return record[arguments[1]];
      //});
    }

    ROW = _this._create_cell(0, 0, { content : content,
        className: keyClassName,
    });
    _this.wndGridData.appendChild( ROW );
  } else {
    var has_vscroll = (_this.wndGroupBody.offsetHeight < _this.wndGroupBody.scrollHeight);
    ROW = _this.wndTableData.insertRow(-1);
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
        height : _this.item_height ,
        isHTML : column.isHTML
      });
      TD.style.display = theader.style.display;
      TD.appendChild(cell);
    }

    var has_vscroll2 = (_this.wndGroupBody.offsetHeight < _this.wndGroupBody.scrollHeight);
    if( has_vscroll != has_vscroll2 ) {
      //var rows = _this.wndTableData.rows.length
      //alert("scrollbar changed, rows: " + rows);
      //_this.columns[_this.columns.length-1].width = window.scrollbarwidth-3;
      _this.autosize();
    }
  }

  ROW.setAttribute('q:dataindex', record['__dataindex__']);  // 设置数据索引
  ROW.data = record;
  ROW.onmouseover = (function(t, r) { return function() { 
    if(!t.item_is_enabled(r))
      return;
    if(t.item_is_selected(r)) 
      return;
    Q.addClass(r, "mouseover");
  }})(this, ROW);
  ROW.onmouseout  = (function(t, r) { return function() { 
    if(!t.item_is_enabled(r))
      return;
    if(t.item_is_selected(r)) 
      return;
    Q.removeClass(r, "mouseover");
  }})(this, ROW);
 
  Q.click( ROW, 
    (function(t, r) { return function(evt) { t._items_onclick( r, evt ) } } )( this, ROW ), 
    (function(t, r) { return function(evt) { t._items_ondblclick( r ) } } )( this, ROW )
  );
  //ROW.onclick = (function(t, r) { return function(evt) {
    /*
    if(r.clickonce) {
      r.clickonce = false;
      clearTimeout(r.t);
      t._items_ondblclick(r);
    } else {
      r.clickonce = true;
      r.t = setTimeout((function(b) { return function() { 
      b.clickonce = false; t._items_onclick(r); 
    }})(r), 200);
    }
    */
  //  return t._items_onclick(r, evt );
  //  //return false;
  //}})(this, ROW);

  _this.item_oninsert(ROW, record);
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
  DIV.style.cssText = 'width:'+(json.width) + 'px; heights:'+json.height + 'px;line-heights: '+json.height+'px;';
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
  if( Q.hasClass( this.wnd, "q-attr-grid") )
  { 
    if( this.viewStyle == "grid" ) {
      this.wndGridData.innerHTML = '';
    }
  }
  else
  {
    if( this.viewStyle == "list" ) {
      this.wndTableData.innerHTML = '';
    }
  }
},

_load_columns : function() {
  var totalwidth = 0;
  // Push last fix column with end
  // 1px border-width, 1px is adjust 
  this.columns.push( { title: "", width: 0, fixed: true, renderer: function(r) { return ''; }, islast: true } );
  for(var i=0; i < this.columns.length; i++) {
    var column = this.columns[i];
    column.width = parseInt(column.width, 10);
    totalwidth += column.width;
    if( i == ( this.columns.length - 1 ) )
    {
      column.fixed = true;
    }
    this.insertColumn(i, column);
  }

  this.oldframewidth = totalwidth;
},

insertColumn : function(arrIndex, json) {
  var _this = this;
  var TD = _this.wndTableHeaderRow.insertCell(-1);
  
  json.isHidden = !!json.isHidden;
  var className = json.islast ? 'q-column-header-last' : '';
  
  TD.style.display = json.isHidden ? 'none' : '';
  TD.setAttribute('_index', arrIndex);
  TD.innerHTML = '<DIV align="'+json.align+'" class="q-column-header '+className+'" style="width:'+json.width+'px;"><a HideFocus>'
          +json.title+'</a></DIV>';
  
  TD.firstChild.onclick = function() { _this._column_click(this.parentNode.cellIndex); };

  //!固定宽度
  if( !json.fixed ) {
    new Q.TableColumn( TD, {
      moveline: _this.wndMoveLine, 
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
 * @param item1 {dom} - 一个Row
 * @param item2 {dom} - 另一个Row
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
    _this._column_setwidth( TD.cellIndex, handler._width );
    _this._sync_scroll();
  }
},

_column_dynamic : function( exclude_col ) {
  var cols = [];
  var fixedwidth = 0;
  for( var i = 0; i < this.columns.length; i++ ) {
    if( ( i != exclude_col ) && ( !this.columns[i].fixed ) ) {
      cols.push( i );
    } else {
      fixedwidth += this.columns[i].width+1; // border-width
    }
  }
  return { cols: cols, fixedwidth: fixedwidth };
},

_column_setwidth: function( nCol, width ) {
  if( this.columns[nCol].fixed ) {
    return;
  }

  this.columns[nCol].width = width;
  this._column_autosize();
},

_column_autosize: function() {
  var fullwidth = this.wndFrame.offsetWidth-this.columns.length;
  var oldframewidth = this.oldframewidth - this.columns.length;
  Q.printf( "column autosize -> current: " + this.wndFrame.offsetWidth + ", old: " + this.oldframewidth );
  // scrollbar width
  var hscrollwidth = 0;
  if( this.wndGroupBody.offsetHeight < this.wndGroupBody.scrollHeight ) { 
    hscrollwidth = window.scrollbarwidth; 
  }

  fullwidth -= hscrollwidth;
  oldframewidth -= hscrollwidth;

  
  // get dynamic cols
  var dynamic = this._column_dynamic( -1 );
  var cols = dynamic.cols;
  var fixedwidth = dynamic.fixedwidth;
  var restwidth = fullwidth-fixedwidth; 

  for( var i = 0; i < cols.length; i++ )
  {
    var index = cols[i];

    var oldwidth = this.columns[index].width;
    var f = oldwidth / oldframewidth;
    if( i == ( cols.length - 1 ) ) {
      //this.columns[index].width = restwidth-1;  //// last calculate column not include borider-right-width
      // 最后一列需要加上滚动条宽度, 因为column宽度是包含滚动条的, 
      // (hscrollwidth-1) 是为了防止内容已出现水平滚动条
      this.columns[index].width = restwidth-1+(hscrollwidth-1);  //// last calculate column not include borider-right-width
    } else {
      this.columns[index].width = Math.floor( f * fullwidth );
      restwidth -= this.columns[index].width; // with border-right-width
    }
    
    var div = this.wndTableHeaderRow.cells[index].firstChild;
    div.style.width = (this.columns[index].width) + 'px';
  }
  
  //console.log( Object.values(this.columns) );

  var _this = this;
  this.each( function(item) {
    for( var i = 0; i < cols.length; i++ )
    {
      var index = cols[i];
      var div = item.cells[index].firstChild;
      div.style.width = (_this.columns[index].width)+'px'; 
    }
  });
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
  

  
// 处理鼠标单击事件，处理之后传递给外部接口_items_onclick
_items_onclick : function(item, evt ) {
  var _this = this;
  if(!this.item_is_enabled(item))
    return false;
  Q.removeClass(item, "mouseover");
  
  // 不支持多选
  if( Q.hasClass( this.wnd, "q-attr-noselect") ) {
    // do nothing
  } else if( Q.hasClass(this.wnd, "q-attr-multiselect")) {
    if(_this.select_mode == SELECT_MODE_CTRL) { // CTRL键按下时
      _this.item_set_selected(item,!_this.item_is_selected(item));  
    } else if(_this.select_mode == SELECT_MODE_SHIFT) { // SHIFT键按下时
    } else {
      _this.items_selected.each( function(node, key) { 
          _this.item_set_selected(_this.items_selected.item(key),false);
      });
      _this.item_set_selected(item, true);
    }
  } else {
    if(item == this.selected_item)
      return false;
    this.item_set_selected(item, true);
    this.item_set_selected(this.selected_item, false);
    this.selected_item = item;
  }

  if(_this.item_onclick)
    return _this.item_onclick(item, evt );

  return true;
},

_items_ondblclick : function(item) {
  if(!this.item_is_enabled(item)) {
    return false;
  }
  if(this.item_ondblclick)
    this.item_ondblclick(item);
},
  

each : function(callback) {
  var _this = this;
  for(var i=0; i < _this.wndTableData.rows.length; i++) {
    callback(_this.wndTableData.rows[i]);
  }
},

removeItem : function(dataindex) {
  var self = this;
  var item = self.getItem( dataindex );
  if( this.viewStyle == "grid") {
    item.parentNode.removeChild( item );
  } else {
    _this.wndTableData.deleteRow(item.rowIndex);
  }
  //_this.store.remove(record);
  //_this.autosize();
},
  
item_insert : function(index, record) {
  var _this = this;
  _this.store.push(record);
  _this.insertitem(index, record);
  _this.autosize();
},

item_index : function(item) { 
  return parseInt(item.getAttribute('q:dataindex'),10); 
},

item_is_enabled  : function(item) { return item && (!item.getAttribute('_disabled')); },
item_is_selected : function(item) { return Q.hasClass(item, "q-selected"); },

// 设置选择
items_selected_all : function(bSelectAll) {
  var _this = this;
  _this.each(function(item) {
    _this.item_set_selected(item, bSelectAll);
  });
},  
  
item_set_selected : function(item, bSelected) {
  if(this.item_is_enabled(item)) {
    var dataIndex = this.item_index(item);
    // 设置颜色
    if(bSelected) {
      Q.addClass(item, "q-selected");
    } else {
      Q.removeClass(item, "q-selected");
    }      
  }  
},

get_items_selected : function() {
  var _this = this;
  var arr = [];
  if( Q.hasClass( this.wnd, "q-attr-noselect") ) {
    // do nothing
  } else if( Q.hasClass(this.wnd, "q-attr-multiselect")) {
    _this.items_selected.each(function(node, key){
      arr.push(_this.items_selected.item(key));
    });

  } else {
    arr.push(_this.selected_item);
  }

  return arr;
},

/** */
getItem : function( dataIndex ) {
  var self = this;
  var item = self.wndTableData.querySelector('[q:dataindex="'+dataIndex+'"]');
  alert(item);
  return item;
},

getItemData : function( index ) {
  if( index < 0 && index >= this.store.total_size() ) {
    return null;
  } else {
    return this.store.item(index);
  }
},

loadPage : function(pageIndex, callback ) {
  var _this = this;
  this.store.load_page(pageIndex, function(data) {
    _this.loadPageData(data);
    callback();
  } );
},


loadPageData : function(data) { 
  var _this = this; 
  // if(_this.isstyle(WS_CHECKBOX)) {
  // 		_this.table_header_row.cells[0].childNodes[0].childNodes[0].checked = false;
  // }

  
  //_this.rows_selected.each(function(n, key){ _this.row_set_unselected(_this.rows_selected.item(key)); });
  // 清楚选中数据
  //_this.rows_selected.clear();
  //_this.checkboxes.clear();

  _this.clear();
	var dsize = data.length;
	var tsize =_this.wndTableData.rows.length;
	//var minsize = Math.min(dsize, tsize);
	var csize = _this.columns.length;
  for(var i=0; i < dsize; i++) {
    //var ROW	= _this.wndTableData.rows[i];
    var dd = data[i];
    var rindex = this.store.push(dd);
    record = _this.getItemData(rindex);
    this.insertItem( -1, record );

    /*
		ROW.setAttribute('dataIndex', parseInt(record['dataIndex'], 10));
		
		for(var j=0; j<csize; j++) {
			var theader = _this.wndTableHeaderRow.cells[j];
			var config  = _this.columns[theader.getAttribute('name')];
			var TD = ROW.cells[j];
			var content = record[config.name];
			TD.style.display = theader.style.display;
			if(typeof config.renderer == 'function') {
				content = config.renderer(record);
			}
			
			if(config.isHTML) {
				TD.childNodes[0].innerHTML = content;
			} else {
				TD.childNodes[0].innerText = content;
			}
		}
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.checkboxes.add(record['dataIndex'], ROW.cells[0].childNodes[0].childNodes[0]);
		}
      */
	}
		
  /*
	if(dsize > tsize ) {	// 数据多余表格函数，插入行
		while(dsize != _this.wndTableData.rows.length) {
			_this.insertrow(-1, data.item(_this.wndTableData.rows.length));
		}	
	} else {
		while(dsize != _this.wndTableData.rows.length) {
			_this.wndTableData.deleteRow(dsize);
		}
	}
	
  if(_this.wndTableData.rows.length > 0) {
		_this.row_height = _this.wndTableData.rows[0].offsetHeight;
  }
    */
},
	
sync_scroll : function() {
  this.wndGroupHeader.scrollLeft = this.wndGroupBody.scrollLeft;
},

set_page_size : function(pagesize) {
  this.pagesize = pagesize;
},

page_size : function() {
  if( this.pagesize == -1) {
    return this.store.total_size()>0 ? this.store.total_size() : 30;
  } else {
    return this.pagesize;
  }
},

total_size: function() {
  return this.store.total_size();
}

}); 

