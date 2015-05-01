/*------------------------------------------------------------------------------------
 $ class jtable component
 $ date: 2009-2-6 16:31
 $ author: LovelyLife http://onlyaa.com
 
 $ bugs Fixed:
 2009-06-10 16:18:40 [LovelyLife]:
   增加拖动变换列 
 2009-10-21 11:10:22 [LovelyLife]:
   jtable:initview函数中的document.body.appendChild在ie8中不兼容，改成
  window.onload消息队列中处理
  
 2009-10-26 10:51:33 [LovelyLife]:
   修改了row_disabled功能，如果存在checkbox，则禁用checkbox
   
---------------------------------------------------------------------------------------*/


// 当有true返回是，说明结束循环
Array.prototype.each = function(callback) {
  var len = this.length;
  if(typeof callback != 'function') {
    alert('not a function');
    return;
  }
  for(var i=0; i < len; i++) {
    if(callback(this[i], i)) {  break; }
  }
};

// handle event listen
var BindHandler = function(object, func) {
  return function() {
    return func.apply(object, arguments);
  };
};
 
var BindAsEventHandler = function(object, func) {
  return function(event) {
    return func.call(object, (event || window.event));
  };
};
 
var CurrentStyle = function(element){
  return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

// create the Data Store
Q.store = Q.extend({
records : null,  // 记录集
proxy : null,
currentpage : -1,
length : 0,
__init__ : function(config) {
  var config = config || {}; 
  var _this = this;
  _this.records = new STRUCT_HASMAP;
  _this.remote = config.remote || false;
  if(config.datasource)
    _this.load_json(config.datasource);
  
  if(config.proxy) { 
    _this.proxy = config.proxy; 
    _this.load_remote(0, 30, null);
  }
},
  
load_json : function(jsonsrouce, bClearOldData) {
  var _this = this;
  if(!!bClearOldData) {
    _this.records = new STRUCT_HASMAP;
    _this.length = 0;
  }
    
  jsonsrouce.each(function(record, index) {
      record["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
      _this.records.push(record);
  });
},
  
load_remote : function(page, pagesize, callback) {
  var _this = this;
  Q.Ajax({
    command: _this.proxy+'&page='+page+'&size='+pagesize,
    oncomplete : function(xmlhttp) {
      //alert(xmlhttp.responseText);
      var s = Q.json_decode(xmlhttp.responseText);
      _this.load_json(s.data);
      _this.length = s.extra;
      
      if(typeof callback == 'function') {
        callback(_this.records);
      }
    }
  });
},
  
load_page : function(page, pagesize, callback) {
  var fnCallback = callback || function(arr) {};
  var _this = this;
    
  if(_this.proxy) {
    _this.load_remote(page, pagesize, fnCallback);
  } else {
    var pagedata = new STRUCT_HASMAP;
    for(var i=(page-1) * pagesize; i < (page * pagesize); i++) {
      if(i >= _this.records.length) { break; }
      pagedata.push(_this.records.item(i));
    }
    fnCallback(pagedata);
  }
},
  
push : function(record) {
  var _this = this;
  record["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
  _this.records.push(record);
  _this.length++;
},
  
remove : function(record) {
  var _this = this;
  var key = _this.records.find(record);
  _this.records.remove(key);
  _this.length--;
},

//! 渲染数据接口
render : function(fnHanlder) {
  if(fnHanlder) {
    this.records.each(fnHanlder);
  }
},
  
getRecord : function(dataIndex) {
  if(!this.records[dataIndex]) {
    return null;
  }
  return this.records[dataIndex];
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
      //__DEBUGER.print("_isDragable: "+this._isDragable);
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
var SELECT_MODE_SINGLE  = 0;
var SELECT_MODE_CTRL  = 1;
var SELECT_MODE_SHIFT  = 2;

Q.table = Q.extend({
// 常量
STYLE : {
  WS_BORDER    : 0x00000004,

  WS_AUTOHEIGHT  : 0x00000008,  // 当主窗口的高度小于父窗口高度时，则父窗口自动高度，否则父窗口高度不变
  WS_100HEIGHT  : 0x00000010,
  WS_100WIDTH    : 0x00000020,
  WS_TITLE    : 0x00000040,
  WS_CHECKBOX    : 0x00000080,
  WS_MULTISELECT  : 0x00000100,  // 支持多选
  WS_PAGING    : 0x00000200,  // 分页样式
  WS_FITPARENT  : 0x00000400,  // 自动填满宽度
},

//
// 以"wnd"开头的变量都是HTML对象，是组成jtable控件的UI元素，
// jtable的组成机构如下图：
//
// |--------------------| __ wndTitle
// |--------------------| __ wndGroupHeader
// |--------------------|
// |          | __ wndFrame
// |  wndGroupBody  | 
// |          |
// |--------------------| __ wndToolbar
// |--------------------|
//


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
  if(typeof json.row_onclick == 'function') {  _this.row_onclick = json.row_onclick; }
  if(typeof json.row_ondblclick == 'function') {  _this.row_ondblclick = json.row_ondblclick; }
  if(typeof json.row_onmouseover == 'function') {  _this.row_onmouseover = json.row_onmouseover; }
  if(typeof json.row_onmouseout == 'function') {  _this.row_onmouseout = json.row_onmouseout; }
  if(typeof json.row_oninsert == 'function') {  _this.row_oninsert = json.row_oninsert; }

  // 初始化父窗口 wndParent,用来显示jtable控件
  // 并初始化jtable视图
  _this.wndParent = Q.$(json.container);
  _this._initview(json);

  // 监听改变窗口大小事件，用户自适应父容器的宽度或者高度
  Q.addEvent(window, 'resize', 
    BindAsEventHandler(window, function() {
      if(_this.wndParent.style.width.indexOf('%') != -1 
      || _this.wndParent.style.height.indexOf('%') != -1) {
        _this.autosize();
      } 
    })
  );
  _this.render();
  _this.autosize();
},

//  初始化表格控件视图
_initview : function(json) {
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
  _this.loadColumns();

  // 添加事件
  _this.wndGroupHeader.onselectstart = function(evt) {return false;};
  _this.wndGroupBody.onscroll = function() { _this._sync_scroll(); };
  _this.wndGroupBody.onselectstart = function() { return false; };
},

// 更新控件视图
autosize : function() {
  var _this = this;
  var frame_width, frame_height;
  var fullHeight = parseInt(_this.wndParent.offsetHeight, 10);
  var fullWidth  = parseInt(_this.wndParent.offsetWidth, 10);
  var currentstyle = CurrentStyle(_this.wnd);
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

set_style: function(wstyle) {
  Q.addClass(this.wnd, wstyle);
},

remove_style: function() {
  Q.removeClass(this.wnd, wstyle);
},

append : function(nIndex, record) {
  var _this = this;  
  var ROW = _this.wndTableData.insertRow(-1);
  ROW.onmouseover = function() { return _this._rows_onmouseover(this); };
  ROW.onmouseout  = function() { return _this._rows_onmouseout(this);  };
  ROW.onclick     = (function(r, t) { return function(evt) {
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
        }})(ROW, _this);
  ROW.setAttribute('dataIndex', record['dataIndex']);  // 设置数据索引
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
    
    var width = theader.firstChild.offsetWidth;
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
  DIV.style.cssText = 'width:'+json.width + 'px; height:'+json.height + 'px;line-height: '+json.height+'px;';
  DIV.innerHTML = json.content;
  //if(json.isHTML)  DIV.innerHTML = json.content;
  //else DIV.innerText = json.content;
  _this._init_cell(DIV, nRow, nCol, json);
  return DIV;
},
  
loadData : function(datasrc, bClearOldData) {
  var _this = this;
  _this.store.load_json(datasrc, !!bClearOldData);
  if(!!bClearOldData) {
    _this.wndTableData.innerHTML = ""; //removeChild(_this.wndTableData.firstChild);
  }
},

render : function() {
  var _this = this;
  this.store.render(function(record, index) {
    _this.append(index, record);
  });
},

loadColumns : function() {
  var _this = this;
  for(var i=0; i < _this.columns.length; i++) {
    var column = _this.columns[i];
    column.width = parseInt(column.width, 10);
    _this.insertcolumn(i, column);
  }
},

insertcolumn : function(arrIndex, json) {
  var _this = this;
  var TD = _this.wndTableHeaderRow.insertCell(-1);
  
  json.isHidden = !!json.isHidden;
  TD.style.display = json.isHidden ? 'none' : '';
  TD.setAttribute('_index', arrIndex);
  TD.innerHTML = '<DIV align="'+json.align+'" class="q-column-header" style="width:'+json.width+'px;"><a HideFocus>'
          +json.title+'</a></DIV>';
  
  TD.firstChild.onclick = function() { _this._column_click(this.parentNode.cellIndex); };
  TD.firstChild.ondblclick = function() { _this._column_dblclick(this.parentNode.cellIndex);};

  //!固定宽度
  if(!json.fixed) {
    new __TH(TD, {moveline: _this.wndMoveLine, 
      onStart: function(evt, handler) { 
        _this.column_MouseDown(evt, handler); 
      }, 
      onStop: function(evt, handler) { 
        _this.column_MouseUp(evt, handler); 
      }
    });
  }
},

setClickEvent : function(colIndex, clickEvent) {
  var _this = this;
  var column = _this.columns[colIndex];
  if(column) {
    if(!column.clicks) {
      column.clicks = [];
    }
    column.clicks.push(clickEvent);
  } else {
    alert('Invalid Column');
  }
},

// 排序函数原型 sortFunc(row1, row2) 
// 
setSortFunc: function(colIndex, sortFunc) {
  var _this = this;
  var column = _this.columns[colIndex];
  if(column) {
    column.sort = sortFunc;
  } else {
    alert('Invalid Column');
  }
},
  
column_MouseDown : function(evt, handler) {
  var _this = this;
  if(handler._isResizable) {
    _this.wndMoveLine.style.height = 
      (_this.wnd.offsetHeight - _this.wndTitleBar.offsetHeight) + 'px';
  }
},
  
column_MouseUp : function(evt, handler) {
  var _this = this;
  var TD = handler.hwnd;
  if(handler._isResizable) {
    var nCol = TD.cellIndex;
    _this.rows_each( function(row) { row.cells[nCol].childNodes[0].style.width = handler._width+'px'; });
    _this.autosize();
    _this._sync_scroll();
  }
},

//! 列表头单击事件
_column_click : function(nCol) {
  var column = this.columns[nCol];
  // alert(column.clicks);
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
  
_column_dblclick : function(nCol) {},

onClickColumn : function(nCol) {},
onDblClickColumn : function(nCol) {},
onInitCell : function(TD, nItem, nCol, json) {},
  
_init_cell : function(container, nItem, nCol, json) {},
  
// 处理鼠标单击事件，处理之后传递给外部接口_rows_onclick
_rows_onclick : function(row) {
  var _this = this;
  if(!this.row_is_enabled(row))
    return false;
  
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
  _this.row_onclick(row);
},

_rows_ondblclick : function(row) {
  if(!this.row_is_enabled(row)) {
    return false;
  }
  this.row_ondblclick(row);
},
  
// 处理鼠标滑过事件，处理之后传递给外部接口row_onmouseover
_rows_onmouseover : function(row) {
  var _this = this;
  if(_this.row_is_enabled(row)) {
    if(!_this.row_is_selected(row)) {
      _this.row_onmouseover(row);
    }
  } 

},

// 处理鼠标离开事件，处理之后传递给外部接口row_onmouseout  
_rows_onmouseout : function(row) {
  var _this = this;
  if(_this.row_is_enabled(row)) {
    if(!_this.row_is_selected(row)) {
      _this.row_onmouseout(row);
    }
  }
},

// events
row_onclick : function(row) {},
row_onmouseover : function(row) {},
row_onmouseout : function(row){},
row_oninsert : function(row, record) {},

rows_each : function(callback) {
  var _this = this;
  for(var i=0; i < _this.wndTableData.rows.length; i++) {
    callback(_this.wndTableData.rows[i]);
  }
},

row_enable : function(row, enabled) {
  var _this = this;
  var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
  // 设置选中颜色
  // _this.row_set_color(row, '#DFE8F6'); //'#A2CAEA'
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

row_index : function(row) { return parseInt(row.getAttribute('dataIndex'),10); },
row_is_enabled : function(row) { return row && (!row.getAttribute('_disabled')); },
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
  
get_records : function(row) {
  var _this = this;
  var dataIndex = parseInt(_this.row_index(row), 10);
  var store = _this.store;
  var arr = [];
  if(-1 == dataIndex) {  
    _this.store.records.each(function(node, i) { arr.push(node); });
    return arr;
  }

  if(store.records.has(dataIndex) ) {
    arr.push(store.records.item(dataIndex));
    // alert("get_records:" + store.records.item(dataIndex));
    return arr;  
  } else {
    alert('无效数据索引['+dataIndex+']!');
    return null;
  }
},

row_index : function(row) {
  return parseInt(row.getAttribute('dataIndex'),10);  
},

get_text : function(row, fieldName) {
  var _this = this;
  var record = _this.get_records(row)[0];
  return record[fieldName];
},
  
sync_scroll : function() {}
}); 

