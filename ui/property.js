/*-------------------------------------------------------------------
 $ Property page class
 $ description : implemention of property page
---------------------------------------------------------------------*/
function propertypage(title, id, lpfunc){
	this.hwnd = null;	
	this.title = title;	// 属性页的标题
	this.isshow = false;
	// 界面资源id
	if( id == undefined || id=="" || id == null )
		this.resourceid = null;
	else
		this.resourceid = id;	
	this.lpfunc = lpfunc;	// 执行的函数句柄
}

var propertyX = Q.class();
propertyX.prototype = {
	hwnd : null,	// 主窗口
	pages : null,	// 用于保存属性页集合
	width : 100,
	height : 100,
	headwnd : null,		// 头部
	clientArea : null,		// 客户显示区域
	activeWnd : null,
	_initialize : function(parentWnd, width, height) {
		var _this = this;
		_this.pages = new __LIST;
		
		if( width != "" ) this.width = width;
		if( height != "" ) this.height = height;
		this.hwnd = document.createElement("DIV");	// 创建属性页主窗口
		parentWnd.appendChild(this.hwnd)
		this.hwnd.style.width = this.width;
		//this.hwnd.style.overflowY = 'hidden';
		this.hwnd.style.overflowX = 'hidden';
		this.hwnd.style.height = 30;
		this.hwnd.style.position = 'relative';
		this.hwnd.style.border = '0px solid red';
		
		this.headwnd = document.createElement("UL"); // 创建头部
		this.headwnd.className = "cls";
		this.headwnd.style.display = "block";
		this.headwnd.style.whiteSpace = 'nowrap';
		//this.headwnd.style.overflow = "auto";
		//this.headwnd.style.clear = 'right';
		var btnArr = $CreateHTMLObject('button');
		btnArr.style.cssText = 'z-index: 10; '+
			'float: right; background:;'+
			'width: 17px; height: 17px; '+
			'font-family: Wingdings 3; font-size: 10px; color: #000; '+
			'margin: 0px; border: 0px outset #FFF;'+
			'text-align: center; '+
			'position: relative; bottom: -11px;'+
			'cursor: hand;';
		btnArr.innerText = 'q';
		
		var btnClosed = $CreateHTMLObject('button');
		btnClosed.style.cssText = 'z-index: 10; '+
			'float: right; background:; '+
			'width: 17px; height: 17px; '+
			'font-size: 13px; color: #000; font-weight: bold;'+
			'margin: 0px; border: 0px outset #FFF;'+
			'text-align: center; padding: 2 0 0 0px;'+
			'position: relative; bottom: -11px;'+
			'cursor: hand;';
		btnClosed.innerText = '×';
		
		this.hwnd.appendChild(btnClosed)
		this.hwnd.appendChild(btnArr);
		
		this.clientArea = document.createElement("DIV");	// 创建客户区
		this.clientArea.style.border = "1px solid #7E92AA";
		this.clientArea.style.borderTop = "0px solid #7E92AA";
		this.clientArea.style.clear = "both";
		this.clientArea.style.width = "100%";
		this.clientArea.style.height = "100%";
		//this.initA();
		this.hwnd.appendChild(this.headwnd);
		//this.hwnd.appendChild(this.clientArea);
	},
	createNewPage : function(title, id, lpfunc){
		var _this = this;
		var newPage = new propertypage(title, id, lpfunc);
		var hItem = document.createElement("LI");
		var em = document.createElement('EM')
		var A  = document.createElement('A');
		A.appendChild(em);
		hItem.appendChild(A);
		newPage.hwnd = hItem;
		em.innerText = title;
		//A.href = '#';
		// alert(hItem.outerHTML)
		if( id ) {
			var obj = id.parentNode.removeChild(id);
			this.clientArea.appendChild(obj);
		}
		
		hItem.onclick = function(){
			_this.setActive(this);
		};
		hItem.attachEvent("onclick", lpfunc);
		_this.append(newPage);
		if(_this.activeWnd == null){
			_this.setActive(hItem);
			if( id ) id.style.display = "";
		}
		
		return newPage;
	},
	doModal : function(){
		
	},
	setActive : function(element){
		this.activeWnd = element;
		for(var node=this.pages.begin(); node != this.pages.end(); node = node.next) {
			node.key.hwnd.className = "";
			if(node.key.resourceid != null)
				node.key.resourceid.style.display = "none";
		}
		element.className = "clsover";
		var node = this.getPageByAddr(element);
		if( node == null ) return;
		
		if( node.resourceid != null ){
			//alert(node.resourceid.id);
			node.resourceid.style.display = "";
		}
	},
	remove : function(node){
		this.pages.removeByKey(node)
		
		if( this.activeWnd == node.hwnd ){
			var i = this.pages.begin();
			if( i == this.pages.end() )
				return;
			this.setActive(i.key.hwnd);
		}
		
		node.hwnd.parentNode.removeChild(node.hwnd);
		if( node.resourceid )
			node.resourceid.parentNode.removeChild(node.resourceid);
	},
	getPageByAddr : function(element){
		for(var i=this.pages.begin(); i != this.pages.end(); i = i.next) {
			if( i.key.hwnd == element ){
				return 	i.key;
			}
		}
		return null;
	},
	append : function(node){
		//alert(typeof node)
		this.pages.push(node);
		this.headwnd.appendChild(node.hwnd);
		// alert(this.headwnd.outerHTML)
		if( 118 * this.pages.length < this.hwnd.offsetWidth)
			this.headwnd.style.width = "100%"
		else
			this.headwnd.style.width = (118 * this.pages.length) + "px";
		
	},
	initA : function(){
		var arrowR = document.createElement("span");
		arrowR.style.marginTop = 5;
		arrowR.style.textAlign = "center";
		arrowR.style.marginLeft = 3;
		arrowR.style.paddingTop = 3;
		arrowR.style.width = "22px";
		arrowR.style.background = "#C1E0FF";
		arrowR.style.color = "blue";
		arrowR.style.fontWeight = "bold";
		arrowR.style.border = "1px solid #66CCFF"
		arrowR.innerText = ">";
		arrowR.style.styleFloat = "right";
		arrowR.onmouseover = function(){
			this.style.background = "blue";
			this.style.color = "#C1E0FF";	
		}
		arrowR.onmouseout = function(){
			this.style.background = "#C1E0FF";
			this.style.color = "blue";
		}
		this.headwnd.appendChild(arrowR)	
		var arrowL = document.createElement("span");
		arrowL.style.marginTop = 5;
		arrowL.style.textAlign = "center";
		arrowL.style.paddingTop = 3;
		arrowL.style.width = "22px";
		arrowL.style.background = "#C1E0FF";
		arrowL.style.color = "blue";
		arrowL.style.fontWeight = "bold";
		arrowL.style.border = "1px solid #66CCFF"
		arrowL.innerText = "<";
		arrowL.style.styleFloat = "right";
		arrowL.onmouseover = function(){
			this.style.background = "blue";
			this.style.color = "#C1E0FF";	
		}
		arrowL.onmouseout = function(){
			this.style.background = "#C1E0FF";
			this.style.color = "blue";
		}
		this.headwnd.appendChild(arrowL)	

	},
	scrollNext : function(){
		
	},
	scrollPre : function(){
		
	}
};

