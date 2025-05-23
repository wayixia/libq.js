/*------------------------------------------------------------------------------------
 $ Q.pager
 $ date: 2025-5-11 16:31
 $ author: Q 
 $ description: implement the paging of the jtable component
---------------------------------------------------------------------------------------*/
Q.pager = Q.extend({
	hwnd : null,
	ctrlHandler : null,
	//pagesize : 50,
	//rowcount : 0,
	//pagecount : 0,
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
	
	__init__ : function( args ) {
		var _this = this;
		_this.ctrlHandler = args.table;
		_this.hwnd = args.renderer;
		//_this.rowcount  = _this.ctrlHandler.totalsize();;
		//_this.pagesize = _this.ctrlHandler.pagesize();
		//_this.pagecount = Math.ceil(_this.rowcount / _this.pagesize);
		_this.initview();
		_this.update_table_rows();
	},

	__rowcount : function() {
		return this.ctrlHandler.total_size();
	},

	__pagesize : function() {
		return this.ctrlHandler.page_size();
	},

	__pagecount : function() {
		return Math.ceil(this.__rowcount()/ this.__pagesize());
	},

	
	initview : function() {
		var _this = this;
		//页脚显示分页
		_this.hwnd.innerHTML="";
		_this.hwnd.style.width = '400px';
		//rightBar.innerHTML="每页"+this.pagesize+"条/共"+this.rowcount+"条"+" 第"+(this.pageIndex+1)+"页/共"+this.pagecount+"页";
		
		_this.wstable = document.createElement("table");
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
		_this.inputPage	= document.createElement("input");
		_this.labelPageCount  = document.createElement("font");
		divPage.appendChild(_this.inputPage);
		divPage.appendChild(_this.labelPageCount);
		_this.inputPage.type = 'text';
		//divPage.style.cssText = "position: relative; top: -3px; margin: 0px 3px 0px 3px; font-weight: normal;";
		 
		_this.labelPageCount.style.cssText = "font-size: 13px;";
		_this.labelPageCount.innerHTML = " / "+_this.__pagecount()+"页";
		

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
		_this.inputPageSize = document.createElement("input");
		divPageRight.appendChild(textNode3);
		divPageRight.appendChild(_this.inputPageSize);
		_this.inputPageSize.value = _this.__pagesize();
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
							//_this.pagesize = _this.ctrlHandler.pagesize = pagesize;
							_this.ctrlHandler.set_page_size(pagesize);
							//_this.pagecount = Math.ceil(_this.rowcount / _this.pagesize);
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
		_this.labelRowCount = document.createElement('font');
		divPageRight.appendChild(_this.labelRowCount);
		_this.labelRowCount.style.cssText = 'color: red; font-weight: bold; font-size: 13px;'
		_this.labelRowCount.innerText = _this.__rowcount();
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
		
		if( _this.__pagecount()-1 == _this.currentpage) {
			_this.btnNext.className  = 'jtable_plugin_page_next_disabled';
		    _this.btnLast.className  = 'jtable_plugin_page_last_disabled';
		} else {
			_this.btnNext.className  = 'jtable_plugin_page_next';
		    _this.btnLast.className  = 'jtable_plugin_page_last';
		}
		
		_this.labelPageCount.innerText = " / "+_this.__pagecount()+"页";
		_this.labelRowCount.innerText  = _this.__rowcount();
	},
	
	update_table_rows : function() {
		var _this = this;
		
		var iCurrentrowcount = _this.pagesize * _this.currentpage;
		var iMoreRow = _this.pagesize+iCurrentrowcount > _this.rowcount ? _this.pagesize+iCurrentrowcount - _this.rowcount : 0;
		_this.ctrlHandler.loadPage(_this.currentpage+1, function() {
			_this.updateview();
		});
	},
	
	/* 下一页 */
	nextPage : function() {
		if(this.currentpage + 1 < this.__pagecount()) {
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
		if(this.currentpage+1 != this.__pagecount()) {
			this.currentpage = this.__pagecount() - 1;
			this.update_table_rows();
		}
	},
	/* 页定位方法 */
	goPage : function(iPageIndex) {
		if(iPageIndex > this.__pagecount()-1) {
			this.currentpage = this.__pagecount() - 1;
		} else if(this.currentpage < 0) {
			this.currentpage = 0;
		} else {
			this.currentpage = iPageIndex;
		}
		this.update_table_rows();
	}
});