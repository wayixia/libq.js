// grid class document

var __progressBarL = __CLASS.create();


__progressBarL.prototype = {
	hwnd: null, //±í¸ñ´°¿Ú
	progresswnd : null,
	width : 0,
	height: 0,
	showNo : false,
	_initialize : function(parentNode, width, height) {
		this.hwnd = $CreateHTMLObject('DIV');
		this.progresswnd = $CreateHTMLObject('DIV');
		parentNode.appendChild(this.hwnd);
		this.hwnd.appendChild(this.progresswnd);
//		this.progresswnd.innerText = 't';
		this.width = width;
		this.height = height;
		this.hwnd.style.cssText='display: none; width: '+ width + '; height:' + height +'; background: white; border: 1px solid black; overflow: hidden;';
        this.progresswnd.style.cssText = "width: 10px; height: 100%; background: blue;";
	},
	
	setPos : function(position) {
	    var tar = (position / 100) * this.hwnd.offsetWidth;
	    this.progresswnd.style.width = tar;
	},
	
	show : function() {
	    this.hwnd.style.display = '';
	},
	
	hide : function() {
	    this.hwnd.style.display = 'none';
	},
	
	destroy : function() {
	    this.hwnd.style.display = 'none';
	}
	
}