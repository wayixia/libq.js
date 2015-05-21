
/**
 * 生成指定len长度的随机字符串
 * @function
 * @param len {number} - 随机串的长度
 * @return {string} 随机串
 */
Q.rnd = function(len) {
  var str = '';
  var roundArray = 'abcdef1234567890'.split('');
  for(var i=0; i < len; i++) {
    str += '' + roundArray[Math.round( Math.random()* (roundArray.length - 1))];
  }
  return str;
}

/**
 * json2.js 版本的json序列化
 * 将object转成json字符串
 * @function
 * @param jsonObject {object} json对象
 * @return {string} json字符串
 */
Q.json2str = function (jsonObject) {
  return JSON.stringify(jsonObject, function(key, value){return value;});
}

/**
 * 解析json字符串，返回object对象
 * @function
 * @param message {string} json字符串
 * @return {object} javascript 对象
 */
Q.json_decode = function(message) {
  return JSON.parse(message);
}

/**
 * 将json转换成字符串
 * @function
 * @param message {object} javascript对象
 * @return {string} javascript 对象
 */
Q.json_encode = function(v) {
  return JSON.stringify(v);
}

function createAjaxTrans() {
  var transport = null;
  try  {
    transport = new ActiveXObject("Msxml2.XMLHTTP");
  } catch(e){
    try {
      transport = new ActiveXObject("Microsoft.XMLHTTP");
    } catch(sc) {
      transport = null;
    }
  }
  if( !transport && typeof XMLHttpRequest != "undefined" ) {
    transport = new XMLHttpRequest();
  }
    
  return transport;
}

/** ajax请求回调类型
 *
 * @callback ajax_callback
 * @param {Object} xmlhttp - XMLHttpRequest对象
 */

/** ajax请求
 * @function
 * @param {Object} json ajax请求参数
 * @param {string} json.command - 请求url
 * @param {string} [json.method="get"] - ajax请求方法
 * @param {bool}   [json.async=true] - 异步ajax请求
 * @param {*=} json.data - 请求的数据
 * @param {ajax_callback=} json.oncompete - ajax请求完成时的回调
 * @param {ajax_callback=} json.onerror - ajax请求完成时的回调
 * @param {bool=} [json.withCredentials=false] - ajax跨域凭证， 默认false
 */
Q.ajax = function(json) {
  var request = json || {};
  var command = request.command.toString();
  if(command.indexOf('?') == -1) {
    command = command + '?' + '&rnd=' + Q.rnd(16);
  } else {
    command = command + '&rnd=' + Q.rnd(16);
  }

  var method = request.method || "POST";
  method = method.toString().toUpperCase();
  if(method == "GET" || method == "POST") {

  } else {
    method = "GET"
  }

  var xmlhttp = createAjaxTrans();
  var async = true;
  if(request.async) {
    async = !! request.async;
  }

  //var postdata = encodeURIComponent(encodeURIComponent(request.toString())); 
  xmlhttp.open(method, command, async);
  if(request.withCredentials) {
    xmlhttp.withCredentials = !! request.withCredentials;
  }
  xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  //xmlhttp.setRequestHeader( "Content-Type", "text/html;charset=UTF-8" );
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState == 4) {
      if(xmlhttp.status == 200) {
        request.oncomplete &&request.oncomplete(xmlhttp);
      } else {
        request.onerror && request.onerror(xmlhttp);
      }
    }
  };

  var postdata = null;
  if(request.data) {
    postdata = encodeURIComponent(encodeURIComponent(request.toString())); 
  }
  xmlhttp.send(postdata);
}
