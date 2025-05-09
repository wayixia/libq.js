/*--------------------------------------------------------------------
 $ module: viewloader2 for libq.js
 $ date:   2022-01-15 21:23:28
 $ author: Q
 $ last modified: 2025-04-08 22:06:58
 $ copyright www.wayixia.com
----------------------------------------------------------------------*/

const cheerio = require('cheerio');


module.exports = function (src) {
  //src = src.replace( /\"/g, "\\\"");
  //src = src.replace( /\s$/g, '');
  //src = src.replace(/\r|\n/g,"");

  const $ = cheerio.load(src);
  //console.log($);
  //console.log( $('template').html() );
  //console.log( $('script').html() );

  if($('template').html()) {
    tpl = $('template').html()
          .replace(/'/g, '\\\'')
          .replace(/\r|\n/g,"");
  } else {
    tpl = "";
  }

  script = 'function( args ) {\
      var cls=' + $('script').html()+';\
      var template=\''+ tpl +'\'; \
      var o=null; \
      if( args.renderer ) { \
        var o = new cls(args);\
        if( o.isTag && o.isTag() ) { \
          /*  tag is not support template */ \
        } else { \
          args.app.render_template(o, args.renderer, template);\
        }\
        o.onload(); \
      } else {\
        args.content=template; \
        o = new cls(args);\
      }\
      return o;\
  }';

  //console.log( script );
  return "module.exports="+script;
}