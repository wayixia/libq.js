/**
 * 常用的数据结构封装， 双向链表和哈希表
 */


/**
 * 双向链表
 * @constructor 
 * @property {Q.List.Node} head -  链表的头部
 * @property {number} length -  链表长度
 */
Q.List = Q.extend({
head : null,  
length : 0,
__init__ : function() {},
/**
 * 节点结构
 * @class Q.List.Node
 * @property {Q.List.Node} next - 下一个节点
 * @property {Q.List.Node} prev - 上一个节点
 * @property {any} next  - 绑定的数据
 * @param data {any} - 绑定的数据
 */
Node : function(data) {
  this.next = null;
  this.prev = null;
  this.data = data;
},

/** 
 * 获取链表开始节点 
 * @memberof Q.List.prototype
 * @type {Q.List.Node}
 * @return {Q.List.Node} - head节点， 如果为null，则说明链表为空
 */
begin : function() {  
  return this.head; 
}, 

/** 
 * 获取链表结尾节点， 返回默认null 
 * @memberof Q.List.prototype
 * @return {null} 总是返回空节点
 */
end : function() {  
  return null;  
},

/** 
 * 返回链表长度 
 * @memberof Q.List.prototype
 * @type {number}
 * @return {number}  链表长度 
 */
len : function() {
  return this.length;
},

/**
 * 获取当前遍历位置的节点数据
 * @memberof Q.List.prototype
 */
item : function() {
  return this.current.data; 
},

/**
 * 遍历链表元素回调函数
 * @callback fn_list_each
 * @param data {any} - 节点的data
 * @return {bool} 返回结果决定是否继续遍历: true 继续遍历,  false 停止遍历
 */

/** 
 * 遍历链表元素
 * @memberof Q.List.prototype
 * @param fn {fn_list_each} - 回调函数
 */
each : function(fn) {
  if(typeof fn == 'function') {
    for(var node = this.begin(); node != this.end(); node = node.next) {
      if(!fn(node.data)) break;
    }
  }
},

/**
 * 在链表末尾追加一个{@link Q.List.Node}节点
 * @memberof Q.List.prototype
 * @param data {any} - 绑定的数据
 */
append : function(data) {
  var node = new this.Node(data);
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

/**
 * 删除链表的一个节点
 * @memberof Q.List.prototype
 * @param data {any} - 指定的数据
 */
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

/**
 * 清空链表
 * @memberof Q.List.prototype
 */
clear : function(){
  for(var node = this.begin(); node != this.end(); node = node.next){
    this.removeNode(node);
  }
},

/**
 * 查找data所在的节点
 * @type {Q.List.Node}
 * @memberof Q.List.prototype
 * @param data {any} - 指定查询的数据
 * @return {Q.List.Node} 节点不存在则返回null
 */
find : function(data){
  for(var node = this.begin(); node != this.end(); node = node.next){
    if( node.data == data )  return node;
  }
  return null;
}
  
});

/**
 * 哈希表类封装，提供添加删除遍历查找等操作
 * @constructor
 * @property base {Object} - 存储对象
 * @property length {number} - 元素个数
 * @property dataIndex {number} - 数据项索引, 初始值 0
 */
Q.HashMap = Q.extend({
base : null,
length : 0,
index : 0,
__init__ : function() {
  this.base = new Object();
},
  
/**
 * 遍历哈希表元素回调函数
 * @callback fn_HashMap_each
 * @param data {any} - 节点的data
 * @param key  {any} - 节点索引关键字
 * @return {bool} 返回结果决定是否继续遍历: true 继续遍历,  false 停止遍历
 */

/** 
 * 遍历哈希表元素
 * @memberof Q.HashMap.prototype
 * @param fn {fn_HashMap_each} - 回调函数
 */
each : function(fn) {
  if(typeof fn != 'function') 
    return;
  for(var key in this.base) {
    if(fn(this.base[key], key) == 0) 
      break;
  }
},

/**
 * 获取指定索引的对象
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @return {any} 返回指定索引项的值
 */
item : function(index) {
  return this.base[index];
},

/**
 * 添加项
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @param value {any} 值
 * @return 无
 */
add : function(index, value) {
  this.base[index] = value;
  this.length++;
},
 
/**
 * 删除指定索引项
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 */
remove : function(key) {
  if(!this.has(key)) { return; }
  delete this.base[key];
  this.length--;
},

/**
 * 清空哈希表
 * @memberof Q.HashMap.prototype
 */
clear : function() {
  var _this = this;
  this.each(function(item, key){
    _this.remove(key);
  });
  this.length = 0;
},
  
/**
 * 添加项，自动索引
 * @memberof Q.HashMap.prototype
 * @param value {any} 数据
 */
push : function(value) {
  this.base[this.index] = value;
  this.length++;
  this.index++;
},
  
/**
 * 删除最后一个数字索引项
 * @memberof Q.HashMap.prototype
 */
pop : function() {
  var re = this.base[this.dataIndex];
  delete this.base[this.dataIndex];
  this.length--;
  return re;
},
  
/**
 * 查找value对应的索引
 * @memberof Q.HashMap.prototype
 * @param value {value} 值
 * @return {number|string} 索引
 */
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
  
/**
 * 查找索引项是否存在
 * @memberof Q.HashMap.prototype
 * @param index {number|string} 索引
 * @return {bool} 该项是否存在
 */
has : function(key) {
  return !(typeof this.base[key] === 'undefined');
}
});
