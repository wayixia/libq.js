/*
 * app.js @wayixia.com 
 * author Q
 */

window.fck_userdefine_command = function (action, instance) {
  var re = /deditor\/(\d+)\/(\d+)/i;
  if(!re.test(instance.Name))
    return;
  //alert(RegExp.$1 + '--' + RegExp.$2);
  var app_id = RegExp.$1;
  var did    = RegExp.$2;
  var app = get_app(app_id);
  if(!app || !did)
    return;
  app.document_property(did);
}

window.format_size = function( bytes ) {
    var kb = bytes / 1024;
    var mb = kb / 1024;
    var gb = mb / 1024;

    var s = "";
    if( gb >= 1 ) {
      s = gb.toFixed(2) + " GB";
    } else if( mb >= 1 ) {
      s = mb.toFixed(2) + " MB";
    } else if( kb >= 1 ) {
      s = kb.toFixed(2) + " KB";
    } else {
      s = bytes + " B"
    }

    return s;
}


// const LENGTH = 1024 * 1024;//每次上传的大小 

// window.async_uploadfile = function( url, objprogress, fn )
// {
//   return function( file, start, end, res ) {
//     var c = arguments.callee;
//     if( start < file.size )
//     {
      
//       fd = new FormData();//每一次需要重新创建 
//       blob = file.slice(start,end);//根据长度截取每次需要上传的数据 
//       fd.append('Filedata',blob);//添加数据到fd对象中 
//       fd.append('filename',file.name); //获取文件的名称 
//       fd.append('filesize',file.size); //获取文件的名称 
//       fd.append('finished',file.size <= end ); //获取文件的名称 

//       try {
//         // timestamp
//         var r = Q.json_decode( res );
//         if( r && r.data && r.data.timestamp ) {
//           fd.append( 'timestamp', r.data.timestamp );
//         }
//       } catch( e ) {

//       }


//       var xhr = new XMLHttpRequest();//需要每次创建并设置参数 
//       xhr.open('POST', url, true); 
//       xhr.withCredentials = true;
//       xhr.onreadystatechange=function(){
//         if(this.readyState == 4 ) {
//           if( this.status == 200) {
//           //document.getElementById("output").innerText += xhr.responseText;
//             //arguments.callee.apply()
//             c( file, end, end + LENGTH, xhr.responseText );
//           } else {
//             fn( false, "" );
//           }
//         }
//       }
 

//       // 监听文件上传进度
//       xhr.upload.addEventListener( 'progress', function (ev){
//         if(ev.lengthComputable){
//           var progress = ( start + ev.loaded )/file.size *100;
//           objprogress.style.width = progress + '%';
//           objprogress.innerText = progress + '%';
//         }
//       }, false );

//       xhr.send(fd);//将fd数据上传 
//     } else {
//       fn( true, res );
//     }
//   };
// }

// window.selfile = function( obj, objprogress, fn ){ 
//       const LENGTH = 1024 * 1024 * 10;//每次上传的大小 
//       var file = obj.files[0];//文件对象 
//       var filename=obj.files[0].name; 
//       var totalSize = file.size;//文件总大小 
//       var start = 0;//每次上传的开始字节 
//       var end = start + LENGTH;//每次上传的结尾字节 

//       async_uploadfile( "https://www.wayixia.com/?mod=attachment&action=do-upload-file&inajax=true", objprogress, fn )( file, start, end, "" );
//       //async_uploadfile( "testupload.php", objprogress )( file, start, end );
// } 

// 用于获取指定q:id属性的元素
window.qid = function(p, q_id) {
  if( p.querySelector )
  {
    return p.querySelector( '[qid="'+q_id+'"]' );
  }

  function find_item(e) {
    var r = null;
    for (var i = 0; i < e.childNodes.length; i ++) {
      var c = e.childNodes[i];
      if(c.nodeType === Q.ELEMENT_NODE) {
        if(c.getAttribute("qid") == q_id) {
          r = c;
          break;
        } else {
          if(r = find_item(c))
            break;
        }
      }
    }
    return r;
  }
  return find_item(p);
}




var app_service = Q.extend({
api: null, 
__init__: function(json) {
  json = json || {};
  this.api = json.api;
},

modules_list: function(f) {
  this.call("modules_list", null, f);
},

images_list: function(value, f) {
  this.call("images_list", {value:value, start:0, size: 50}, f);
},

images_check: function( items, checked, f ) {
  this.call("images_check", { items: items, checked: checked }, f);
},

images_delete: function( items, f ) {
  this.call("images_delete", { items: items }, f);
},

category_list: function(f) {
  this.call("category_list", null, f);
},

category_article_create: function(category_pid, props, f) {
  this.call("category_article_create", {pid: category_pid||0, props: props}, f);
},

category_article_update: function(cid, props, f) {
  this.call("category_article_update", {cid: cid, props: props}, f);
},

document_list: function(cid, f) {
  this.call("document_list", {cid: cid}, f);
},

document_content: function(did, f) {
  this.call("document_content", {did: did}, f);
},

document_save_content : function(did, content, f) {
  this.call("document_save_content", {did: did, content: content}, f);
},

document_save_property : function(did, props, f) {
  this.call("document_save_property", {did: did, props: props}, f);
},

document_create_new : function(cid, props, f) {
  this.call("document_create_new", {cid: cid, props: props}, f);
},

py : function(name, f) {
  this.call("py", {name: name}, f);
},


attachments_list : function( pid, pagesize, f ) {
  this.call( "attachments_list", { pid: pid, pagesize: pagesize }, f );
},




call : function(method, params, f) {
  var invalid_data = -2;
  Q.ajaxc({
    command: this.api + method,
    withCredentials: true,
    data: params,
    oncomplete : function(xmlhttp) {
      var res = Q.json_decode(xmlhttp.responseText);
      if(!res)
        f(invalid_data, {});
      else
        f(res.header, res.data);
    },
    onerror : function(xmlhttp) {
      f(xmlhttp.status, {});
    }
  });

}

});




g_attachments_window = null;

_entry( Q.UIApplication.extend (
{
ui: null,
main_wnd: null,
category_wnd: null,
service: null,
documents : null,
categories: null,
__init__: function(json) {
  json = json || {}
  Q.UIApplication.prototype.__init__.call(this, json);
  var _this = this;
  //this.ui = json.ui;
  this.documents = {};
  this.categories = {};
  //this.ui.bindCss();
  this.service = new app_service({api: "https://www.wayixia.com/?mod=appwayixia&inajax=true&action="});

  //this.main_wnd = require( './filebrowse.view' )({ app:this } );
  this.main_wnd = require( './main.view' )({ app:this } );
  this.main_wnd.show(true);
  this.main_wnd.center();


},

open_item : function(item) {
  if(item.menu_id == "0001") { // categories
    this.open_category( item );
  } else if( item.menu_id == "0006") {
    this.open_attachments( item );
  } else if( item.menu_id == "0007") {
    this.open_images( item );
  } else {
    var _this = this;
    var f = new Q.Window({
      app: _this,
      wstyle: "simpleos",
      title: item.menu_name,
    });
    f.show(true);
    f.center();
  }
},

open_category : function(item) {
  var _this = this;

  if(this.category_wnd) {
    this.category_wnd.activate();
    return;
  }

  // new category_window
  this.category_wnd = require( './category.view' )( { 
    app:this,
    title: item.menu_name,
    on_close : function() { delete _this.category_wnd; _this.category_wnd=null; return true; }
  });

  this.category_wnd.show(true);
  this.category_wnd.center();
},

open_images : function( item ) {
  var _this = this;

  if( this.images_wnd ) {
    this.images_wnd.activate();
    return;
  }

  //this.images_wnd = new images_window( {
  this.images_wnd = require( './images.view' )( {
    title: item.menu_name,
    app: _this,
    on_close: function() { delete _this.images_wnd; _this.images_wnd=null; return true; }
  } );

  this.images_wnd.show( true );
  this.images_wnd.center();
},


open_attachments: function( item ) {
  var _this = this;

  if( this.attachments_wnd ) {
    this.attachments_wnd.activate();
    return;
  }

  g_attachments_window = this.attachments_wnd = require( './attachments.view' )( {  //new attachments_window( {
    title: item.menu_name,
    app: _this,
    on_close: function() {
      delete _this.attachments_wnd;
      _this.attachments_wnd=null; return true; 
    }
  } );

  this.attachments_wnd.show( true );
  this.attachments_wnd.center();
 
},

document_editor : function(r, data) {
  if(r != 0) {
    Q.alert({wstyle: "simpleos", title: "编辑文档", content: data});
    return false;
  }

  
  var _this = this;
  var document_data = _this.documents[data.id] = data;
  var edit_dialog = require( './doceditor.view' )( {
    app: this,
    doc: data,
  } );

  edit_dialog.domodal();
},

document_property : function(did) {
  var _this = this;
  //var dlg = new document_create_title({app: _this, title: "属性", did: did, data: _this.documents[did]});
  var dlg = require( './docproperty.view' )( {
    app: this,
    title: "属性", 
    did: did, 
    data: this.documents[did]
  } );
  dlg.domodal();
},

select_image : function(p, render) {
  var _this = this;
  var block_window = new Q.Dialog({
    parent: p,
    wstyle: "simpleos",
    width: 600,
    height: 400,
    title: "请选择图片",
    content: _this.ui.template('wnd-x-imagelist'),
    buttons: [
      { text: "选 择", 
        style:'sysbtn', 
        onclick: function() { 
          render.src = block_window.box.selected.getAttribute("data-url"); 
          return true; 
        } 
      }, 
      { text: "取 消", style:'syscancelbtn', onclick: function() { return true; } },
    ],

    on_create : function() {
      var d = this;
      d.box = new Q.ImagesBox({
        id: d.item('wayixia-list'),
        on_item_changed : function(item, checked) {
          
          if(this.selected != item) {
            if(this.selected)
              this.set_check(this.selected, false);
            this.selected = item;
          }
        }      
      });
      Q.ajax({
        command: '/filedialog/filemgr.php?cfg=wayixia-images&f=1&p=/',
        oncomplete : function(xmlhttp) {
          var images = Q.json_decode(xmlhttp.responseText);
          var displays = {}
          for(var i=0; i < images.length; i++) {
            var src = images[i].domain_path + images[i].path + '/' + images[i].name;
            displays[src] = src;
          }
          d.box.display_images(displays, {})();
        },
        onerror : function(xmlhttp) {}
      });        
    }
  });
  block_window.item('wayixia-list').style.visibility = 'visible';
  block_window.domodal(); 
},

__active__: function() {
  this.main_wnd.show( true );
},
 
on_exit : function() {
  delete this.category_wnd;
  this.category_wnd = null;
  this.__exit__(); 
},

tool_set_selectedIndex : function(e, value) {
  for(var i=0;i<e.options.length;i++) {
    if(e.options[i].value == value) {
      e.options[i].selected = true;
      break;
    }
  }
},

dummy : function() {

}

}));


var images_window = Q.Window.extend( {
app: null,
__init__: function( json ) {
  json = json || {};
  this.app = json.app;
  json.width = 1060;
  json.height = 800;
  json.content = this.app.ui.template('wnd-x-images')
  json.wstyle = "simpleos q-attr-with-bottom";
  
  json.on_create = Q.bind_handler(this, this.on_create);
  //json.on_close = Q.bind_handler(this, this.on_close);
  Q.Window.prototype.__init__.call(this, json);
}

, on_create : function() {
  var _this = this;
  //var list_ctrl = this.item("abc");

  var d = this;
  d.box = new Q.ImagesBox({
    id: d.item('wayixia-list'),
    on_item_changed : function(item, checked) {
      /*
      if(this.selected != item) {
        if(this.selected)
          this.set_check(this.selected, false);
          this.selected = item;
      } */
    }
  });

  // initialize menubar
  var edit_menu = new Q.Menu({
    style: "wayixia-menu", 
    on_popup: function(popup) {
      if( popup ) {
        Q.addClass( d.item('menu-edit'), "q-active" );
      } else {
        Q.removeClass( d.item('menu-edit'), "q-active" );
      }
    }
  });
  var item_selectall = new Q.MenuItem({
    text: "全选",
    callback : function(menuitem) {
      d.box.select_all(true);
    }
  });
  
  var item_selectnone = new Q.MenuItem({
    text: "取消选中",
    callback : function(menuitem) {
      d.box.select_all(false);
    }
  });

  var item_deleteall = new Q.MenuItem({
    text: "删除选中",
    callback : function(menuitem) {
      d.check_images( 2 );
    }
  });

  var item_check = new Q.MenuItem({
    text: "审核通过", 
    callback : function(menuitem) {
      d.check_images( 0 );
    }
  });

  var item_uncheck = new Q.MenuItem({
    text: "取消审核", 
    callback : function(menuitem) {
      d.check_images( 1 );        
    }
  });

  var item_file_checked = new Q.MenuItem({
    text: "打开审核", 
    callback : function(menuitem) {
      d.refresh( 0 );        
    }
  });

  var item_file_unchecked = new Q.MenuItem({
    text: "打开待审核", 
    callback : function(menuitem) {
      d.refresh( 1 );        
    }
  });

  var item_file_deleted = new Q.MenuItem({
    text: "打开已删除", 
    callback : function(menuitem) {
      d.refresh( 2 );        
    }
  });



  edit_menu.addMenuItem( item_selectall );
  edit_menu.addMenuItem( item_selectnone );
  edit_menu.addMenuItem( item_deleteall );

  var check_menu = new Q.Menu({
    style: "wayixia-menu", 
    on_popup: function(popup) {
      if( popup ) {
        Q.addClass( d.item('menu-check'), "q-active" );
      } else {
        Q.removeClass( d.item('menu-check'), "q-active" );
      }
    }
  });
  check_menu.addMenuItem( item_check );
  check_menu.addMenuItem( item_uncheck );

  var file_menu = new Q.Menu({
    style: "wayixia-menu", 
    on_popup: function(popup) {
      if( popup ) {
        Q.addClass( d.item('menu-file'), "q-active" );
      } else {
        Q.removeClass( d.item('menu-file'), "q-active" );
      }
    }
  });
  file_menu.addMenuItem( item_file_checked );
  file_menu.addMenuItem( item_file_unchecked );
  file_menu.addMenuItem( item_file_deleted );

  file_menu.hide();
  edit_menu.hide();
  check_menu.hide();
  d.menubar = new Q.MenuBar({ container: d.item('menu-bar') } );
  var e = d.item('menu-edit');
  var e2 = d.item('menu-check');
  var e3 = d.item('menu-file');
  d.menubar.append( e3, file_menu);
  d.menubar.append( e, edit_menu);
  d.menubar.append( e2, check_menu);

  this.refresh();
}



, on_close : function() {

}

, refresh : function( value ) {
  var d = this;
  value = value || 0;
  this.app.service.images_list( value, function(code, data) {
    var displays = {};
    for(var i=0; i < data.length; i++) {
      var src = "https://"+data[i].server+"/"+data[i].create_time+"/thumb/"+data[i].file_name;
      displays[src] = data[i].id;
    }
    d.box.display_images(displays, {} )();
  });
}

, check_images( value ) {
  var d = this;
  var imgs = [];
  d.box.each_item(function(item) {
    if((item.className.indexOf('mouseselected') != -1) && item.style.display == '') {
      imgs.push( item.__userdata.userdata );
    }
  });

  d.app.service.images_check( imgs, value, function( rr, data ) {
    if(rr != 0) {
      Q.alert({app:d.app, wstyle: "simpleos", title: "图片管理", content: data });
    } else {
      Q.alert({app:d.app, wstyle: "simpleos", title: "图片管理", content: "操作成功"});
      d.refresh(value);
    }
  } );
}

} );


/*
var document_create_title = Q.Dialog.extend({
app: null,
document_data : null,
did : 0,
cid : 0,
__init__ : function(json) {
  var _this = this;
  json = json || {};
  this.did = json.did || 0;
  this.cid = json.cid || 0;
  this.document_data = json.data || {};
  this.app = json.app;
  json.width = 360;
  json.height = 400;
  json.content = this.app.ui.template('wnd-x-property')
  json.wstyle = "simpleos q-attr-with-bottom";
  json.buttons = [
    {text: "确 定", onclick: Q.bind_handler(_this, _this.on_save)},
    {text: "取 消", style: "syscancelbtn", onclick: function() {return true;}}
  ];

  json.on_create = Q.bind_handler(this, this.on_create);
  json.on_close = Q.bind_handler(this, this.on_close);
  Q.Dialog.prototype.__init__.call(this, json);
},

on_create: function() {
  var d = this;
  // init tabs
  var t = new Q.tabs({
    active: d.item('tab-basic'),
    items: [
      {tab: d.item('tab-basic'), content: d.item('panel-basic')},
      {tab: d.item('tab-thumbnail'), content: d.item('panel-thumbnail')},
      {tab: d.item('tab-attach'), content: d.item('panel-attach')},
    ]  
  });

  // init data
  var document_data = d.document_data;
  d.item('d_title').value = document_data.title || "";
  d.item('d_sources').value = document_data.sources || "";
  d.item('d_author').value = document_data.author || "";
  d.item('d_abstract').value = document_data.abstract || "";
  d.item('d_ischecked').value = document_data.ischecked || 0;
  d.app.tool_set_selectedIndex(d.item('d_showtype'), document_data.showtype || 0);
  d.item('d_pic').src = document_data.thumbnail || "";
  d.item('d_pic').onclick = function() { d.app.select_image(d, this) };
},

on_save : function() {
  var d = this;
  var document_data = d.document_data;
  var props = {};
  props.title = document_data.title = d.item('d_title').value;
  props.showtype = document_data.showtype = d.item('d_showtype').value;
  props.sources = document_data.sources = d.item('d_sources').value;
  props.author = document_data.author = d.item('d_author').value;
  props.abstract = document_data.abstract = d.item('d_abstract').value;
  props.ischecked = document_data.ischecked = d.item('d_ischecked').value;
  props.thumbnail = document_data.thumbnail = d.item('d_pic').src;
  
  var f = (function(dlg) { return function(rr, data) {
    if(rr != 0) {
      Q.alert({app: dlg.app, wstyle: "simpleos", title: "编辑文档", content: data});
    } else {
      dlg.end();
    }
  }})(d);
  if(d.did > 0) { // edit
    d.app.service.document_save_property(document_data.id, props, f);
  } else {
    d.app.service.document_create_new(d.cid, props, f);
  }
},

on_close : function() {}

});

*/

var category_editor = Q.Dialog.extend({
app: null,
contenttype: 1,
title: null,
keywords: null,
description: null,
thumbnail: null,
displaytype: null,

__init__ : function(json) {
  var _this = this;
  json = json || {};
  this.app = json.app;
  // init data
  this.contenttype = json.contenttype;
  this.title = json.title || "";
  this.edit = !!json.edit;
  if(this.edit)
    this.category_id = json.cid;
  else
    this.category_pid = json.pid;
  // init ui
  json.width = json.width || 500;
  json.height = json.height || 650;
  json.content = this.app.ui.template('wnd-x-cproperty')
  json.wstyle = "simpleos q-attr-with-bottom";
  json.buttons = [
    {text: "确 定", onclick: Q.bind_handler(_this, _this.on_save)},
    {text: "取 消", style: "syscancelbtn", onclick: function() {return true;}}
  ];

  json.on_create = Q.bind_handler(this, this.on_create);
  json.on_close = Q.bind_handler(this, this.on_close);
  Q.Dialog.prototype.__init__.call(this, json);
},

on_create : function() {
  var d = this;
  var tabs_groups = {
    1:[
         {tab: d.item('tab-basic'), content: d.item('panel-basic')},
         {tab: d.item('tab-advance'), content: d.item('panel-advance')},
    ],
    5:[
        {tab: d.item('tab-basic'), content: d.item('panel-basic')},
        {tab: d.item('tab-advance-url'), content: d.item('panel-advance-url')},  
    ],
  }  

  var items_selected = tabs_groups[d.contenttype];
  for(var i=0; i < items_selected.length; i++) {
    var e = items_selected[i];
    e.tab.style.display = '';
    e.content.style.display = '';
  }
  d.tabs = new Q.tabs({
    active: d.item('tab-basic'),
    items: items_selected,
  });

  // events
  d.item('d_pic').onclick = function() { d.app.select_image(d, this) };
  d.item('d_displaytype').onchange = function() { d.change_to_display(this.value); };
 
  var c = {};
  // init data
  if(d.edit) {
    // edit mode
    c =  d.app.categories[d.category_id];
    //d.item('d_pic').src = c.thumbnail;
  } else {
    c.category_name = "";
    c.keywords = "";
    c.description = "";
    c.displaytype = "0";
    c.defaultpage = "index.html";
  }

  d.item("d_category_name").value = c.category_name;
  d.item("d_orders").value = c.orders || 30;
  d.item("d_keywords").value = c.keywords;
  d.item("d_description").value = c.description;

  if(c.thumb)
    d.item('d_pic').src = c.thumb;
  
  //d.item("d_htmlpath").value = c.htmlpath;
  if(/(\{\w+\})\/(.+)/.test(c.htmlpath)) {
    //d.item("d_relative_dir").value = RegExp.$1;
    d.item("d_htmlpath").value = RegExp.$2;
  } else {
    d.item("d_htmlpath").value = c.htmlpath;
  }

  //d.item("d_htmlpath").value = c.htmlpath;
  d.item("d_defaultpage").value = c.defaultpage || "index.html";
  d.app.tool_set_selectedIndex(d.item("d_accesstype"), c.accesstype);
  //d.item("d_accesstype").value = c.accesstype;
  // displaytype
  d.change_to_display(c.displaytype);
  d.app.tool_set_selectedIndex(d.item('d_displaytype'), c.displaytype);
  d.item("d_tpllist").value = c.tpllist || "list";
  d.item("d_tpllistrule").value = c.tpllistrule || "list-{cid}";
  //d.item("d_gotoid").value = c.gotoid;
  d.item("d_tplindex").value = c.tplindex || "tplindex";
  d.item("d_tplarticle").value = c.tplarticle || "article";
  d.item("d_tplarticlerule").value = c.tplarticlerule || "d-{cid}-{id}";
  d.item("d_tplcover").value = c.tplcover || "tplcover";
  d.item("d_tplsingle").value = c.tplsingle || "single";

  // init event
  d.item("d_py").onclick = (function(dlg) { 
    return function(evt) {
      dlg.app.service.py(dlg.item("d_category_name").value, function(rr, data) {
        if(rr == 0)
          dlg.item("d_htmlpath").value = data;
        else
          dlg.item("d_htmlpath").focus();
      });
    };
  })(d);
},

on_save : function() {
  var d = this;
  console.log(d);
  var c = {};
  if(d.edit) {
    cid = d.category_id;
    c =  d.app.categories[cid];
  } else {
    pid = d.category_pid;
  }
  c.category_name = d.item("d_category_name").value;
  c.orders = d.item("d_orders").value;
  c.keywords = d.item("d_keywords").value;
  c.description = d.item("d_description").value;

  c.thumb = d.item('d_pic').src;
  //c.htmlpath = d.item("d_relative_dir").value + "/" + d.item("d_htmlpath").value;
  c.htmlpath = '{site}/' + d.item("d_htmlpath").value;
  c.defaultpage = d.item("d_defaultpage").value;
  c.accesstype = d.item("d_accesstype").value;
  // displaytype
  c.displaytype = d.item('d_displaytype').value;
  c.tpllist = d.item("d_tpllist").value;
  c.tpllistrule = d.item("d_tpllistrule").value;
  //d.item("d_gotoid").value = c.gotoid;
  c.tplindex = d.item("d_tplindex").value;
  c.tplarticle = d.item("d_tplarticle").value;
  c.tplarticlerule = d.item("d_tplarticlerule").value;
  c.tplcover = d.item("d_tplcover").value;
  c.tplsingle = d.item("d_tplsingle").value;

  var f =  function(rr, data) {
    if(rr != 0) {
       Q.alert({app:d.app, wstyle: "simpleos", title: "创建/编辑栏目", content: data});
    } else {
       Q.alert({app:d.app, wstyle: "simpleos", title: "创建/编辑栏目", content: "保存成功"});
    }
  };
  if(d.edit) {
    d.app.service.category_article_update(cid, c, f);
  } else {
    d.app.service.category_article_create(pid, c, f);
  }
  return true;
},

on_close : function() {
  return true;
},

change_to_display : function(val) {  
  var d = this;
  var tpls = [
    'tpl_list', 
    'tpl_list_rule', 
    'tpl_article', 
    'tpl_article_rule',
    'tpl_cover',
    'tpl_single',
    'tpl_index'
  ];
  var groups = [
    [0,1,2,3],
    [4],
    [5],
    [6,2,3]
  ];
    
  for(var i=0; i<tpls.length; i++) {
    var obj = d.item(tpls[i]);
     if(obj)
       obj.style.display = 'none';
  };
  
  val = parseInt(val, 10)%groups.length;
  
  var arr = groups[val];
  for(var i=0; i < arr.length; i++) {
    var obj = d.item(tpls[arr[i]]);
    if(obj) {
      obj.style.display = '';
    }
  };
    
  var sel = d.item('d_gotoid');
  // 连接到指定文档
  if(val == 3) {
    sel.style.display = '';
    var dselector = sel;
    if(dselector.value == '') {
      d.item('tpl_index_index').style.display = '';
    } else {
      d.item('tpl_index_index').style.display = 'none';
    }
  } else {
    sel.style.display = 'none';
    d.item('tpl_index_index').style.display = 'none';
  }
}


});

/*

var attachments_window = Q.Dialog.extend({
app: null,
listctrl: null,
__init__: function( json ) {
  var _this = this;
  json = json || {};
  this.app = json.app;
  // init ui
  json.width = json.width || 800;
  json.height = json.height || 500;
  json.content = this.app.ui.template('wnd-x-attachments')
  json.wstyle = "simpleos";
  //json.buttons = [
  //  { id: "id_attach_upload", text: "上 传", onclick: Q.bind_handler(_this, _this.on_upload)},
    //{ id: "id_attach_cancel", text: "取 消", style: "syscancelbtn", onclick: Q.bind_handler(_this, _this.on_upload)},
    //{ text: "关 闭", style: "syscancelbtn", onclick: function() {return true;}}
  //];

  json.on_create = Q.bind_handler(this, this.on_create);
  json.on_size = Q.bind_handler(this, this.on_size);
  //json.on_close = Q.bind_handler(this, this.on_close);
  Q.Dialog.prototype.__init__.call(this, json);
  this.removeStyle( "q-attr-no-max" );
  this.removeStyle( "q-attr-no-min" );
  this.removeStyle( "q-attr-fixed" );
},


on_create : function() {

  var _this = this;

  var listctrl_container = this.item("q-list-ctrl");
  this.listctrl = new Q.Table({
    id: listctrl_container, 
    wstyle :  'q-attr-no-title q-attr-border',
    row_height: 26,
    auto_height : true,
    columns : [ 
      { name: 'fid', title: 'ID', width: 60, align: 'center', issortable: true, fixedWidth: true}, 
      { name: 'fname', title: '文件名称', width: 300, align: 'left', issortable: true, isHTML : true, fixedWidth: false},
      { name: 'uploadtime', title: '上传日期', width: 200, align: 'left', issortable: true, isHTML : true, fixedWidth: false },
      { name: 'fsize', title: '文件大小(Byte)', width: 100, align: 'left', issortable: true, isHTML : true, fixedWidth: false, renderer: function( item ) { return format_size( item['fsize'] ); } },
      { name: 'fmd5', title: 'MD5', width: 200, align: 'left', issortable: true, isHTML : false, fixedWidth: false },
      { name: 'downloads', title: '下载次数', width: 100, align: 'left', issortable: true, isHTML : true, fixedWidth: false }
    ],
    store : new Q.Store({data: []}),
    row_ondblclick : function(row) {
      var record = this.getRecord(row);
      message_box( { title: "文件属性", content: "<input value=\"" + record["fmd5"] + "\"/>"} );
      //if(record && record.id) {
      //  _this.app.service.document_content(record.id, function(r, data) {
      //    _this.app.document_editor(r, data);
      //  });
      //}
    },
  });

  Q.addEvent( this.item( "uploadfile" ), 'change', ( function( thiz, obj, objprogress ) { return function() {
    //window.alert( this.tagName );
    //Q.alert( { title: "error", content:"msgbox" } );
    selfile( obj, objprogress, ( function( t ) {  return function( isok, res ) {
      var res = Q.json_decode( res );
      if( res.header === 0 ) {
        // insert input item
        thiz.add_file( res.data );
      } else if( res.header === -2 ) { // not login
        message_box( { content: "会话无效或者过期，请先登陆.", icon: "q-error", on_ok: function(){
          location.href = "{$cfg:url.userlogin}";
        } } );
      } else {
        message_box( { content: res.data, icon: "error" } );
      }
    } } )( thiz ) );
  } } )( this, this.item( "uploadfile" ), this.item( "uploadfile_progress" ) ), true );

  setTimeout(function() { _this.listctrl.autosize(); }, 300);

  // item template
  this.app.service.attachments_list( 1, 10, function(code, data) {
    if( code != 0 ) {
      return;
    }
    _this.listctrl.appendData( data );
    _this.listctrl.render();
  });

  // upload_url: "/?mod=attachment&action=do-upload-file&inajax=true",

},

on_size: function( w, h ) {
  if( this.listctrl ) {
    //this.listctrl.autosize();
  }
},


on_upload: function() {
  //Q.alert({app:this.app, wstyle: "simpleos", title: "上传文件", content: "请选择文件"});
},

add_file: function( item ) {
  this.listctrl.append( 0, item );
},

dummy : function() {

}



}); // attachments_window end

*/

function message_box( json ) {
  var json = json || {};
  //json.title = json.title;
  json.icon = json.icon || "info";
  json.wstyle = "simpleos q-attr-with-bottom";
  json.content = "<div class=\"q-alert-content q-alert-"+json.icon+"\">"+json.content+"</div>";

  Q.alert( json );
}
