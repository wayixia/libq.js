

function CButton(id, text, icon) {
	var btn = document.createElement('font');
	var textNode = document.createTextNode(text);
	var iconctl = null;
	if(icon) {
		iconctl = document.createElement('img');
		iconctl.src = icon;
		btn.appendChild(iconctl);
	}
	
	btn.appendChild(textNode);
	btn.style.cssText = 'background:; border-width: 0px; padding: 4px; text-align: center; cursor: pointer; margin: 3;';
	btn.hideFocus = true;
	btn.onmouseover = function() {
		this.style.border = '1px solid #648BC6';
		this.style.background = '#C2CFE5';
		this.style.padding = '3px';
	};
	
	btn.onmouseout = function() {
		this.style.background = '';
		this.style.borderWidth = '0px';
		this.style.padding = '4px';
	};
	return btn;
}