
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
fromproxy: false,
__init__ : function(config) {
  config = config || {}; 
  this.records = new Q.HashMap;
  if(config.data) {
    this.fromproxy = false;
    this.append_data(config.data);
  }
  
  if(config.proxy) { 
    this.proxy = config.proxy; 
    //this.loadRemote(0, 30, null);
    this.fromproxy = true;
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
append_data : function(arr) {
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
  Q.ajax({
    command: _this.proxy+'&page='+page+'&size='+pagesize,
    oncomplete : function(xmlhttp) {
      var s = Q.json_decode(xmlhttp.responseText);
      if(typeof callback == 'function' && ( s.data instanceof Array ) && ( s.data.length > 0 ) ) { 
        var start = _this.records.index;
        _this.append_data( s.data );
        callback( start, s.data.length );
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
  return this.records.item(index);
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


//window.cached;
window.get_scrollbar_size = function (fresh) {
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
viewStyle: "list",  // "list", "grid"
columns: [],
evtListener : {},
store : null,
selected_item: null,
oldframewidth: 0,

__init__ : function(json) {
  var _this = this;
  if( !window.scrollbarwidth )
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

  // 初始化父窗口 wndParent,用来显示jtable控件
  // 并初始化jtable视图
  _this.wndParent = Q.$(json.id);
  _this.initview(json);
  _this.on_viewstyle_changed();
  _this.render();
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


//  // 开始观察
  //this.io = new IntersectionObserver(([change]) => {
    //console.log(change.isVisible) // 被覆盖就是false，反之true
    //_this.isVisible = change.isVisible;
  //}, {
    //threshold: [0, 1.0],
    //delay: 1000, 
    //trackVisibility: true,
  //} ).observe( this.wnd);


  // 开始观察
  //this.io.observe(this.wnd);

  // 停止观察
  //this.io.unobserve(element);

  // 关闭观察器
  //this.io.disconnect();
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
  _this.wndParent.appendChild(_this.wnd);

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
  Q.printf("table auto size");
  var _this = this;

  //if( !_this.isVisible )
  //  return;

  var frame_width, frame_height;
  var fullHeight = parseInt(_this.wndParent.offsetHeight, 10);
  var fullWidth  = parseInt(_this.wndParent.offsetWidth, 10);

  if( fullHeight == 0 || fullWidth == 0)
    return;
  //var currentstyle = _this.wndParent.currentStyle;
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
    _this.wndGroupBody.style.marginTop = 0;
  } else {
    _this.wndGroupBody.style.marginTop = _this.wndGroupHeader.offsetHeight + 'px';
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
 * @param record {object} - 初始化行数据
 * @return 无
 */
append : function(nIndex, record) {
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
  }

  ROW.setAttribute('__dataindex__', record['__dataindex__']);  // 设置数据索引
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

/** 追加数据到表格视图 
 *
 * @memberof Q.Table.prototype
 * @param data {Object[]} - 数据记录集
 */

append_data : function(data) {
  this.store.append_data(data);
},

render : function() {
  if( this.store.fromproxy ) {
    this.store.loadPage( 0 , 30,  ( function(t) { return function( start, count ) {
      for( var i=start; i< (start+count); i++) {
        t.append(i, t.store.item(i) );
      }
    } } )(this) );
  } else{
    this.store.each((function(t) { return function(record, index) {
      t.append(index, record);
    }})(this));
  }
},

_load_columns : function() {
  var totalwidth = 0;
  // Push last fix column with end
  // 1px border-width, 1px is adjust 
  this.columns.push( { title: "", width: window.scrollbarwidth-3, fixed: true, renderer: function(r) { return ''; }, islast: true } );
  for(var i=0; i < this.columns.length; i++) {
    var column = this.columns[i];
    column.width = parseInt(column.width, 10);
    totalwidth += column.width;
    if( i == ( this.columns.length - 1 ) )
    {
      column.fixed = true;
    }
    this.insert_column(i, column);
  }

  this.oldframewidth = totalwidth;
},

insert_column : function(arrIndex, json) {
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
  var fullwidth = this.wndFrame.offsetWidth;
  var restwidth = width - this.columns[nCol].width;
  var dx = 0;

  // get dynamic cols
  var dynamic = this._column_dynamic( nCol );
  var cols = dynamic.cols;
  var fixedwidth = dynamic.fixedwidth;
  var restwidth = width - this.columns[nCol].width; 

  // calculate dx
  if( cols.length > 1 )
  {
    dx = Math.floor( restwidth/cols.length );
  }

  var dump = { fullwidth: fullwidth, restwidth:restwidth, dx:dx, cols: cols };
  console.log( dump );



  this.columns[nCol].width = width;

  for( var i = 0; i < cols.length; i++ )
  {
    var index = cols[i];
    if( i == ( cols.length - 1 ) ) {
      this.columns[index].width -= restwidth;  // last calculate column
      restwidth -= restwidth;
    } else {
      this.columns[index].width -= dx;  // border-right-width
      restwidth -= dx;
    }
    console.log( restwidth );
    var div = this.wndTableHeaderRow.cells[index].firstChild;
    div.style.width = this.columns[index].width + 'px';
  }


  console.log( this.columns );

  var _this = this;
  cols.push(nCol);
  _this.items_each( function(item) {
    for( var i = 0; i < cols.length; i++ )
    {
      var index = cols[i];
      var div = item.cells[index].childNodes[0];
      div.style.width = _this.columns[index].width+'px'; 
    }
  });
},

_column_autosize: function() {
  var fullwidth = this.wndFrame.offsetWidth;
  Q.printf( "current: " + this.wndFrame.offsetWidth + ", old: " + this.oldframewidth );

  // get dynamic cols
  var dynamic = this._column_dynamic( -1 );
  var cols = dynamic.cols;
  var fixedwidth = dynamic.fixedwidth;
  var restwidth = fullwidth-fixedwidth; 

  for( var i = 0; i < cols.length; i++ )
  {
    var index = cols[i];

    var oldwidth = this.columns[index].width;
    var f = oldwidth / this.oldframewidth;
    if( i == ( cols.length - 1 ) ) {
      //this.columns[index].width = restwidth-1;  //// last calculate column not include borider-right-width
      this.columns[index].width = restwidth-1;  //// last calculate column not include borider-right-width
    } else {
      this.columns[index].width = Math.floor( f * fullwidth );
      restwidth -= this.columns[index].width; // with border-right-width
    }
    
    var div = this.wndTableHeaderRow.cells[index].firstChild;
    div.style.width = (this.columns[index].width ) + 'px';
  }

  var _this = this;
  this.items_each( function(item) {
    for( var i = 0; i < cols.length; i++ )
    {
      var index = cols[i];
      var div = item.cells[index].childNodes[0];
      div.style.width = _this.columns[index].width+'px'; 
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
  

items_each : function(callback) {
  var _this = this;
  for(var i=0; i < _this.wndTableData.rows.length; i++) {
    callback(_this.wndTableData.rows[i]);
  }
},

item_enable : function(item, enabled) {
  var _this = this;
  // 设置选中颜色
  //item.style.backgroundColor = '#DFE8F6'; //'#A2CAEA'
},
  
item_remove : function(item) {
  var _this = this;
  var record = _this.getRecord(item);
  if( this.viewStyle == "grid") {
    item.parentNode.removeChild( item );
  } else {
    _this.wndTableData.deleteRow(item.rowIndex);
  }
  _this.store.remove(record);
  _this.autosize();
},
  
item_insert : function(index, record) {
  var _this = this;
  _this.store.push(record);
  _this.insertitem(index, record);
  _this.autosize();
},

item_index : function(item) { 
  return parseInt(item.getAttribute('__dataindex__'),10); 
},
item_is_enabled  : function(item) { return item && (!item.getAttribute('_disabled')); },
item_is_selected : function(item) { return Q.hasClass(item, "q-selected"); },

// 设置选择
items_selected_all : function(bSelectAll) {
  var _this = this;
  _this.items_each(function(item) {
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

/**
 * 获取行记录数据
 * @memberof Q.Table.prototype
 * @param {dom} item - 行元素
 * @return {Object} 返回行记录
 */
getRecord : function(item) {
  var dataIndex = this.item_index(item);
  return this.store.records.item(dataIndex);
},

addToolButton : function( json ) {
  
},

sync_scroll : function() {
  this.wndGroupHeader.scrollLeft = this.wndGroupBody.scrollLeft;
}
}); 

