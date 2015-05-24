/*

image lib

*/

var renderlib = {
	'autofit' : function(attr_name, attr_value, container_level) {
		var images = document.getElementsByTagName('img');
		var i = 0
		for(; i < images.length; i++) {
			var img = images[i];
			if(img.getAttribute(attr_name) == attr_value) {
				var parent = img.parentNode;
				if((parseInt(container_level,10) == container_level)
					&& container_level > 1) {
					for(container_level--;container_level > 0; container_level--) {
						parent = parent.parentNode;
					}
				}
				var max_width = parent.offsetWidth;
				var max_height = parent.offsetHeight;
				var img_width = img.width;
				var img_height = img.height;
				//alert('width: '+ img_width +"   height:"+img_height);
				if(max_width>0&&max_height>0&&img_width>0&&img_height>0) {
					var result = max_width * img_height - max_height * img_width;
					var width = 0;
					var height = 0;
					if(result<0) {
						// 宽度
						img.width = max_width;
						//width  = max_width;
						//height = (max_width*img_height)/(img_width*1.0);
					} else {
						img.height = max_height;
						//height = max_height;
						//width  = (img_width*height)/(img_height*1.0);
					}

					// 垂直居中
				}
			}
		}
	}	
}


Q.render = function(action) {
	var func = renderlib[action];
	if(func instanceof Function) {
		return func;
	}
};