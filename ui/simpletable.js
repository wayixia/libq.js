/*--------------------------------------------------------------------------------
 $ 类名：__SimpleTableL
 $ 功能：通用表格操作
 $ 日期：2008-10-09 23:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
----------------------------------------------------------------------------------- 
 $ 使用注意事项：
    1. 该组件表头和复选框项分别在表格的第一行和第一列，所以数据表是从第二行第二列开始。
 $ API:
    
----------------------------------------------------------------------------------*/

var TABLE_CAPTION  = 0x0001;     // 表头栏目
var TABLE_CHECKED  = 0x0002;     // 是否有复选框
var TABLE_DEFAULT  = TABLE_CAPTION;
var TABLE_NOITEM   = -1;         // 不存在该Item
var TABLE_SELECTEDITEM = -2;     // 当前选中Item

function IsStyle(cs, style){
    if( style == 0 ) {
        return false;   
    }
	return ((cs & style) == style)
}

// 创建可以带省略号(...)的字符串
function ICreateDivItem(parentNode, text, nWidth) {
	var d = $CreateHTMLObject('SPAN');
	parentNode.appendChild(d);
	d.style.cssText = 'width: ' + nWidth + 'px; height: 100%; font-size: 12px; overflow:hidden; text-overflow:ellipsis; white-space: nowrap;padding-left: 3px; display:table-cell; vertical-align:middle; ';
	d.innerHTML = text;
	return d;
}

var __SimpleTableL = __CLASS.create();
__SimpleTableL.prototype = {
	hwnd : null,    //表格table的container
	headctrl : null,    // 表头第一行为表头
	table : null,   // 表格对象
	checkall : null,    // 全选/全不选
	statectrl : null,   // 统计栏对象
	selectedItem : -1,  // 选中的行（这里的行称为item）
	wstyle : null,  // 样式
	_initialize : function(parent, name, ws, width, height) {
	    var _this  = this;
	    // 注册该表格组件并可以用UI.component['name']的形式来访问
	    if( name != '') {
	        if(UI.registerComponent(name, this)) {
			    alert(name + " register error! ");
			    return;
		    }
		    this.name = name;
	    }
	    // 构造该组件
	    this.wstyle = ws;
		this.hwnd  = $CreateHTMLObject('DIV');
		this.table = $CreateHTMLObject('TABLE');
		this.cellstyle = [];
		this.headctrl = this.table.insertRow(0);	//第一行为表头
		this.hwnd.appendChild(this.table);
		parent.appendChild(this.hwnd)
		
		// initialize table style
		this.table.border = 0;
		this.table.cellSpacing = 1;
		this.table.style.background = '#CCC';
		this.table.width = '100%';
		this.headctrl.style.cssText = 'background: #E2E6F0; color: blue;position: static;layout-grid-type: fixed;';
		this.hwnd.style.cssText = 'width: '+width+'; height: '+height+'; cursor: default; border: 0px solid #999; overflow: auto;';
		if(!IsStyle(ws, TABLE_CAPTION)) {
		    this.headctrl.style.display = 'none';
		}
		
		// 定义该组件的事件处理
		this.hwnd.onkeydown = function() { event.returnValue = false; return false; }
		this.hwnd.onselectstart = function() { return false; }
		// 实现上下键操作，并绑定了虚函数tableKeyDown(); 这样只要重载该函数即可做按键按下时额外的操作
		this.table.onkeydown = function() {
		    _this.tableKeyDown(event);
		    var parentNode = this.parentNode;
		    if(event.keyCode == 38) { // up
			    var prevItemIndex = Math.max(0, _this.selectedItem - 1);
			    _this.scrollby(prevItemIndex, true);	
		    } else if(event.keyCode == 40 ) {	// down
			    var nextItemIndex = Math.min(this.rows.length - 1, _this.selectedItem + 1);
			    _this.scrollby(nextItemIndex, false);			    
		    }
		}
		// 同上按键松开时做的额外操作
		this.table.onkeyup = function() {
		    _this.tableKeyUp(event);
		}		
	},
	
	// 插入表头字段
	insertColumn : function(nCol, szText, nWidth, szAlign) {
		var _this = this;
		var o = {width: nWidth, align: szAlign};
		this.cellstyle.push(o);
		var c = this.headctrl.insertCell(nCol);
		if(c.cellIndex == 0) {
		    _this.checkall = $CreateHTMLObject('input');
		    _this.checkall.type = 'checkbox';
		    c.appendChild(_this.checkall);
		    _this.checkall.onclick = function() {
		    	_this.itemCheckAll(this);
		    }
		    if(!IsStyle(this.wstyle, TABLE_CHECKED)) {
		        c.style.display = 'none';
		    }
		    return;
		}
		var d = ICreateDivItem(c, szText, nWidth);
		c.width = nWidth;
		d.Align = szAlign;
		if(this.table.rows.length > 1) {	this.insertColumnItems(nCol);	}
		return c.cellIndex;
	},
	
	// 插入一行， 这里只支持默认追加一行， 然后通过setItemText来设置该行的一些数据
	insertItem : function() {
	    var _this = this; 
		var rowItem = this.table.insertRow();
		rowItem.style.background = '#FFF';
		var len = this.headctrl.cells.length;		
		for(var i = 0; i < len; i++) {
		    var cell = rowItem.insertCell();
			var d = ICreateDivItem(cell, '', this.cellstyle[i].width);
			d.align = this.cellstyle[i].align;
		}
		// 将第一列设置为checkbox项
		checkbox = $CreateHTMLObject('input');
		checkbox.type = 'checkbox';
		rowItem.cells(0).innerHTML = '';
		rowItem.cells(0).appendChild(checkbox);
		rowItem.cells(0).vAlign = 'middle';    
		// 绑定checkbox
		rowItem.checkbox = checkbox;
		checkbox.onclick = function() {
			_this.itemCheck(rowItem);
		}
		if(!IsStyle(this.wstyle, TABLE_CHECKED)) {
		    rowItem.cells(0).style.display = 'none';
		}

		// 虚函数调用规则，尽量放在函数体内的第一行，这样才能保证一定能执行到，但是有些情况是不一样
		rowItem.onmouseover = function() { 
		    _this.itemMouseOver(this);
		}
		rowItem.onmouseout = function() {
			_this.itemMouseOut(this)
		}
		rowItem.onclick = function() {
			_this.itemClick(this);
			_this.selectedItem = this.rowIndex;
		}
		rowItem.ondblclick = function() {
		    _this.itemDblClick(this);
		    _this.selectedItem = this.rowIndex;
		}
		rowItem.oncontextmenu = function() {
		    _this.itemClick(this);
		    _this.selectedItem = this.rowIndex;
			_this.itemContextMenu(this);
			return false;
		}
		return rowItem.rowIndex;
	},
	
	// 设置nItem的columnIndex列的数据为innerText
	setItemText : function(nItem, columnIndex, text) {
		var row = this.getItem(nItem);
		row.cells(columnIndex).childNodes[0].innerText = text;
	},
	// 设置nItem的columnIndex列的数据为innerHTML
	setItemHtml : function(nItem, columnIndex, htmltext) {
		var row = this.getItem(nItem);
		row.cells(columnIndex).childNodes[0].innerHTML = htmltext;
	},
	// 绑定数据用
	setItemData : function(nItem, data) {
	    var row = this.table.rows(nItem);
	    row.data = data;
	},
	// 删除nItem
	deleteItem : function(nItem) {
	    this.table.deleteRow(nItem);
	},
	// 获得某item的操作句柄
	getItem : function(nItem) {
	    var returnItem = TABLE_NOITEM;
	    if((nItem == TABLE_SELECTEDITEM)) {
	        return this.table.rows(this.selectedItem);
	    } else if(this.IsEffectItem(nItem)) {
	        return this.table.rows(nItem);
	    } else {
	        return returnItem;
	    }
	    
	},
	
	getCheckItem : function(nItem) {
	    var rowItem = this.getItem(nItem);
	    return rowItem.checkbox;
	},
	getCheckValue : function(nItem) {
	    return this.getCheckItem(nItem).value;
	},
	setCheckValue : function(nItem, value) {
	    this.getCheckItem(nItem).value = value;
	},
	
	getCheck : function(nItem) {
	    return (this.getCheckItem(nItem).checked);
	},
	
	setCheck : function(nItem, ischeck) {
        this.getCheckItem(nItem).checked = ischeck;
	},
	
	// 获得绑定的数据
	getItemData : function(nItem) {
	    var row = this.table.rows(nItem);
	    return row.data;
	},
	// 统计行数
	getItemCount : function() {
	    return this.table.rows.length - 1;  // 除去表头
	},

	insertColumnItems : function(nCol) {
		var rowsNum = this.table.rows.length;
		for( var i=1; i < rowsNum; i++ ){
			var row = this.table.rows(i);
			var cell = row.insertCell(nCol);
			var d = ICreateDivItem(cell, '', this.cellstyle[nCol].width);
			d.Align = this.cellstyle[nCol].align;
			cell.appendChild(d);
		}
	},
	// 清楚所有数据，只留表头
	clear : function() {
	    while(this.table.rows.length > 1) {
	        this.deleteItem(1);
	    }
	},
	// 这个调整插入新列的时候，调整某列的宽度
	sizeItemToWidth : function(nCol, w) {
		var rowsNum = this.table.rows.length;
		for( var i=1; i < rowsNum; i++ ){
			var row = this.table.rows(i);
			var cell = row.cells(nCol);
			if( (cell.childNodes[0].offsetWidth + w) < 0 ) {
				return;
			}
			cell.childNodes[0].style.width = cell.childNodes[0].offsetWidth + w;
		}
	},
	// nItem是否在有效的表格行范围内
	IsEffectItem : function(nItem) {    
	    return ((nItem > 0) && (nItem <= (this.table.rows.length - 1)) );
	},
	// nItem是否在有效的表格列范围内
	IsEffectColumn : function(columnIndex) {
	    return ((columnIndex > 0) && (columnIndex < this.headctrl.cells.length));
	},
	// 列表滚动， 当IsUp的时候是向上，否则向下
	scrollby : function(nItem, IsUp) {
	    IsUp = (IsUp) ? true : false;
	    var _this = this;
	    var parentNode = _this.table.parentNode;
	    var rowItem = _this.table.rows( nItem );
	    if( nItem != _this.selectedItem) {
	        if(_this.selectedItem != TABLE_NOITEM) {
	            _this.table.rows( _this.selectedItem ).fireEvent('onmouseout');
	        }
	    }
		var pos = $GetAbsPosition(rowItem);
		if( rowItem.offsetTop < parentNode.scrollTop) { // 顶部移动处理
		    parentNode.scrollTop = rowItem.offsetTop;
		} else if( (rowItem.offsetTop + pos.height) > (parentNode.scrollTop + parentNode.offsetHeight)) { // 底部移动处理
		    parentNode.scrollTop = rowItem.offsetTop - (parentNode.offsetHeight - pos.height);
		}
		if(_this.selectedItem == 1 && IsUp) {
		    _this.table.rows( _this.selectedItem ).click();
		    return;
	    }
	    rowItem.click();
	},
	
	attachEvent : function(nItem, nCol, lpfunc) {
	    var _this = this;
	    var rowItemObj = _this.getItem(nItem);
	    rowItemObj.cells(nCol).onclick = lpfunc;
	},
	
	// virtual function to be overrided
	itemCheck		: function(item) {},
	itemCheckAll	: function(checkbox) {},
	itemClick       : function(item) {},
	itemDblClick    : function(item) {},
	itemContextMenu : function(item) {},
	itemMouseOver   : function(item) {},
	itemMouseOut    : function(item) {},
	itemMouseOver   : function(item) {},
	itemKeyUp       : function(item) {},
	tableKeyDown    : function(evt) {},
	tableKeyUp      : function(evt) {}
}