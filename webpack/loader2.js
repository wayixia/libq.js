


// loader2，大写
module.exports = function (src) {
  //src = src.charAt(0).toUpperCase() + src.slice(1)
  // 这里为什么要这么写？因为直接返回转换后的字符串会报语法错误，
  // 这么写import后转换成可以使用的字符串
  src = src.replace( /\"/g, "\\\"");
  //src = src.replace( /\s$/g, '');
  src = src.replace(/\r|\n/g,"");
  console.log( src );
  return "module.exports = \""+src+"\"";
 }