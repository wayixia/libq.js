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
		if(callback(this[i], i)) {	break; }
	}
}

if(typeof XHTML_MODE == 'undefined') {
	var XHTML_MODE = true;		// 是否为XHTML模式
}
var _DEBUG_MODE = false;	// 是否开启debug模式

// 获取element的绝对位置
function $GetAbsPosition(element) {
	var w = element.offsetWidth;
	var h = element.offsetHeight;
	var t = element.offsetTop;
	var l = element.offsetLeft;
	while( element = element.offsetParent) {
		t+=element.offsetTop;
		l+=element.offsetLeft;
	}
	return { width : w, height : h,	left : l,	top : t	};
}

function $GetScrollInfo() {
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
}

// handle event listen
var BindHandler = function(object, func) {
	return function() {
		return func.apply(object, arguments);
	};
}
 
var BindAsEventHandler = function(object, func) {
	return function(event) {
		return func.call(object, (event || window.event));
	}
}
 
var CurrentStyle = function(element){
	return element.currentStyle || document.defaultView.getComputedStyle(element, null);
}
 

// 兼容ff的attachEvent接口
function addEventHandler(oTarget, sEventType, fnHandler) {
	if (oTarget.addEventListener) {
		oTarget.addEventListener(sEventType, fnHandler, false);
	} else if (oTarget.attachEvent) {
		oTarget.attachEvent("on" + sEventType, fnHandler);
	} else {
		oTarget["on" + sEventType] = fnHandler;
	}
}
 
function removeEventHandler(oTarget, sEventType, fnHandler) {
    if (oTarget.removeEventListener) {
        oTarget.removeEventListener(sEventType, fnHandler, false);
    } else if (oTarget.detachEvent) {
        oTarget.detachEvent("on" + sEventType, fnHandler);
    } else { 
        oTarget["on" + sEventType] = null;
    }
}


/* 列的json数据格式 STRUCT_COLUMN {
	name  : '列名称'
	title : '标题',
	width : '宽度',
	align : '对其方式',
	callback : function() {},	// 自定义处理
	extra : {}					// 用作接口扩展
} 
*/


// has表， 定义了基本的数据管理接口
var STRUCT_HASMAP = Q.KLASS();
STRUCT_HASMAP.prototype = {
	base : null,
	length : 0,
	dataIndex : 0,
	_initialize : function() {
		this.base = new Object();
	},
	
	each : function(callback) {
		if(typeof callback != 'function') {
			return;
		}
		for(var key in this.base) {
			if(callback(this.base[key], key) == 0) { break; }
		}
	},
	
	item : function(key) {
		return this.base[key];
	},
	
	add    : function(key, value) {
		this.base[key] = value;
		this.length = this.length + 1;
	},
	
	remove : function(key) {
		//alert('is have')
		if(!this.has(key)) { return; }
		//alert('yes')
		delete this.base[key];
		this.length = this.length - 1;
	},
	
	clear : function() {
		var _this = this;
		_this.each(function(item, key){
			_this.remove(key);
		});
	},
	
	push : function(value) {
		this.base[this.dataIndex] = value;
		this.length++;
		this.dataIndex++;
	},
	
	pop : function() {
		var re = this.base[this.dataIndex];
		delete this.base[this.dataIndex];
		this.length--;
		return re;
	},
	
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
	
	has : function(key) {
		return !(typeof this.base[key] == 'undefined');
	}
}

// create the Data Store
var jstore = Q.KLASS();
jstore.prototype = {
	records : null,	// 记录集
	status  : null,	// 状态集
	fields : null,	// 字段集
	proxy : null,
	currentpage : -1,
	loadtype : null,	// 数据初始化数据类型
	length : 0,
	_initialize : function(json) {

		var _this = this;
		_this.records = new STRUCT_HASMAP;
		if(!json) {	return;	}
		_this.remote = json.remote || false;
		_this.fields = json.fields || [];
		if(json.loadtype) {
			_this.loadtype = json.loadtype.toLowerCase();
		}
		if( _this.loadtype == 'xml') {
			_this.load_xml(json.dataSource);
		} else if(_this.loadtype == 'array') {
			_this.load_jsarray(json.datasource);	
		} else if(_this.loadtype == 'json') {
			_this.load_json(json.datasource);
		}
		
		if(json.proxy) { _this.proxy = json.proxy; }
	},
	
	load_xml : function(xmlstr) {},
	
	load_jsarray : function(jsarray) {
		var _this = this;
		_this.records = new STRUCT_HASMAP;
		jsarray.each(function(record, index) {
			var rs = {};
			record.each(function(fieldvalue, i){
				rs[_this.fields[i]] = fieldvalue;
				
			});
			rs["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
			_this.records.push(rs);
		});
		_this.length = _this.records.length;
	},
	
	load_json : function(jsonsrouce) {
		var _this = this;
		_this.records = new STRUCT_HASMAP;
		jsonsrouce.each(function(record, index) {
				record["dataIndex"] = _this.records.dataIndex; // 存储数据索引， 用于确定改记录在记录集中的位置
				_this.records.push(record);
		});
		_this.length = _this.records.length;
	},
	
	load_remote : function(page, pagesize, callback) {
		var _this = this;
		
		//alert(_this.proxy+'&page='+page+'&size='+pagesize)
		AjaxComponent.addrequest({
			command: _this.proxy+'&page='+page+'&size='+pagesize,
			oncomplete : function(xmlhttp) {
				//alert(xmlhttp.responseText);
				var s = eval('(' + xmlhttp.responseText + ')');
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
			// alert('remote')
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
	}
};

var __TH = Q.KLASS();
__TH.prototype = {
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
	
	_initialize : function(TD, options) {
		options = options || {};
		this.onMove  = options.onMove  || function(oEvent, hander){};
		this.onStart = options.onStart || function(oEvent, hander){};
		this.onStop  = options.onStop  || function(oEvent, hander){};

		this.hwnd = TD;
		this._width = TD.offsetWidth;
		
		// moving line;
		if(!options.moveline) {
			this.hwnd_moveline = document.createElement('DIV');
			addEventHandler(window, "load", BindAsEventHandler(this, function(evt){
				document.body.appendChild(this.hwnd_moveline);
			}));
			this.hwnd_moveline.style.cssText = 'width: 1px; height: 1px; background: red; display: none; position: absolute; z-index: 200;';
		} else {
			this.hwnd_moveline = options.moveline;
		}
		
		//事件对象(用于绑定移除事件)
		this._fMove = BindAsEventHandler(this, this.Move);
		this._fStop = BindAsEventHandler(this, this.Stop);
		addEventHandler(this.hwnd, "mousedown", BindAsEventHandler(this, this.Start));
		addEventHandler(this.hwnd, "mousemove", BindAsEventHandler(this, this.Move));
	},
	
	Start : function(oEvent) {
		var pos = $GetAbsPosition(this.hwnd);
		
		if(this.hwnd.style.cursor) {
			this._isResizable = true;
			//__DEBUGER.print(pos);
			this._dx = pos.left + pos.width - oEvent.clientX - 2;
			// 显示和定位法线
			this.hwnd_moveline.style.display = '';
			this.hwnd_moveline.style.left = (oEvent.clientX) + 'px';
			this.hwnd_moveline.style.top = (pos.top + 1) + 'px';
			this.hwnd_moveline.style.height = 200 + 'px';
			//this.div_moveline.style.height = (this.hwnd.offsetHeight - 1 - this.hwnd_title.offsetHeight) + 'px';
		}
		
		//mousemove时移动 mouseup时停止
		addEventHandler(document, "mousemove", this._fMove);
		addEventHandler(document, "mouseup", this._fStop);
		if(document.all){
			//焦点丢失
			addEventHandler(this.hwnd, "losecapture", this._fStop);
			//设置鼠标捕获
			this.hwnd.setCapture();
		}else{
			//焦点丢失
			addEventHandler(window, "blur", this._fStop);
			//阻止默认动作
			oEvent.preventDefault();
		};

		// extend interface
		this.onStart(oEvent, this);
	},
	
	//拖动
	Move : function(oEvent) {
		//alert("mousemove")
		var scrollinfo = $GetScrollInfo();
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
			var pos = $GetAbsPosition(this.hwnd);
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
		//__DEBUGER.print("this._dx: " + this._dx);
		if(this._isResizable) {
			this._width = oEvent.clientX - this._left + this._dx
			this.hwnd.firstChild.style.width = (this._width) + 'px';
		}
		
		if(this._isDragable) {}
		
		// extend interface
		this.onStop(oEvent, this);
		
		// __DEBUGER.print("stop function _isResizable: "+this._isResizable);
		
		//移除事件
		removeEventHandler(document, "mousemove", this._fMove);
		removeEventHandler(document, "mouseup", this._fStop);
		if(document.all){
			removeEventHandler(this.hwnd, "losecapture", this._fStop);
			this.hwnd.releaseCapture();
		}else{
			removeEventHandler(window, "blur", this._fStop);
		}
		
		this._isResizable = false;
		this._isDragable  = false;
	}
}



// 0 是单选， 1 代表多选 2代表shift键按下时的多选
var SELECT_MODE_SINGLE	= 0;
var SELECT_MODE_CTRL	= 1;
var SELECT_MODE_SHIFT	= 2;

var WS_NONE				= 0x0000;	// 最简洁样式
var WS_CHECKBOX	 		= 0x0001;	// 多选样式
var WS_RADIO			= 0x0002;	// 单选样式
var WS_MULTISELECT		= 0x0004;	// 支持多选
var WS_PAGING			= 0x0008;	// 分页样式
var WS_FITWIDTH			= 0x0010;	// 自动填满宽度
var WS_AUTOHEIGHT		= 0x0020;	// 当主窗口的高度小于父窗口高度时，则父窗口自动高度，否则父窗口高度不变
var WS_100HEIGHT		= 0x0040;
var WS_100WIDTH			= 0x0080;
var WS_TITLE			= 0x0100;
var WS_STATUS			= 0x0200;
var WS_DEFAULT			= WS_NONE|WS_AUTOHEIGHT;	// 默认样式

var jtable = Q.KLASS();
jtable.prototype = {
	
	// dom对象
	hwnd 		: null,		// 主窗口
	parent 		: null,		// 父窗口
	hwnd_title  : null,     // 标题窗口
	hwnd_frame  : null, 	// 表格框架容器
	table_header_group: null, 	// 表头
	table_header: null, 	// 表头
	table_header_row:   null, // 表头行
	table_group : null, 	// 表格容器
	table		: null,		// 数据表格
	columns		: null,		// 列集合
	hwnd_toolbar: null,		// 工具栏
	hwnd_toolbar_container: null,		// 工具栏容器
	hmenu		: null,		// 菜单
	div_moveline: null, 	// 列变宽法线
	div_dashbox	: null,		// 拖动选框
	div_dragbox_top : null,		// 列变换法线
	div_dragbox_bottom : null,		// 列变换法线
	div_contextmenu : null,
	checkboxes  : null,
	checkbox_name : null,
	// data
	data_store	: null,		// 数据存储器
	pagesize	: 30,		// 每页显示记录数
	name 		: null,		// 数据表格名称
	width 		: 0,		// 表格控件宽度
	height 		: 0,		// 表格控件高度
	parent_height: 0,		// 父容器的初始高度
	parent_width : 0,		// 父容器的初始宽度
	row_height	: 22,		// 行高
	borderWidth : 2,		// 左右两边的边框宽度， w3标准，边框宽度是w3c
	borderHeight: 1,		// 上下两边的边框宽度
	rows_selected : null,	// 选中行的DOM元素
	scrollwidth : 21,
	bottomscroll_height : 0,
	plugins		: null,
	select_mode : SELECT_MODE_SINGLE,	
	isMultiSelect : false,	// 是否支持多选, 默认不支持
	isAutoHeight: false,	// 是否自适应高度
	isFitWidth  : false,	// 如果所有列宽度之和小于主窗口宽度则最后一列自动调整适应主窗口宽度
	wstyle		: WS_DEFAULT,

	_initialize : function(json) {
		var _this = this;

		_this.name = json.name;
		_this.columns = {};
		_this.checkboxes = new STRUCT_HASMAP;	// 存放checkbox的DOM句柄
		_this.rows_selected = new STRUCT_HASMAP;	// 存放选中行的DOM句柄
		_this.plugins = {};
		try
		{
			_this.data_store = eval(json.datastore);
		}
		catch (e)
		{
			alert('invalid data store: \n'+json.datastore);
			return;
		}
		
		if(typeof json.wstyle != 'undefined') {
			if(typeof json.wstyle == 'string') {
				try{
				_this.wstyle  = eval(json.wstyle);
				}catch(e) {}
			} else {
				_this.wstyle  = json.wstyle;
			}
		}
		
		// row height
		if(json.row_height) {
			_this.row_height = parseInt(json.row_height, 10) + (XHTML_MODE?0:4);
		} else {
			if(!XHTML_MODE) { _this.row_height = 26; }
		}
		
		// isFitWidth
		if(_this.isstyle(WS_FITWIDTH)) { _this.isFitWidth = true; }
		if(_this.isstyle(WS_AUTOHEIGHT)) { _this.isAutoHeight = true; }
		// pagesize setting
		var pagesize = parseInt(json.pagesize, 10);
		if(!isNaN(pagesize)) {
			if(pagesize > 0) { 
				_this.pagesize = pagesize; 
			}
		}
		
		// checkbox name
		if(typeof json.checkbox_name != 'undefined') {
			_this.checkbox_name = json.checkbox_name || "jtable_cbname";
		}
		
		if(typeof json.checkbox_fieldname != 'undefined') {
			_this.checkbox_fieldname = json.checkbox_fieldname || "jtable_fieldname";
		}
		
		// multiselect
		if(_this.isstyle(WS_MULTISELECT)) {	_this.isMultiSelect = true;	}
		
		// method overrides
		if(typeof json.row_onclick == 'function') {	_this.row_onclick = json.row_onclick; }
		if(typeof json.row_onclick == 'string') {
			try {
				_this.row_onclick = eval(json.row_onclick);
			} catch(e) {
				alert(e + '\n'+json.row_onclick);	
			}
		}
		
		if(typeof json.row_onmouseover == 'function') {	_this.row_onmouseover = json.row_onmouseover; }
		if(typeof json.row_onmouseover == 'string') {
			try {
				_this.row_onmouseover = eval(json.row_onmouseover);
			} catch(e) {
				alert(e + '\n'+json.row_onmouseover);	
			}
		}

		if(typeof json.row_onmouseout == 'function') {	_this.row_onmouseout = json.row_onmouseout; }
		if(typeof json.row_onmouseout == 'string') {
			try {
				_this.row_onmouseout = eval(json.row_onmouseout);
			} catch(e) {
				alert(e + '\n'+json.row_onmouseout);		
			}
		}
		
		if(typeof json.row_oninsert == 'function') {	_this.row_oninsert = json.row_oninsert; }
		if(typeof json.row_oninsert == 'string') {
			try {
				_this.row_oninsert = eval(json.row_oninsert);
			} catch(e) {
				alert(e + '\n'+json.row_oninsert);		
			}
		}
			
		// initialize view 
		_this.initview(json);
			
		_this.autosize();
		
		/*
		// init contextmenu
		_this.hmenu = new class_menu();
		var m1 = new class_menuitem({text: "升序", icon: "hmenu-asc.gif"});
		var m2 = new class_menuitem({text: "降序", icon: "hmenu-desc.gif"});
		
		_this.hmenu.addMenuItem(m1);
		_this.hmenu.addMenuItem(m2);
		*/
		// initialize columns' header
		_this.loadcolumns(json.columns);
		
		//_this.hmenu.hide();
		//alert("paging: "+json.wstyle+"  "+ _this.isstyle(WS_PAGING));
		if(_this.isstyle(WS_PAGING)) {
			_this.plugin_register(pages, true);
		//	_this.plugin_register(export2excel);
		} else {
			// alert(_this.data_store.records);
			_this.loaddata(_this.data_store.records);
		//	_this.plugin_register(export2excel, true);
		}
		
		// initialize resize event
		addEventHandler(window, 'resize', BindAsEventHandler(window, function() {	if(_this.parent.style.width.indexOf('%') != -1) { _this.autosize(); } }));
			
		addEventHandler(document, 'mousedown', BindAsEventHandler(document, function(evt) {
			//evt = evt || event;
			if(!_this.hmenu) return;
			if(_this.hmenu.hwnd.style.display == '') {
				_this.hmenu.hide();	
			}
		}));
		/**/
	},
	
	//  初始化表格控件视图
	initview : function(json) {
		var _this = this;
		_this.hwnd 			= document.createElement('DIV');
		_this.hwnd_title	= document.createElement('DIV');	
		_this.hwnd_frame	= document.createElement('DIV');
		_this.table_header_group = document.createElement('DIV');
		_this.table_group	= document.createElement('DIV');
		_this.hwnd_toolbar	= document.createElement('DIV');
		_this.hwnd_toolbar_container = document.createElement('UL');
		_this.div_moveline	= document.createElement('DIV');
		_this.div_dashbox	= document.createElement('DIV');
		_this.div_dragbox_top	 = document.createElement('DIV');
		_this.div_dragbox_bottom = document.createElement('DIV');
		_this.div_contextmenu = document.createElement('DIV');
		
		_this.table_header	= document.createElement('TABLE'); 
		_this.table			= document.createElement('TABLE');
		// do combine
		if((typeof json.container) == 'string') {
			_this.parent = document.getElementById(json.container);
		} else {
			alert(json.container)
			if(json.container.nodeType == 1) {
				_this.parent = json.container;
			} else {
				alert('初始化界面出错，'+json.container+'不存在'); return;
			}
		}
		
		
		_this.parent_height = _this.parent.offsetHeight;
		_this.parent_width = _this.parent.offsetWidth;
		_this.parent.appendChild(_this.hwnd);
		_this.hwnd.appendChild(_this.hwnd_title);
		_this.hwnd.appendChild(_this.hwnd_frame);
		_this.hwnd.appendChild(_this.hwnd_toolbar);
		_this.hwnd_toolbar.appendChild(_this.hwnd_toolbar_container);
		_this.hwnd_frame.appendChild(_this.table_header_group);
		_this.hwnd_frame.appendChild(_this.table_group);
		_this.table_header_group.appendChild(_this.table_header);
		_this.table_group.appendChild(_this.table);
		
		// fixed the onload event bug
		Q.Ready(function() {
			document.body.appendChild(_this.div_moveline);
			document.body.appendChild(_this.div_dashbox);
			document.body.appendChild(_this.div_dragbox_top);
			document.body.appendChild(_this.div_dragbox_bottom);
			document.body.appendChild(_this.div_contextmenu);
		
		});	
		
		/**/	
		_this.table_header_row = _this.table_header.insertRow(-1);
		// 复选框样式，默认设置多选模式
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.insertcolumn({name: 'check', 
				title: "<input type=\"checkbox\" style=\"border-width: 0px; background: none;\">", 
				renderer : function(record) { return "<input type=\"checkbox\" style=\"border-width: 0px; background: none;\" onclick=\"this.checked=!this.checked;\" name=\""+_this.checkbox_name+"\" value=\""+record[_this.checkbox_fieldname]+"\">"; }, 
				align: 'center',
				issortable : false,
				isnotmovable : true,
				width: 40,
				isHTML: true
				}, 0);
			_this.table_header_row.cells[0].childNodes[0].childNodes[0].onclick = function() {
				if(this.checked) {
					_this.rows_selected_all();	
				} else {
					_this.rows_selected_none();	
				}
			};
			_this.isMultiSelect = true;
		}

		// table header settings
		_this.table_header.cellPadding	= 0;
		_this.table_header.cellSpacing	= 0;
		_this.table_header.border		= 0;
		_this.table_header.onselectstart = function(evt) {return false;}; // 禁止选择


		// table settings
		_this.table.cellPadding	= 0;
		_this.table.cellSpacing	= 0;
		_this.table.border		= 0;
		
		// init event;
		_this.table_group.onscroll = function() {_this._core_sync_scroll();}
		_this.table_group.onselectstart = function() { return false; }

		// initial css style
		_this.hwnd_title.className = 'jtable_titlebar';
		var titleContent = document.createElement('DIV');
		_this.hwnd_title.appendChild(titleContent);
		titleContent.innerText = json.title || '标题未命名';
		titleContent.style.cssText = 'float: left; border: 0px solid red;';

		_this.hwnd.className = 'jtable_hwnd';
		_this.hwnd_frame.className = 'jtable_frame';
		_this.hwnd_toolbar.className = 'jtable_toolbar';		
		//_this.table_header_group.className = 'jtable_table_header_group';
		_this.table_group.className = 'jtable_table_group';
		//_this.div_moveline.className = 'jtable_div_moveline';
		_this.div_dashbox.className  = 'jtable_div_dashbox';
		_this.div_dragbox_top.className  = 'jtable_div_dragbox_top';
		_this.div_dragbox_bottom.className = 'jtable_div_dragbox_bottom';
		_this.div_contextmenu.className = 'jtable_div_contextmenu';
		
		_this.table_header_group.style.cssText = 'position:relative; overflow: hidden; border: 0px solid #FF9900;';
		_this.div_moveline.style.cssText ='width:1px;background:red;display:none;position:absolute;';
		
		addEventHandler(_this.div_contextmenu, 'mouseup', BindAsEventHandler(_this.div_contextmenu, function(evt) {
			evt = evt || event;
			//_this.hmenu.showElement(this);	
		}));
		
	},
	
	// 更新控件视图: 重新设置非锁定数据区的宽度和高度
	updateview : function() {
		var _this = this;
		try {	
		// width
		_this.hwnd.style.width = (_this.width - (XHTML_MODE?2:1) * _this.borderWidth) + 'px';
		var tableGroupWidth = _this.hwnd.offsetWidth - _this.borderWidth;
		_this.hwnd_frame.style.width = tableGroupWidth + 'px';
		_this.table_group.style.width = tableGroupWidth + 'px';
		
		//alert(_this.table_group.scrollWidth + '==' + _this.table_group.offsetWidth );
		
		// height
		var actualheight = (_this.row_height * _this.table.rows.length) + _this.table_header_group.offsetHeight + _this.borderHeight + _this.hwnd_title.offsetHeight + _this.hwnd_toolbar.offsetHeight + _this.bottomscroll_height;
		//alert('actualheight: ' + actualheight );
		
		var height = _this.height - _this.borderHeight;
		if(actualheight < _this.height ) { height = actualheight; }

		// 表格框架的高度
		var frame_height = height - _this.hwnd_title.offsetHeight - _this.borderHeight - _this.hwnd_toolbar.offsetHeight;
		var group_height = frame_height - _this.table_header_group.offsetHeight;
		
		_this.hwnd.style.height = height + 'px';		// 主窗口高度
		_this.hwnd_frame.style.height  = (Math.max(0, frame_height)) + 'px';
		_this.table_group.style.height = (Math.max(0, group_height)) + 'px';
		_this.table.style.display = 'none';
		_this.table.style.display = '';
		
		if(_this.isAutoHeight) {
			_this.parent.style.height = height+_this.borderHeight + 'px';
		}
		} catch(e){ /*alert(e.description);*/ }
		
		_this._core_sync_scroll();
	},
	
	isstyle : function(ws) {
		var _this = this;
		//return 	((_this.wstyle & ws) == ws) || (_this.wstyle & WS_DEFAULT == WS_DEFAULT );
		return ((_this.wstyle & ws) == ws);
	},
	
	// 自适应父容器大小
	autosize : function() {
		//alert('autosize')
		var _this = this;
		_this.hwnd.style.display = 'none';	// 隐藏主窗口，使得父窗口不会被溢出
		//alert('before');
		_this.resize(parseInt(_this.parent.offsetWidth, 10), parseInt(_this.parent.offsetHeight, 10));
		//alert('after');
		_this.hwnd.style.display = '';	// 重置后显示控件窗口
		_this.updateview();
	},
	
	// 设置控件的宽度和高度
	resize : function(width, height) {
		var _this		= this;
		
		try {
		if(width <= 0) {
			width = _this.parent_width;
		}
		if(height <= 0) { 
			height = _this.parent_height;
		}
		
		_this.width		= width;
		_this.height	= height;
		}catch(e) {alert(e.description);}
	},

	insertcolumn : function(json, index) {
		var _this = this;
		if(isNaN(index)) { index = -1; }
		if(index < 0) {	index = -1;	}
		var TD = _this.table_header_row.insertCell(index);
		var DIV = document.createElement('DIV');
		TD.appendChild(DIV);
		TD.style.display = json.isHidden ? 'none' : '';
		if(json.isHidden) {
			json.isHidden = true;	
		} else {
			json.isHidden = false;	
		}
		TD.setAttribute('name', json.name);
		json.hwnd = TD;
		DIV.innerHTML = json.title;
		DIV.style.cssText = 'width:' + json.width +'px; height: 19px;';
		DIV.align =json.align;
		DIV.className = 'jtable_title';
		DIV.onclick = function() { _this._core_column_click(this.parentNode.cellIndex); };
		DIV.ondblclick = function() { _this._core_column_dblclick(this.parentNode.cellIndex);};
		DIV.onmouseover = function() {this.className = 'jtable_title_over'; }
		DIV.onmouseout =  function() {this.className = 'jtable_title'; }

		// save header column setting data
		if(typeof _this.columns[json.name] == 'undefined') {
			_this.columns[json.name] = json;
		}

		//_this.make_resizeable(TD);
		new __TH(TD, {moveline: _this.div_moveline, onStart: function(evt, handler) { _this.column_MouseDown(evt, handler); }, onStop: function(evt, handler) { _this.column_MouseUp(evt, handler); }});
		return TD;
	},
	
	column_MouseDown : function(evt, handler) {
		//alert('mousedown');
		var _this = this;
		if(handler._isResizable) {
			_this.div_moveline.style.height = (_this.hwnd.offsetHeight - 1 - _this.hwnd_title.offsetHeight) + 'px';
		}
	},
	
	column_MouseUp : function(evt, handler) {
		// alert('mouseup');
		var _this = this;
		var TD = handler.hwnd;
		if(handler._isResizable) {
			var nCol = TD.cellIndex;
			_this.rows_each( function(row) { row.cells[nCol].childNodes[0].style.width = handler._width+'px'; });
			_this._core_sync_scroll();
		}
	},
	
	insertrow : function(nIndex, record) {
		var _this = this;
		
		var ROW = _this.table.insertRow(-1);
		ROW.onmouseover = function() { return _this._core_rows_onmouseover(this); }
		ROW.onmouseout  = function() { return _this._core_rows_onmouseout(this);  }
		ROW.onclick     = function() { return _this._core_rows_onclick(this);  }
		//ROW.onmousedown = function() { if(!_this.rows_onmousedown(this)) {event.returnValue = false; return false}; }
		ROW.setAttribute('dataIndex', record['dataIndex']);	// 设置数据索引
		var len = _this.table_header_row.cells.length;
		
		for(var j = 0; j < len; j++) {
			var TD = ROW.insertCell(-1);
			var theader = _this.table_header_row.cells[j];
			var name = theader.getAttribute('name');
			var config = _this.columns[name];
			var content = record[config.name];
			if(typeof config.renderer == 'function') {
				content = config.renderer(record);
			}
			TD.style.display = theader.style.display;
			var width = theader.childNodes[0].offsetWidth - (XHTML_MODE ? _this.borderWidth : 0);
			_this._core_init_cell(TD, ROW.rowIndex, j, { content : content,
				align : theader.childNodes[0].align,
				width : width,
				height : _this.row_height ,
				isHTML : config.isHTML
			});
			
		}
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.checkboxes.add(record['dataIndex'], ROW.cells[0].childNodes[0].childNodes[0]);
		}
		_this.row_oninsert(ROW, record);
	},
	
	loadcolumns : function(arr_columns) {
		var _this = this;
		//var m3 = new class_menuitem({type: MENU_SEPERATOR, text: "menuitem 3"});
		//var m4 = new class_menuitem({text: "列视图", icon: 'columns.gif'});
		//_this.hmenu.addMenuItem(m3);
		//_this.hmenu.addMenuItem(m4);
		var widths = 0;
		while(arr_columns.length) {
			var column = arr_columns.shift();
			//if(!column.name) { alert('列字段名不能为空'); return; }
			if(arr_columns.length == 0 && _this.isFitWidth) {
				var width = _this.width - widths - 4 * _this.scrollwidth
				column.width = 	(width > 0)?width:column.width;
			} else {
				if(column.width) {
					// 减去边框宽度 2，根据样式表的border定义	
					column.width = parseInt(column.width, 10) - _this.borderWidth;
				}
				widths += parseInt(column.width, 10);
			}
			try {
				if(typeof column.renderer == 'string') {
					column.renderer = eval(column.renderer);
				}
			}catch(e) {alert(e.description)}
			var td = _this.insertcolumn(column);
			
			/*
			// 载入列项到列视图菜单像中
			var isChecked = !column.isHidden;
			var m = new class_menuitem({type: MENU_ITEM_CHECKBOX, text: column.title, checked: isChecked, clickHidden: false, data: td.cellIndex, callback : function(menuitem){
				if(menuitem.type == MENU_ITEM_CHECKBOX) {
					if(menuitem.isChecked) {
						var len = _this.table_header_row.cells.length;
						var count = len - (_this.isstyle(WS_CHECKBOX)?1:0);
						for(var i=_this.isstyle(WS_CHECKBOX)?1:0; i < len; i++) {
							var c = _this.table_header_row.cells[i];
							if(c.style.display == 'none') {
								count = count - 1;
							}
						}
						if(count == 1) { return 0; }
					}
					var isDisplay = (!menuitem.isChecked) ? '' : 'none';
					var cellIndex = menuitem.data();
					_this.table_header_row.cells[cellIndex].style.display = isDisplay;
					for(var l=0; l < _this.table.rows.length; l++) {
						_this.table.rows[l].cells[cellIndex].style.display = isDisplay;
					}
					_this.updateview();
				}
			}});
			m4.addSubMenuItem(m);
			*/
		}
	},
	
	loaddata : function(data) {
		var _this = this;
		if(_this.table.tBodies.length > 0) {
			_this.table.removeChild(_this.table.tBodies[0]);	// 删除所有数据
		}
		// 清楚选中数据
		_this.rows_selected.clear();
					
		// 解决显示一条记录时，由于滚动条占据高度，使得显示部分区域过小，影响数据查看
		if(data.length == 1) {
			_this.table_group.style.overflowX = 'scroll';
			_this.bottomscroll_height = 16;
		} else {
			_this.table_group.style.overflowX = 'auto';
			_this.bottomscroll_height = 0;
		}
		data.each(function(record, index){ _this.insertrow(-1, record); });// 追加的模式插入行
		if(_this.table.rows.length > 0) {
			_this.row_height = _this.table.rows[0].offsetHeight;
		}
		_this.updateview();
		
	},
	
	loadpagedata : function(data) {
		var _this = this;
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.table_header_row.cells[0].childNodes[0].childNodes[0].checked = false;
		}
		_this.rows_selected.each(function(n, key){ _this.row_set_unselected(_this.rows_selected.item(key)); });
		// 清楚选中数据
		_this.rows_selected.clear();
		_this.checkboxes.clear();
		var dsize = data.length;
		var tsize =_this.table.rows.length;
		var minsize = Math.min(dsize, tsize);
		var csize = _this.table_header_row.cells.length;
		for(var i=0; i < minsize; i++) {
			var ROW	= _this.table.rows[i];
			var record = data.item(i);
			ROW.setAttribute('dataIndex', parseInt(record['dataIndex'], 10));
			
			for(var j=0; j<csize; j++) {
				var theader = _this.table_header_row.cells[j];
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
		}
		if(data.length == 1) {
			_this.table_group.style.overflowX = 'scroll';
			_this.bottomscroll_height = 16;
		} else {
			_this.table_group.style.overflowX = 'auto';
			_this.bottomscroll_height = 0;
		}
		
		if(dsize > tsize ) {	// 数据多余表格函数，插入行
			while(dsize != _this.table.rows.length) {
				_this.insertrow(-1, data.item(_this.table.rows.length));
			}	
		} else {
			while(dsize != _this.table.rows.length) {
				_this.table.deleteRow(dsize);
			}
		}
		if(_this.table.rows.length > 0) {
			_this.row_height = _this.table.rows[0].offsetHeight;
		}
		
	},
	
	rows_each : function(callback) {
		var _this = this;
		var rowsnum = _this.table.rows.length;
		if(typeof callback != 'function') { alert('rows_each callback was not a function'); return; }
		for(var i=0; i < rowsnum; i++) {
			callback(_this.table.rows[i]);
		}
	},
	
	row_is_selected : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		return _this.rows_selected.has(dataIndex);
	},
	
	row_is_checked : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		if(_this.isstyle(WS_CHECKBOX)) {
			return _this.checkboxes.item(dataIndex).checked;
		}
		return false;
	},
	
	rows_selected_all : function() {
		var _this = this;
		_this.rows_each(function(row) {
			_this.row_set_selected(row);
		});
	},
	
	rows_selected_none : function() {
		var _this = this;
		_this.rows_each(function(row) {
			_this.row_set_unselected(row);
		});
		//_this.rows_selected.clear();
	},	
	
	row_set_color : function(row, bgColor) {
		row.style.background = bgColor;
	},
	
	row_set_selected : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		// 设置选中颜色
		
		if(_this.isstyle(WS_CHECKBOX)) {
			if(_this.checkboxes.item(dataIndex).disabled) {
				return false;
			}
			_this.checkboxes.item(dataIndex).checked = true;
		}
		_this.row_set_color(row, '#DFE8F6'); //'#A2CAEA'
		_this.rows_selected.add(dataIndex, row);
	},
	
	row_set_unselected : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);

		if(_this.isstyle(WS_CHECKBOX)) {
			if(_this.checkboxes.item(dataIndex).disabled) {
				return false;
			}
			
			_this.checkboxes.item(dataIndex).checked = false;
		}
		_this.row_set_color(row, 'none');
		_this.rows_selected.remove(dataIndex);
	},
	
	_core_rows_onclick : function(row) {
		var _this = this;
		
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		if(_this.isstyle(WS_CHECKBOX)) {
			if(_this.checkboxes.item(dataIndex).disabled) {
				return false;
			}
		}
		// 不支持多选
		if(!_this.isMultiSelect) {
			if(!_this.rows_selected.has(dataIndex)) {
				_this.rows_selected.each(function(node, key) {
					var row = _this.rows_selected.item(key);
					_this.row_set_unselected(row);
				});
				_this.row_set_selected(row);
			} else {
				_this.row_set_unselected(row);	
			}
		} else {
			if(_this.isstyle(WS_CHECKBOX)) {
				if(!_this.row_is_checked(row)) {
					_this.row_set_selected(row);	
				} else {
					_this.row_set_unselected(row);
				}
			} else {
				if(_this.select_mode == SELECT_MODE_CTRL) { // CTRL键按下时
					if(_this.row_is_selected(row)) {
						// set unselected
						_this.row_set_unselected(row);
					} else {
						_this.row_set_selected(row);
					}
					
				} else if(_this.select_mode == SELECT_MODE_SHIFT) { // SHIFT键按下时
				} else {
					_this.rows_selected.each( function(node, key) { 
							_this.row_set_unselected(_this.rows_selected.item(key));
						});
					_this.row_set_selected(row);
				}
			}
		}
		//alert(_this.rows_selected.length)
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.table_header_row.cells[0].childNodes[0].childNodes[0].checked = (_this.rows_selected.length == _this.table.rows.length);	
		}
		_this.row_onclick(row);
	},
	
	_core_rows_onmouseover : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		if(_this.isstyle(WS_CHECKBOX)) {
			if(_this.checkboxes.item(dataIndex).disabled) {
				return false;
			}
		}
		if(!_this.row_is_selected(row)) {
			_this.row_onmouseover(row);
		}
		//row.style.background = 'none';
	},
	
	_core_rows_onmouseout : function(row) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		if(_this.isstyle(WS_CHECKBOX)) {
			if(_this.checkboxes.item(dataIndex).disabled) {
				return false;
			}
		}
		if(!_this.row_is_selected(row)) {
			_this.row_onmouseout(row);
		}
	},
	
	// 滚动条同步
	_core_sync_scroll : function() {
		var _this = this;
		//_this.data_group_lock.style.top = (-_this.data_frame_unlock.scrollTop) + 'px';
		_this.table_header_group.style.left = (-_this.table_group.scrollLeft) + 'px';
		_this.sync_scroll();
	},
	
	// jtable 核心消息
	_core_column_click : function(nCol) {
		var _this = this;
		var config = _this.get_header_config(nCol);
		if(config.issortable) {
			sortTable(_this.table.tBodies[0], nCol, true);
		}
		_this.onClickColumn(nCol);
	},
	
	_core_column_dblclick : function(nCol) {
		this.cols_selected = nCol;
		this.onDblClickColumn(nCol);
	},
	
	_core_init_cell : function(TD, nItem, nCol, json) {
		// 根据json对象创建多样化的TD单元格
		
		var _this = this;
		var DIV = document.createElement('DIV');
		TD.appendChild(DIV);
		DIV.className = 'jtable_cdata';
		try {
			DIV.align = json.align;
			DIV.style.width = json.width + 'px';
			DIV.style.height = json.height + 'px';
			DIV.innerHTML = json.content;
			//if(json.isHTML)	DIV.innerHTML = json.content;
			//else DIV.innerText = json.content;
		} catch(e) {
			if(_DEBUG_MODE) {
				alert('创建单元格失败!['+e.description+']');
				return null;
			}
		}
		
		_this.onInitCell(TD, nItem, nCol, json);
		return TD;	
	},
		
	// 工具栏插件注册
	plugin_register : function(plugin, isNotSplit) {
		var _this = this;
		
		var pln = new plugin(_this);
		if((!pln.hwnd) || (!pln.name)) {
			alert("插件没有指定hwnd主窗口或者没有指定插件名称，创建失败!");
			delete pln;
			return;
		}
		var pluginItem = document.createElement("LI");
		_this.hwnd_toolbar_container.appendChild(pluginItem);
		_this.plugins[pln.name] = pln;
		pluginItem.appendChild(pln.hwnd);
		
		//pln.hwnd.style.styleFloat = 'left';
		//pln.hwnd.style.width = '30px';
		//pln.hwnd.style.display = 'inline';
		if( !isNotSplit )
			pln.hwnd.style.background = '';
		//pln.hwnd.style.padding = '3px 8px 0px 2px';
		pln.hwnd.style.cursor = 'pointer';
		//pln.hwnd.style.border = '1px solid red';
		addEventHandler(pluginItem, 'mouseover', function() {
			pluginItem.style.backgroundColor = '#FFF';
			//pln.hwnd.style.border = '1px solid blue';	
		});
		
		addEventHandler(pluginItem, 'mouseout', function() {
			pluginItem.style.backgroundColor = '';
			//pln.hwnd.style.border = '0px solid red';	
		});
	},

	// 用户接口
	// events
	row_onclick : function(row) {},
	row_onmouseover : function(row) {},
	row_onmouseout : function(row){},
	row_oninsert : function(row, record) {},
	onClickColumn : function(nCol) {},
	onDblClickColumn : function(nCol) {},
	onInitCell : function(TD, nItem, nCol, json) {},
	
	// methods
	/*------------------------------------------------------------------------------------
	 $ method: get_records
	 $ function: get the recordset by dataIndex which be specified.
	 $ input: 
	 		dataIndex -> -1 is get all of the recordset else get specified dataIndex of recordset
	 $ output: a array which store the record or records
	 $ date: 2009-5-20 16:31
	 $ author: LovelyLife http://onlyaa.com
	---------------------------------------------------------------------------------------*/
	get_records : function(row) {
		var _this = this;
		var dataIndex = parseInt(_this.get_row_dataIndex(row), 10);
		var store = _this.data_store;
		var arr = [];
		if(-1 == dataIndex) {	
			_this.data_store.records.each(function(node, i) { arr.push(node); });
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
	
	get_data_store : function() {
		return this.data_store;	
	},
	
	get_rows_selected : function() {
		var _this = this;
		var arr = [];
		_this.rows_selected.each(function(node, key){
			arr.push(_this.rows_selected.item(key));
		});
		return arr;
	},
	
	get_row_dataIndex : function(row) {
		if(row.nodeType == 1) {
			return row.getAttribute('dataIndex');	
		} else {
			return -1;
		}
	},
	
	get_header_config : function(cellIndex) {
		var _this = this;
		var h = _this.table_header_row.cells[cellIndex];
		return _this.columns[h.getAttribute('name')];
	},
	
	get_header_config_byname : function(fieldname) {
		return this.columns[fieldname];	
	},

	get_width : function() {
		return this.width;
	},
	
	get_height : function() {
		return this.height;	
	},
	
	get_text : function(row, fieldName) {
		var _this = this;
		//alert(_this.get_records(row).length);
		// alert("test: " + _this.get_records(row)[0]["dataIndex"]);
		var record = _this.get_records(row)[0];
		
		return record[fieldName];
	},
	
	set_text_index : function(row, cellIndex, szText, isHTML) {
		var _this = this;
		var celldiv = row.cells[cellIndex].childNodes[0];
		if(isHTML) {
			celldiv.innerHTML = szText;
		} else {
			celldiv.innerText = szText;
		}
		
		// 同步数据到内存当中
		var dataIndex = _this.get_row_dataIndex(row);
		var config = _this.get_header_config(cellIndex);
		_this.data_store.records.item(dataIndex)[config.name] = szText;
	},
	
	set_text : function(row, fieldName, szText, isHTML) {
		var _this = this;
		var config = _this.columns[fieldName];
		var cellIndex = config.hwnd.cellIndex;
		_this.set_text_index(row, cellIndex, szText, isHTML);
	},
	
	row_disabled : function(row, isDisabled) {
		var _this = this;
		var dataIndex = parseInt(row.getAttribute('dataIndex'), 10);
		// 设置选中颜色
		// _this.row_set_color(row, '#DFE8F6'); //'#A2CAEA'
		//row.disabled = isDisabled;
		if(_this.isstyle(WS_CHECKBOX)) {
			_this.checkboxes.item(dataIndex).disabled = isDisabled;
		}
	},
	
	row_remove : function(row) {
		var _this = this;
		try {
		var record = _this.data_store.records[_this.get_row_dataIndex(row)];
		_this.table.deleteRow(row.rowIndex);
		_this.data_store.remove(record);
		_this.updateview();
		} catch(e) {
			alert(e.description);
		}
	},
	
	row_insert : function(index, record) {
		var _this = this;
		_this.data_store.push(record);
		_this.insertrow(index, record);
		_this.autosize();
	},
	
	sync_scroll : function() {}
}; 

var export2excel = Q.KLASS();
export2excel.prototype = {
	hwnd : null,
	name : "excel",
	_initialize : function(tbl) {
		var _this = this;
		_this.hwnd = document.createElement('DIV');
		_this.hwnd.innerHTML = " <img src=\""+ IMAGES_PATH + "/xls.gif\" border=\"0\" style=\"margin-left: 9px;\">";
		_this.hwnd.onclick = function() { _this.export2excel(tbl); }
	},
	
	export2excel : function(tbl) {
		var _this = tbl;
		var oExcelInstance = null;
		try {	
			// create Excel Inistance
			oExcelInstance = new ActiveXObject("Excel.Application"); 
			// Get a new workbook.
			var oWorkbooks = oExcelInstance.Workbooks.Add();
			var oSheet = oWorkbooks.ActiveSheet;
			// initialize excel data
			var len = _this.table_header_row.cells.length;
			for(var i=0; i < len; i++) {
				// initialize data header;
				var row = 1;
				oSheet.Columns(i+1).ColumnWidth = parseInt(_this.table_header_row.cells[i].offsetWidth) / 8;
				oSheet.Cells(1, i+1).Value = _this.table_header_row.cells[i].innerText;
				// set data
				var datalen = _this.table.rows.length;
				for(var j = 0; j < datalen; j++) {
					
					oSheet.Cells(++row, i+1).Value = _this.table.rows[j].cells[i].innerText;
				}
				
			}
			// oSheet.Range("B3").NumberFormat = "$#,##0.00";
			oExcelInstance.UserControl = true;
			oExcelInstance.DisplayAlerts = true;
			//oExcelInstance.Caption = "数据导出完毕！！";
			oExcelInstance.Visible = true;
			//oExcelInstance.Save();
			oExcelInstance.Quit();
			oExcelInstance = null;
			CollectGarbage();
		} catch(e) {
			alert(e.description);
			if(oExcelInstance) {
				oExcelInstance.Quit();
				oExcelInstance = null;
			}
		}
	}
}

/*------------------------------------------------------------------------------------
 $ plugin name pages
 $ date: 2009-5-11 16:31
 $ author: LovelyLife http://onlyaa.com
 $ description: implement the paging of the jtable component
---------------------------------------------------------------------------------------*/
var pages = Q.KLASS();
pages.prototype = {
	name : 'fy',
	hwnd : null,
	ctrlHandler : null,
	pagesize : 50,
	rowcount : 0,
	pagecount : 0,
	currentpage : 0,
	
	// dom elements
	wstable  : null,
	btnFirst : null,	// 首页
	btnPrev  : null,	// 前页
	btnNext	 : null,	// 下页
	btnLast  : null,	// 末页
	inputPage: null,	// 定位页输入框
	inputPageSize : null,	// 每页显示记录数输入框
	labelPageCount : null,	// 显示所有页数
	labelRowCount : null,	// 显示所有记录数
	
	_initialize : function(tbl) {
		var _this = this;
		_this.ctrlHandler = tbl;
		_this.hwnd = document.createElement('DIV');
		_this.rowcount  = _this.ctrlHandler.data_store.records.length;
		if(!isNaN(tbl.pagesize)) { _this.pagesize = tbl.pagesize; }
		_this.pagecount = Math.ceil(_this.rowcount / _this.pagesize);
		_this.initview();
		_this.update_table_rows();
	},
	
	
	initview : function() {
		var _this = this;
		//页脚显示分页
		_this.hwnd.innerHTML="";
		_this.hwnd.style.width = '400px';
		//rightBar.innerHTML="每页"+this.pagesize+"条/共"+this.rowcount+"条"+" 第"+(this.pageIndex+1)+"页/共"+this.pagecount+"页";
		
		_this.wstable = document.document.createElement("table");
		_this.wstable.border = 0;
		_this.wstable.cellSpacing = 1;
		_this.wstable.cellPadding = 0;
		_this.wstable.style.cssText = 'height: 16px; border:0px solid red;';
		_this.hwnd.appendChild(_this.wstable);
		var _trow = _this.wstable.insertRow(-1);
		_this.btnFirst	= _trow.insertCell(-1);
		_this.btnPrev	= _trow.insertCell(-1);
		var divPage     = _trow.insertCell(-1);
		_this.btnNext	= _trow.insertCell(-1);
		_this.btnLast	= _trow.insertCell(-1);
		
		_trow.vAlign = 'top';
		_trow.align = 'center';
		_this.inputPage	= document.document.createElement("input");
		_this.labelPageCount  = document.document.createElement("font");
		divPage.appendChild(_this.inputPage);
		divPage.appendChild(_this.labelPageCount);
		_this.inputPage.type = 'text';
		//divPage.style.cssText = "position: relative; top: -3px; margin: 0px 3px 0px 3px; font-weight: normal;";
		 
		_this.labelPageCount.style.cssText = "font-size: 13px;";
		_this.labelPageCount.innerHTML = " / "+_this.pagecount+"页";
		

		_this.inputPage.style.cssText = "height:18px;padding:0px;text-align:center;width:40px;";
		_this.inputPage.onkeydown = function(evt) {
			evt = evt || event;
			var keyCode = evt.keyCode||evt.which;
			if(keyCode == 13) {
				if(!/^\d+$/i.test(this.value + '')) {
					if(window.event) { event.returnValue = false; }
					return false;
				} else {
					var page = parseInt(this.value, 10)-1;
					_this.goPage(page);
				}
			}
		}
		
		_this.btnFirst.onclick = function() { _this.firstPage(); }
		_this.btnPrev.onclick  = function() { _this.prevPage(); }
		_this.btnNext.onclick  = function() { _this.nextPage(); }
		_this.btnLast.onclick  = function() { _this.lastPage(); }

		var divPageRight = _trow.insertCell(-1);
		divPageRight.className = 'jtable_plugin_hwnd_split';
		//divPageRight.style.width = '300px';
		
		//_this.hwnd.appendChild(divPageRight);
		//divPageRight.style.cssText = "position: relative; top: -3px; margin: 0px 3px 0px 3px; font-weight: normal;";
		var textNode3  = document.createTextNode("每页显示 ");
		_this.inputPageSize = document.document.createElement("input");
		divPageRight.appendChild(textNode3);
		divPageRight.appendChild(_this.inputPageSize);
		_this.inputPageSize.value = _this.pagesize;
		_this.inputPageSize.onkeydown = function(evt) {
			evt = evt || event;
			var keyCode = evt.keyCode||evt.which;
			if(keyCode == 13) {
				if(!/^\d+$/i.test(this.value + '')) {
					if(window.event) { event.returnValue = false; }
					return false;
				} else {
					var pagesize = parseInt(this.value, 10);
					if(!isNaN(pagesize)) {
						if(pagesize > 0) {
							_this.pagesize = _this.ctrlHandler.pagesize = pagesize;
							_this.pagecount = Math.ceil(_this.rowcount / _this.pagesize);
							_this.currentpage = 0;
							_this.update_table_rows();
						}
					}
				}
			}
		}
				
		_this.inputPageSize.style.cssText = "height: 16px;padding: 0px; font-size: 11px; text-align: center; width: 40px;";
		var textNode4 = document.createTextNode(" 条 共有 ");
		divPageRight.appendChild(textNode4);
		_this.labelRowCount = document.document.createElement('font');
		divPageRight.appendChild(_this.labelRowCount);
		_this.labelRowCount.style.cssText = 'color: red; font-weight: bold; font-size: 13px;'
		_this.labelRowCount.innerText = _this.rowcount;
		var textNode5 = document.createTextNode(' 条记录');
		divPageRight.appendChild(textNode5);
	},
	
	updateview : function() {
		var _this = this;
		_this.inputPage.value = _this.currentpage + 1;
		
		// 更新按钮图片状态
		/*
		if(_this.currentpage==0) {
			_this.
		    _this.btnPrev.src  = IMAGES_PATH + "/pages/page-prev-disabled.gif";
		    _this.btnFirst.src = IMAGES_PATH + "/pages/page-first-disabled.gif";
		} else {
			_this.btnPrev.src  = IMAGES_PATH + "/pages/page-prev.gif";
		    _this.btnFirst.src = IMAGES_PATH + "/pages/page-first.gif";
		}
		
		if( _this.pagecount-1 == _this.currentpage) {
			_this.btnNext.src  = IMAGES_PATH + "/pages/page-next-disabled.gif";
		    _this.btnLast.src  = IMAGES_PATH + "/pages/page-last-disabled.gif";
		} else {
			_this.btnNext.src  = IMAGES_PATH + "/pages/page-next.gif";
		    _this.btnLast.src  = IMAGES_PATH + "/pages/page-last.gif";
		}
		*/
		
		if(_this.currentpage==0) {
		    _this.btnPrev.className  = 'jtable_plugin_page_prev_disabled';
		    _this.btnFirst.className = 'jtable_plugin_page_first_disabled';
		} else {
			_this.btnPrev.className  = 'jtable_plugin_page_prev';
		    _this.btnFirst.className = 'jtable_plugin_page_first';
		}
		
		if( _this.pagecount-1 == _this.currentpage) {
			_this.btnNext.className  = 'jtable_plugin_page_next_disabled';
		    _this.btnLast.className  = 'jtable_plugin_page_last_disabled';
		} else {
			_this.btnNext.className  = 'jtable_plugin_page_next';
		    _this.btnLast.className  = 'jtable_plugin_page_last';
		}
		
		_this.labelPageCount.innerText = " / "+_this.pagecount+"页";
		_this.labelRowCount.innerText  = _this.rowcount;
	},
	
	update_table_rows : function() {
		var _this = this;
		
		var iCurrentrowcount = _this.pagesize * _this.currentpage;
		var iMoreRow = _this.pagesize+iCurrentrowcount > _this.rowcount ? _this.pagesize+iCurrentrowcount - _this.rowcount : 0;
		_this.ctrlHandler.data_store.load_page(_this.currentpage+1, _this.pagesize, function(arr) {
			_this.ctrlHandler.loadpagedata(arr);
			_this.rowcount = _this.ctrlHandler.data_store.length;
			//alert('tag::'+_this.rowcount);
			_this.pagecount = Math.ceil(_this.rowcount / _this.pagesize);
			
			_this.updateview();
			_this.ctrlHandler.updateview();	
		});
	},
	
	/* 下一页 */
	nextPage : function() {
		if(this.currentpage + 1 < this.pagecount) {
			this.currentpage += 1;
			this.update_table_rows();
		}
	},
	/* 上一页 */
	prevPage : function() {
		if(this.currentpage >= 1) {
			this.currentpage -= 1;
			this.update_table_rows();
		}
	},
	/* 首页 */
	firstPage : function() {
		if(this.currentpage != 0) {
			this.currentpage = 0;
			this.update_table_rows();
		}
	},
	/* 尾页 */
	lastPage : function() {
		if(this.currentpage+1 != this.pagecount) {
			this.currentpage = this.pagecount - 1;
			this.update_table_rows();
		}
	},
	/* 页定位方法 */
	goPage : function(iPageIndex) {
		if(iPageIndex > this.pagecount-1) {
			this.currentpage = this.pagecount - 1;
		} else if(this.currentpage < 0) {
			this.currentpage = 0;
		} else {
			this.currentpage = iPageIndex;
		}
		this.update_table_rows();
	}
}

//-----------------------------------------------------------------------------
// sortTable(id, col, rev)
//
//  id  - ID of the TABLE, TBODY, THEAD or TFOOT element to be sorted.
//  col - Index of the column to sort, 0 = first column, 1 = second column,
//        etc.
//  rev - If true, the column is sorted in reverse (descending) order
//        initially.
//
// Note: the team name column (index 1) is used as a secondary sort column and
// always sorted in ascending order.
//-----------------------------------------------------------------------------
function sortTable(id, col, rev) {
	// Get the table or table section to sort.
	var tblEl = (typeof id == "string") ? document.getElementById(id) : id;
	// The first time this function is called for a given table, set up an
	// array of reverse sort flags.
	if (tblEl.reverseSort == null) {
		tblEl.reverseSort = new Array();
		// Also, assume the team name column is initially sorted.
		tblEl.lastColumn = 1;
	}
	// If this column has not been sorted before, set the initial sort direction.
	if (tblEl.reverseSort[col] == null)
	tblEl.reverseSort[col] = rev;
	// If this column was the last one sorted, reverse its sort direction.
	if (col == tblEl.lastColumn)
	tblEl.reverseSort[col] = !tblEl.reverseSort[col];
	// Remember this column as the last one sorted.
	tblEl.lastColumn = col;
	// Set the table display style to "none" - necessary for Netscape 6
	// browsers.
	var oldDsply = tblEl.style.display;
	tblEl.style.display = "none";
	// Sort the rows based on the content of the specified column using a
	// selection sort.
	var tmpEl;
	var i, j;
	var minVal, minIdx;
	var testVal;
	var cmp;
	
	for (i = 0; i < tblEl.rows.length - 1; i++) {
		// Assume the current row has the minimum value.
		minIdx = i;
		minVal = getTextValue(tblEl.rows[i].cells[col]);
		// Search the rows that follow the current one for a smaller value.
		for (j = i + 1; j < tblEl.rows.length; j++) {
			testVal = getTextValue(tblEl.rows[j].cells[col]);
			cmp = compareValues(minVal, testVal);
			// Negate the comparison result if the reverse sort flag is set.
			if (tblEl.reverseSort[col])
				cmp = -cmp;
			// Sort by the second column (team name) if those values are equal.
			if (cmp == 0 && col != 1)
				cmp = compareValues(getTextValue(tblEl.rows[minIdx].cells[1]), getTextValue(tblEl.rows[j].cells[1]));
			// If this row has a smaller value than the current minimum, remember its
			// position and update the current minimum value.
			if (cmp > 0) {
				minIdx = j;
				minVal = testVal;
			}
		}
		// By now, we have the row with the smallest value. Remove it from the
		// table and insert it before the current row.
		if (minIdx > i) {
			tmpEl = tblEl.removeChild(tblEl.rows[minIdx]);
			tblEl.insertBefore(tmpEl, tblEl.rows[i]);
			// tblEl.rows[minIdx].swapNode(tblEl.rows[i]);
		}
	}
	// Restore the table's display style.
	tblEl.style.display = oldDsply;
	return false;
}


//-----------------------------------------------------------------------------
// Functions to get and compare values during a sort.
//-----------------------------------------------------------------------------
// This code is necessary for browsers that don't reflect the DOM constants (like IE).
if (document.ELEMENT_NODE == null) {
	document.ELEMENT_NODE = 1;
	document.TEXT_NODE = 3;
}

function getTextValue(el) {
	var i;
	var s;
	// Find and concatenate the values of all text nodes contained within the element.
	s = "";
	for (i = 0; i < el.childNodes.length; i++) {
		if (el.childNodes[i].nodeType == document.TEXT_NODE) {
			s += el.childNodes[i].nodeValue;
		} else if (el.childNodes[i].nodeType == document.ELEMENT_NODE && el.childNodes[i].tagName == "BR") {
			s += " ";
		} else {
			// Use recursion to get text within sub-elements.
			s += getTextValue(el.childNodes[i]);
		}
	}
	
	// Regular expressions for normalizing white space.
	var whtSpEnds = new RegExp("^\\s*|\\s*$", "g");
	var whtSpMult = new RegExp("\\s\\s+", "g");

	s = s.replace(whtSpMult, " ");  // Collapse any multiple whites space.
	s = s.replace(whtSpEnds, "");   // Remove leading or trailing white space.

	return s;
}


function compareValues(v1, v2) {
	var f1, f2;
	// If the values are numeric, convert them to floats.
	f1 = parseFloat(v1);
	f2 = parseFloat(v2);
	if (!isNaN(f1) && !isNaN(f2)) {
		v1 = f1;
		v2 = f2;
	} else {
		return v1.localeCompare(v2);
	}
	// Compare the two values.
	if (v1 == v2)
		return 0;
	if (v1 > v2)
		return 1
	return -1;
}

