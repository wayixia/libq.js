/*--------------------------------------------------------------------------------
 $ 类名：__simpleTreeL
 $ 功能：通用树操作
 $ 日期：2008-10-09 23:47
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
 $ 整理控件代码，集成到QLib库
----------------------------------------------------------------------------------*/


// handle event listen
var BindHandler = function(object, func) {
  return function() {
    return func.apply(object, arguments);
  };
};
 
var BindAsEventHandler = function(object, func) {
  return function(evt) {
    return func.call(object, (evt || window.event));
  };
};

var CurrentStyle = function(element){
  return element.currentStyle || document.defaultView.getComputedStyle(element, null);
};

var TREEITEM_NULL     = -1;  // 不存在的节点
var TREEITEM_NOSELECTED = -2;  // 没有任何节点被选择

var TREEITEM_DRAG_NONE  = 0;
var TREEITEM_DRAG_TOP  = 1;
var TREEITEM_DRAG_CENTER= 2;
var TREEITEM_DRAG_BOTTOM= 3;


function treeNode(idx, parentId, level, isopen, text, isLastChild) {
  this.parent  = parentId;  // 父节点的id
  this.idx  = idx;    // 自身id
    this.level  = level;
  this.isLastChild = (isLastChild);
  this.isopen    = isopen;  // 当前的打开状态
  this.lastChild  = TREEITEM_NULL;  
  this.firstChild = TREEITEM_NULL;
  this.text    = text;    // 显示的文本信息
  this.hwnd    = null;    // 节点区域
  this.subarea  = null;    // 子节点区域
  this.textNode  = null;    // 节点信息
  this.expand     = null;   // 节点折叠控制
}
 

var __InitDragItem = Q.extend(
{
  hwnd : null,
  _fMove : null,
  _fStop : null,
  
  __init__ : function(itemWnd, options) {
    options = options || {};
    this.onMove  = options.onMove  || function(oEvent, hander){};
    this.onStart = options.onStart || function(oEvent, hander){};
    this.onStop  = options.onStop  || function(oEvent, hander){};

    this.hwnd = itemWnd;
    //this._width = TD.offsetWidth;

    //事件对象(用于绑定移除事件)
    this._fMove = BindAsEventHandler(this, this.Move);
    this._fStop = BindAsEventHandler(this, this.Stop);
    Q.addEvent(this.hwnd, "mousedown", BindAsEventHandler(this, this.Start));
    // Q.addEvent(this.hwnd, "mousemove", BindAsEventHandler(this, this.Move));
  },
  
  Start : function(oEvent) {
    oEvent = oEvent || window.event;
    //mousemove时移动 mouseup时停止
    Q.addEvent(document, "mousemove", this._fMove);
    Q.addEvent(document, "mouseup", this._fStop);
    if(document.all){
      //焦点丢失
      Q.addEvent(this.hwnd, "losecapture", this._fStop);
      //设置鼠标捕获
      this.hwnd.setCapture();
      oEvent.cancelBubble = true;
    }else{
      //焦点丢失
      Q.addEvent(window, "blur", this._fStop);
      //阻止默认动作
      oEvent.preventDefault();
    };

    oEvent.cancelBubble = true;

    // extend interface
    this.onStart(oEvent, this);
  },
  
  //拖动
  Move : function(oEvent) {
    oEvent = oEvent || window.event;
    // extend interface
    this.onMove(oEvent, this);
  },
    
  //停止拖动
  Stop : function(oEvent) {
    oEvent = oEvent || window.event;
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
  }
});


var __simpleTreeL = Q.extend(
{
//! hwnd 树的主窗口容器， hwndTree： 树窗口
//! 结构 
//  <div class="simpletree_container simpletree">
//    <ul class=""> 树节点 </ul>
//  </div>
hwnd : null,
hwndTree : null,
hwndAccept : null,
hwndMoveLine : null,

//! 保存树节点映射表
// 
ID2Nodes : null,   
// ItemData2Nodes : null,
selected : TREEITEM_NOSELECTED,
idx : -1,
isdraging : false,
ismoved : false,
dragtype : TREEITEM_DRAG_NONE,
Acceptable : false,
onMoveLineMove_ : null,


// 初始化，构造树
__init__ : function(json) {
  var _this = this;
  json = json || {};
  _this.ID2Nodes = {};
  _this.Acceptable = !!json.Acceptable;
  _this.onItemAccept = json.onItemAccept || function(srcid, targid) {};
  _this.onMoveLineMove_ = Q.bind_handler(this, this.onMoveLineMove);
  _this.onContextMenu = json.onContextMenu || function(nItem, evt) {};
  //! 创建容器
  _this.hwnd = document.createElement('DIV');
  _this.hwndTree = document.createElement('ul');
  _this.hwndMoveLine = document.createElement('fieldset');
  document.body.appendChild(_this.hwndMoveLine);

  var nRootItem = this.createNode(-1, json.Name, !!json.IsOpen);
  var node = this.getItemNode(nRootItem);
  Q.addClass(node.hwnd, "q-root");  
  //! 隐藏根节点的expand
  _this.hwndTree.appendChild(node.hwnd);
  _this.hwnd.appendChild(_this.hwndTree);
        
  _this.hwnd.className = 'q-simpletree';
  _this.hwndMoveLine.className = 'moveline';
  _this.hwndMoveLine.style.display = 'none';
    //! 渲染树
  if(json.Render) { json.Render.appendChild(_this.hwnd); }
  else { alert('invalid render'); }
},

//! 渲染整个树
// json格式：
// {
//  text: "textName"
//  root : "rootValue"
//  key : "keyname", 
//  parentkey: "parentKeyName",
//  data : [{...}]
// }
//
//
render : function(json) {
  this.dorender(0, json, json.root);
},

query : function(json, parentKey, parentValue) {
  var newArr = [];
  var len = json.data.length;
  for(var i=0; i<len; i++) {
    if(json.data[i][parentKey] == parentValue) {
      newArr.push(json.data[i]);
    }
  }
  return newArr;
},

dorender : function(parentTreeItem, json, parentValue) {
  var children = this.query(json, json.parentKey, parentValue);
  var len = children.length;
  for(var i=0; i<len; i++) {
    var item = children[i];
    var n = this.createNode(parentTreeItem, item[json.text],true);
    this.dorender(n, json, item[json.key]);
  }
},
    
getRoot : function() {  return 0; },
  
getSelectedItem : function() {
    if(this.selected == TREEITEM_NOSELECTED) {
        return TREEITEM_NULL;
    }
    return this.selected;
},

setItemSelected : function(nItem) {
  var _this = this;
  var selectedItem = _this.getSelectedItem();
  if(selectedItem == nItem) return;
  
  var node = _this.getItemNode(nItem);
  if(node) {
    node.link.style.background = '#C2CFF1'; 
    _this.selected = nItem; 
  }
  
  var selectedNode = _this.getItemNode(selectedItem);
  if(selectedNode) {
    selectedNode.link.style.background = '';
  }  
},

setItemIcon : function(nItem, iconClassName) {
  var node = this.getItemNode(nItem);
  if(node) {
    node.icon && (node.icon.className = 'icon '+ iconClassName);
  }
},
  
setItemLink : function(nItem, href) {
  var node = this.getItemNode(nItem);
  if(node) {
    node.link && (node.link.href=href);
  }
},

setItemText : function(nItem, text) {
  var node = this.getItemNode(nItem);
  if(node)
    node.textNode.innerText = text;
},
  
getItemText : function(nItem) {
  var node = this.getItemNode(nItem);
  if(node)
      return node.textNode.innerText;
  else
      return '';
},
  
setItemData : function(nItem, data) {
    var _this = this;
    var node = _this.getItemNode(nItem);
    var oldData = node.hwnd.data;
    node.hwnd.data = data;
    // _this.ItemData2Nodes[data] = node;
    return oldData;
},
  
getItemData : function(nItem) {
    var item = this.getItemNode(nItem);
    return item.hwnd.data;
},
  
getItemNode : function(nItem) {
  return this.ID2Nodes[nItem];
},
  
getItemByData : function(data) {

  for(var id in this.ID2Nodes) {
    var node = this.getItemNode(id);
    if(node.hwnd.data == data) {
      return node;
    }
  }

  return null;
},
  
// 获得下一个兄弟节点
getNextItem : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  if(!node) {  return TREEITEM_NULL; }
  var hwnd = node.hwnd.nextSibling;
  if(!hwnd) {  return TREEITEM_NULL; }
  return hwnd.idx;
},

getPrevItem : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  if(!node) {
    return TREEITEM_NULL;  
  }
  var hwnd = node.hwnd.previousSibling ;
  if(!hwnd) {
    return TREEITEM_NULL;
  }
  return hwnd.idx;
},

getParent : function(nItem){
  var node = this.getItemNode(nItem);
  if(!node) { return TREEITEM_NULL; }
  return node.parent;
},

getLastChild : function(nItem) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
  if(Node == null) { return TREEITEM_NULL; }
  return Node.lastChild;
},
  
getFirstChild : function(nItem) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
  if(Node == null) { return TREEITEM_NULL; }
  return Node.firstChild;
},

createNode : function(parentId, text, isopen, isshow) {
  var _this = this;
  //! 
  var isLastChild = true;
  //! id递增
  _this.idx++;
  //! 要创建的树节点
  var node = null;
  //! 节点 id
  var id = _this.idx;
  //! 父节点
  var parentNode = _this.getItemNode(parentId);
  //! 层次
  var level = 0;
  
  if(parentNode) {
    level = parentNode.level+1;
    parentNode.expand.expandable = true;
    //! 子节点
    // 追加在末尾节点的时候， 首先将末尾节点转换成非末尾节点，在将parentNode的lastChild指向新创建的节点
    var lastChildNode = _this.getItemNode(parentNode.lastChild);
    if(lastChildNode) {
      lastChildNode.isLastChild = false;
      if(lastChildNode.expand.expandable) {
        if(lastChildNode.subarea.style.display=='') {
          lastChildNode.expand.className = 'expand expand_on';
        } else {
          lastChildNode.expand.className = 'expand expand_off';
        }
      } else {
        lastChildNode.expand.className = 'expand child';
      }
      //exchangeClassName(,'last_child','child');
    }
    if(parentNode.firstChild == TREEITEM_NULL) {
      parentNode.firstChild = id;
            
      var className = 'expand_';
      if(parentNode.isLastChild) {
        className = 'last_expand_';
      }
      if(parentNode.subarea.style.display == '') {
        className += 'on';
      } else {
        className += 'off';
      }
      //alert(parentNode.expand.className);  
      parentNode.expand.className = 'expand '+className;
    }
    parentNode.lastChild = id;
  }

  node = new treeNode(id, parentId, level, isopen, text, isLastChild);
  _this.ID2Nodes[id]=node;
    
  node.hwnd   = document.createElement('li');
  node.hwnd.idx = id;
  node.expand = document.createElement("DIV");
  node.link = document.createElement("A");
  node.icon = document.createElement("SPAN");
  node.textNode = document.createElement("SPAN");
  node.subarea = document.createElement("ul");
  node.expand.expandable = false;
    
  node.hwnd.className = 'q-tree-item';
  node.expand.className = 'expand last_child';
  node.expand.style.left = ((level)*20)+'px';
  node.link.style.paddingLeft = ((level)*20+25) + 'px';
    
  //! link style
  node.icon.className = 'icon default';
  node.textNode.className = 'textNode';
  node.subarea.className = '';    // line
    
  node.textNode.innerText = node.text;  // + '-' + id;
  node.textNode.href = '#';
  node.textNode.idx = id;
   node.link.idx = id;

  /*
   new __InitDragItem(node.link, {
    'onStart': function(evt, handler) { _this.onStart(evt, handler); },
    'onMove':  function(evt, handler) { _this.onMove(evt, handler); },
    'onStop':  function(evt, handler) { _this.onStop(evt, handler); }
  });
  */
  node.link.onclick = function() {
    _this.itemClick(this.idx);
    _this.setItemSelected(this.idx);
  };

  node.link.oncontextmenu = function(evt) {
      // this.fireEvent('onclick');
      _this.itemClick(this.idx);
      _this.setItemSelected(this.idx);
      _this.onContextMenu(this.idx, evt);
      return false;
  };
  node.link.onselectstart = function(){ return false;};
  node.link.ondblclick=function(){
      _this.itemDblClick(this.idx);
    return false; 
  };
    
  node.expand.onclick = function() {
    _this.expandClick(_this.idx);
    var className = '';
    if(node.isLastChild) { className = 'last_'; }
    if(this.expandable) {
      className += 'expand_';
      if(node.subarea.style.display=='none') {
        node.subarea.style.display='';
        className += 'on';
      } else {
        node.subarea.style.display='none';
        className += 'off';
      }
      this.className = 'expand ' + className;
    }
  };
        
  node.link.appendChild(node.icon);
  node.link.appendChild(node.textNode);
  node.hwnd.appendChild(node.expand);
  node.hwnd.appendChild(node.link);
  node.hwnd.appendChild(node.subarea);
  
  if(parentNode) {
    parentNode.subarea.appendChild(node.hwnd);
  } else {
    _this.hwndTree.appendChild(node.hwnd);
  }
    
  return id;    
},

expand : function(nItem, toTop) {},
  
remove : function(nItem) {
  var _this = this;
  var node = _this.getItemNode(nItem);
  var parentNode = _this.getItemNode(node.parent);
  
  // 节点不存在
  if((!node) ||(!parentNode)) { return null; }

  var firstChild = parentNode.firstChild;
  var lastChild = parentNode.lastChild;
  
  if(firstChild == lastChild) {
    // 只有一个子节点
    parentNode.expand.expandable = false;
    parentNode.firstChild = TREEITEM_NULL;
    parentNode.lastChild = TREEITEM_NULL;
  } else {
    if(firstChild == nItem) {
      // 删除的是第一个节点
      var nextItem = _this.getNextItem(nItem);
      var nextNode = _this.getItemNode(nextItem);
      parentNode.firstChild = nextItem;
      _this.MeasureNodeExpand(nextNode);
    } else if(lastChild == nItem){
      // 删除的是最后一个节点
      var prevItem = _this.getPrevItem(nItem);
      var prevNode = _this.getItemNode(prevItem);
      parentNode.lastChild = prevItem;
      prevNode.isLastChild = true;
      _this.MeasureNodeExpand(prevNode);
    }
  }
  _this.MeasureNodeExpand(parentNode);    
  node.hwnd.parentNode.removeChild(node.hwnd);
  //delete _this.ID2Nodes[nItem];

  return node;
},


// 将已存在的节点移动到指定的父节点上
appendChild : function(nNewItem, nParentItem) {
  var _this = this;
  var parentNode = _this.getItemNode(nParentItem);
    var node = _this.getItemNode(nNewItem);
  if(!parentNode) { return false; }

    // 检测nParentItem不能为nNewItem的子节点的子节点，
    // 不允许将自己插入自己的子节点
    var pItem = nParentItem;
    while(pItem != TREEITEM_NULL) {
        if(nNewItem == pItem) {
            return false;
        }
        pItem = _this.getParent(pItem);
    }
    
  var removeNode = _this.remove(nNewItem);
  node.level = parentNode.level+1;
  node.parent = nParentItem;
  parentNode.expand.expandable = true;

  // 无子节点
    if(parentNode.firstChild == TREEITEM_NULL) {
    parentNode.firstChild = nNewItem;
  } else {
    //! 存在子节点， 将最后一个节点设置为非子节点
    var lastChild = _this.getLastChild(nParentItem); 
    if(lastChild != TREEITEM_NULL) {
      var lastChildNode = _this.getItemNode(lastChild);
      lastChildNode.isLastChild = false;
      _this.MeasureNodeExpand(lastChildNode);
    }
  }
  
  node.isLastChild = true;
  parentNode.lastChild = nNewItem;
  // 自动设置节点的样式
  _this.MeasureNodeExpand(parentNode);
  _this.MeasureNodeExpand(node);

  // 插入nNewItem DOM操作
    var subarea = parentNode.subarea;
  subarea.appendChild(removeNode.hwnd);
  node.expand.style.left = ((node.level-1)*20)+'px';
  node.link.style.paddingLeft = ((node.level-1)*20+25) + 'px';
  _this.updateItemIntent(nNewItem);

},

traverseNode : function(nItem, lpCallBack) {
  var node = this.getItemNode(nItem);
  for(var i=0; i < node.subarea.childNodes.length; i++) {
    if(lpCallBack) {
      if(!lpCallBack(node.subarea.childNodes[i].idx, lpCallBack)) {
        return false;
      }
    }
    if(!this.traverseNode(node.subarea.childNodes[i].idx, lpCallBack)) {
      return false;
    }
  }
  return true;
},

MeasureNodeExpand : function(Node) {
  // 插入nNewItem DOM操作
  var className = 'expand ';
  if(Node.isLastChild) { className += 'last_'; }
  if(Node.firstChild != TREEITEM_NULL) {
    // 存在子节点
    className += 'expand_';
    className += (Node.subarea.style.display == '') ? 'on':'off';
  } else {
    // 叶节点
    className += 'child';
  }

  Node.expand.className = className;
},

insertBefore : function(nNewItem, nItem) {
    this.insertItem(nNewItem, nItem, false);
},


insertAfter : function(nNewItem, nItem) {
    this.insertItem(nNewItem, nItem, true);
},

insertItem : function(nNewItem, nItem, isAfter) {
  var _this = this;
  var Node = _this.getItemNode(nItem);
    var NewNode = _this.getItemNode(nNewItem);
  var ParentNode = _this.getItemNode(Node.parent);
  if( (!Node) || (!NewNode) ||(!ParentNode) ) { return false; }

  var removeNode = _this.remove(nNewItem);
  NewNode.level = Node.level;
  NewNode.parent = Node.parent;
  
  if(isAfter) {
    // 节点后插入
    if(Node.isLastChild) {
      Node.isLastChild = false;
      NewNode.isLastChild = true;
      ParentNode.lastChild = nNewItem;
    } else {
      NewNode.isLastChild = false;
    }
  } else {
    // 节点前插入
    if(ParentNode.firstChild == nItem) {
      ParentNode.firstChild = nNewItem;
    }
    NewNode.isLastChild = false;
  }

  // 自动设置节点的样式
  _this.MeasureNodeExpand(Node);
  _this.MeasureNodeExpand(NewNode);

  // 插入nNewItem DOM操作
    var subarea = ParentNode.subarea;
  if(isAfter) {
    if(subarea.lastChild == Node.hwnd) {
      subarea.appendChild(removeNode.hwnd);
    } else {
      subarea.insertBefore(removeNode.hwnd, Node.hwnd.nextSibling);
    }
  } else {
    subarea.insertBefore(removeNode.hwnd, Node.hwnd);
  }
  NewNode.expand.style.left = ((NewNode.level-1)*20)+'px';
  NewNode.link.style.paddingLeft = ((NewNode.level-1)*20+25) + 'px';

  _this.updateItemIntent(nNewItem);
  
},

// 设置子节点intent
updateItemIntent : function(nNewItem) {
  var _this = this;
  
  _this.traverseNode(nNewItem, function(n) {
    var childNode = _this.getItemNode(n);
    var pNode = _this.getItemNode(_this.getParent(n));
    childNode.level = pNode.level + 1;
    childNode.expand.style.left = ((childNode.level-1)*20)+'px';
    childNode.link.style.paddingLeft = ((childNode.level-1)*20+25) + 'px';
    return true;
  });
},

removeChildren : function(nItem) {
  var _this = this;
  var nChildItem = _this.getFirstChild(nItem);
  while(nChildItem>0) {
    _this.removeChildren(nChildItem);
    var tChildItem = nChildItem;
    nChildItem = _this.getNextItem(nChildItem);
    _this.remove(tChildItem);
  }
},

onExpand : function() {},

// events
onStart : function(evt, handler) {
  var _this = this;
    if(evt.button == 2 || evt.button == 3) {
        return;
    } 
  if(!_this.Acceptable) { return; }
  _this.ismoved = false;
  _this.isdraging = true;
  _this.hwndMoveLine.style.width = (_this.hwnd.offsetWidth-4)+'px';
  var p = Q.absPosition(_this.hwnd);
  _this.hwndMoveLine.style.left = p.left + 'px';
  _this.onMove(evt, handler);
  _this.hwndMoveLine.style.display == 'none';
  Q.addEvent(_this.hwndMoveLine, 'mousemove', _this.onMoveLineMove_);  
  // Q.$('header_title').innerText = this.isdraging;
},

onMove : function(evt, handler) {
    var _this = this;
    if(evt.button == 2 || evt.button == 3) {
        return;
    } 
  
  if(!_this.Acceptable) { return; }

  if(!_this.ismoved) {
    _this.ismoved = true;
  }

  evt = evt || window.event;
  // Q.$('header_title').innerText = _this.isdraging;

  if(_this.isdraging) {
    var bInvalidTreeItem = false;
    var parent = evt.srcElement;
    var objA = null;

    while(parent && (parent != document.body)) {
      if(parent.nodeType==1 && (parent.nodeName+'').toLowerCase() == 'a') {
        objA = parent;
      } else if(parent == _this.hwnd) {
        bInvalidTreeItem = true;
        break;
      }

      parent = parent.parentNode;
    }

    // 有效的树节点
    if(bInvalidTreeItem) {
      if(objA) {
        {
          var pa = _this.getParent(objA.idx);
          while(pa != TREEITEM_NULL ) {
            if(pa == handler.hwnd.idx) {
              _this.hwndMoveLine.style.display = 'none';
              _this.hwndAccept = null;
              return;
            }
            pa = _this.getParent(pa);
          }
        }

        // 检测位置
        var pos = Q.absPosition(objA);

        if((evt.clientY >= pos.top)
          && (evt.clientY < (pos.top + (objA.offsetHeight/2) - 2))
        ) {
          // TOP
          _this.dragtype = TREEITEM_DRAG_TOP;
          _this.hwndMoveLine.style.borderWidth = '1px';
          _this.hwndMoveLine.style.height = '1px';
          _this.hwndMoveLine.style.top = (pos.top-1) + 'px';
          if(_this.ismoved) {
            _this.hwndMoveLine.style.display = '';
          }
          
          return;
        
        }  else if( (evt.clientY >= (pos.top + (objA.offsetHeight/2) - 3))
          &&  (evt.clientY <= (pos.top + (objA.offsetHeight/2) + 3)) ) {
          // CENTER
          if(objA != handler.hwnd)  {

            // if(_this.hwndAccept != objA) {
              _this.hwndMoveLine.style.top = pos.top + 'px';
              _this.hwndMoveLine.style.borderWidth = '2px';
              _this.hwndMoveLine.style.height = (objA.offsetHeight-4)+'px';
              
              _this.hwndAccept = objA;
              _this.dragtype = TREEITEM_DRAG_CENTER;
            // }
            return ;
          }
          
        } else if( (evt.clientY <= (pos.top + objA.offsetHeight))
          && (evt.clientY >= (pos.top + (objA.offsetHeight/2) + 3)) ){
          // Bottom
          _this.dragtype = TREEITEM_DRAG_BOTTOM;
          _this.hwndMoveLine.style.borderWidth = '1px';
          _this.hwndMoveLine.style.height = '1px';
          _this.hwndMoveLine.style.top = (pos.top-1+objA.offsetHeight) + 'px';
          // Q.$('header_title').innerText = 'top ' +pos.top + '; height:' + objA.offsetHeight + '; clientY : ' + evt.clientY;
          if(_this.ismoved) {
            _this.hwndMoveLine.style.display = '';
          }
          return;
        }  
      }
      _this.hwndAccept = null;
    }
  } 
},

onStop : function(evt, handler) {
    
  var _this = this;
  if(!_this.Acceptable) { return; }
  
  _this.isdraging = false;
  _this.ismoved = false;
  this.hwndMoveLine.style.display = 'none';
  Q.removeEvent(_this.hwndMoveLine, 'mousemove', _this.onMoveLineMove_);
  if(_this.hwndAccept) {
    if(_this.hwndAccept != handler.hwnd) {
      _this.onAccept(handler.hwnd.idx, _this.hwndAccept.idx);
    }
    _this.hwndAccept = null;
  }
  _this.dragtype = TREEITEM_DRAG_NONE;

},

onMoveLineMove : function(evt) {
  var _this = this;
  if(!_this.Acceptable) { return; }
  evt = evt || window.event;
  var pos = Q.absPosition(_this.hwndMoveLine);
  if( (evt.clientY >= (pos.top + (_this.hwndMoveLine.offsetHeight/2) - 3))
    &&  (evt.clientY <= (pos.top + (_this.hwndMoveLine.offsetHeight/2) + 3)) ) {
    
  } else {
    _this.hwndMoveLine.style.borderWidth='1px';
    _this.hwndMoveLine.style.height='1px';
    //_this.hwndMoveLine.style.display = 'none';
  }
},

onAccept : function(srcid, targetid){
  var _this = this;
  if(!_this.Acceptable) { return; }
  _this.onItemAccept(srcid, targetid, _this.dragtype);
},

// virtual function to be overrided
itemClick : function(nItem) {},
expandClick : function(nItem) {},
itemDblClick : function(nItem) {},
onNodeDelete : function(nItem) {},
onItemAccept : function(srcid, targetid, dragtype) {}

});
