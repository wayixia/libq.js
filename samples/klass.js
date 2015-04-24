
// 创建klass_test类
var klass_test = Q.KLASS();

// 类定义
klass_test.prototype = {
	// 成员变量
	m1 : 1,
	m2 : 2,

	// 构造函数，带两个参数
	_initialize : function(arg1, arg2) {
		var _this = this;
		_this.m1 = arg1;
		_this.m2 = arg2;
	},

	// 实现两个数的相加
	add : function(a, b) {
		return a+b;
	},

	// 弹出提示框
	msgbox : function(str) {
		alert(str);
	},

	// 显示成员变量
	showMembers : function() {
		var _this = this;
		var str = 'members:\n';

		str = 'm1 = ' + _this.m1 + '\n';
		str +='m2 = ' + _this.m2;

		_this.msgbox(str);
	}
};
