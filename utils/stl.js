
/*--------------------------------------------------------------------------------
 $ basic  type list definition
----------------------------------------------------------------------------------*/
//列表节点结构
Q.NODE = Q.extend({
  next : null,
  prev : null,
  data  : null,
  __init__ : function(data) { this.data = data; }
});

Q.LIST = Q.extend({

head : null,  // 链表的头部
length : 0,
__init__ : function() {},
begin :    function() {  return this.head; },  // not head  use as STL
end :      function() {  return null;  },
len :      function() {  return this.length;  },
item :     function() {  return this.current.data; },

each : function(callback) {
  if(typeof callback == 'function') {
    for(var node = this.begin(); node != this.end(); node = node.next) {
      if(!callback(node.data)) break;
    }
  }
},

append : function(data){
  var node = new Q.NODE(data);
  if(!this.head) {
    this.head = node;
  } else {
    var tmp = this.head;
    while(tmp.next) { tmp = tmp.next; }
    tmp.next = node;
    node.prev = tmp;
  }

  this.length++;
},
  
erase : function(data){
  var node = this.find(data);
  if( node ) { 
    if(node != this.head) {
      if(node.prev)
        node.prev.next = node.next;
      if(node.next)
        node.next.prev = node.prev;
    } else {
      this.head = node.next;
      if(node.next) {
        node.next.prev = null;
      }
    }

    delete node;
    this.length--;
  }
},
  
clear : function(){
  for(var node = this.begin(); node != this.end(); node = node.next){
    this.removeNode(node);
  }
},
  
find : function(data){
  for(var node = this.begin(); node != this.end(); node = node.next){
    if( node.data == data )  return node;
  }
  return null;
},
  
toString : function(){
  var i = 0;
  var str = "";
  for(var node = this.begin(); node != this.end(); node = node.next){
    str += "Node["+i+"]: " + node.data + "\n";
    i++;
  }
  return str;
}

});


var STRUCT_HASMAP = Q.extend({
  base : null,
  length : 0,
  dataIndex : 0,
  __init__ : function() {
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
    this.length++;
  },
  
  remove : function(key) {
    //alert('is have')
    if(!this.has(key)) { return; }
    //alert('yes')
    delete this.base[key];
    this.length--;
  },
  
  clear : function() {
    var _this = this;
    _this.each(function(item, key){
      _this.remove(key);
    });
    this.length = 0;
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
});
