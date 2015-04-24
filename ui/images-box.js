/*-------------------------------------------------------
 $ file:  images_box.js
 $ powered by wayixia.com
 $ date: 2014-12-09
 $ author: Q 
---------------------------------------------------------*/

Q.images_box = Q.extend({
hwnd: null,
__init__ : function(json) {
  json = json || {};
  var container = Q.$(json.container);
  this.hwnd = document.createElement('div');
  container.appendChild(this.hwnd);
  this.hwnd.className = "q-images-box";

  Q.$(json.container);
  this.on_item_changed = json.on_item_changed || function(item, checked) {};
  this.is_item_enabled = json.is_item_enabled || function(item) { return true; };
},

create_element: function(config, init) {
  var _this = this;
  var box = document.createElement('DIV');
  box.setAttribute('data-url', config.src);
  box.setAttribute('data-width', config.width);
  box.setAttribute('data-height', config.height);
  box.className = 'q-box-item';
  this.hwnd.appendChild(box);
  // init box
  box.innerHTML = '<span class="q-box-info"> \
    <span class="wh">'+config.width+'x'+config.height+'<span> </span> \
    </span>';
  // image container
  var img_container = document.createElement('div');
  var a = document.createElement('a');
  var img = document.createElement('img');
  box.inner_img = img;
  a.appendChild(img);
  img_container.appendChild(a);
  box.appendChild(img_container);

  // mask layer
  var mask = document.createElement('div');
  mask.className = 'select-mask';
  box.appendChild(mask);

  // init event
  img_container.className = 'wayixia-image';
  a.href='javscript:void(0);';
  a.onclick=function(evt){ evt.preventDefault();};
  // calculate size
  var size = this.calculate(box.offsetWidth, box.offsetHeight, config.width, config.height);
  img.src=config.src;
  img.className = 'image';
  img.style.cssText = 'margin-top:'+size.top+'px;width:'+size.width+'px;height:'+size.height+'px;'
  
  box.onmouseover = function() {
    if(!_this.is_item_enabled(this))
      return;
    if(Q.hasClass(this, 'mouseselected')) 
      return;
    Q.addClass(this, "mouseover");
  } 
  
  box.onmouseout = function(e) {
    if(!_this.is_item_enabled(this))
      return;
    if(Q.hasClass(this, 'mouseselected')) 
      return;
    Q.removeClass(this, "mouseover");
  }

  box.onclick = function() {
    _this.set_check(this, !Q.hasClass(this, 'mouseselected'));
  }
  
  init(box);
},
  
each_item : function(callback) {
  var items = this.hwnd.childNodes;
  for(var i=0; i < items.length; i++) {
    var item = items[i];
    if(item.nodeType == Q.ELEMENT_NODE && (!item.id)) {
      callback(item);
    }
  }
 
},

select_all : function(checked) {
  this.each_item((function(o, state) { return function(item) { o.set_check(item, state); } })(this, checked));
},

set_check : function(item, checked) {
  if(!this.is_item_enabled(item))
      return;

  Q.removeClass(item, "mouseover");
  if(checked == Q.hasClass(item, 'mouseselected'))
    return;
  if(checked)
    Q.addClass(item, 'mouseselected');
  else
    Q.removeClass(item, 'mouseselected');

  this.on_item_changed(item, checked); 
}, 

set_style : function(new_class) {
  Q.removeClass(this.hwnd, this.old_style);
  this.old_style = new_class;
  Q.addClass(this.hwnd, new_class);
  this.each_item((function(o) { 
    return function(i) {
      o.on_item_size(i);
    }; 
  })(this))

},

on_item_size : function(box) {
  var img = box.inner_img;
  // warning: don't use box.offsetWidth or box.offsetHeight when display is none; 
  var size = this.calculate(parseInt(box.currentStyle.width, 10), parseInt(box.currentStyle.height, 10), img.width, img.height);
  img.style.cssText = 'margin-top:'+size.top+'px;width:'+size.width+'px;height:'+size.height+'px;'
},

calculate : function(max_width, max_height, img_width, img_height) {
  // filter image by size
  var result = max_width * img_height - max_height * img_width;
  var width = 0;
  var height = 0;
  if(result<0) {
    //img.width = max_width;  // 宽度
    width  = max_width;
    height = (max_width*img_height)/(img_width*1.0);
  } else {
    //img.height = max_height;
    height = max_height;
    width  = (img_width*height)/(img_height*1.0);
  }
  
  return { width: width, height: height, top: (max_height-height)/2 };
},

//
// Returns a function which will handle displaying information about the
// image once the image has finished loading.
//
getImageInfoHandler : function(data, init) {
  var _this = this;
  return function() {
    var img = this;
    var image_item = _this.copy_data(data);        
    image_item['src'] = img.src;
    image_item['width'] = img.width;
    image_item['height'] = img.height;
    _this.create_element(image_item, init);
  };
},

display_images : function(accept_images, data, init) {
  var _this = this;
  init = init || function(item) {}
  this.hwnd.innerHTML = '';
  return function() {
    for(var src in accept_images) {
        var img = new Image();
        img.onload=_this.getImageInfoHandler(data, init);
        img.src=src;
    }
  }
},

check_size : function(item, min_width, min_height) {
  var width = item.getAttribute('data-width');
  var height = item.getAttribute('data-height');
  item.style.display = ((width < min_width) || (height < min_height)) ? 'none':'';
},


copy_data : function(src_object) {
  var target_object = {}; 
  for(var name in src_object) {
    target_object[name] = src_object[name];
  }
  return target_object;
},

}); // Q.images_box

