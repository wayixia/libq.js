/*--------------------------------------------------------------------
 $ module: pageloader2 for libq.js
 $ date:   2025-01-15 21:23:28
 $ author: Q
 $ last modified: 2025-03-27 22:06:58
 $ copyright www.wayixia.com
----------------------------------------------------------------------*/

const cheerio = require('cheerio');


module.exports = function (src) {
  //src = src.replace( /\"/g, "\\\"");
  //src = src.replace( /\s$/g, '');
  //src = src.replace(/\r|\n/g,"");
  if(1) {
    const $ = cheerio.load(src);
    //console.log($);
    //console.log( $('template').html() );
    //console.log( $('script').html() );
    tpl = $('template').html();
    tpl = tpl.replace(/'/g, '\\\'').replace(/\r|\n/g,"");

    script = 'function( args ) {\
      args.renderer.innerHTML=\''+ tpl +'\';\
      var cls=' + $('script').html() + ';\
      var o = new cls(args);\
      window.process_tags( args.renderer, o); \
      if( o.onload && o.onload instanceof Function ) {\
        o.onload();\
      } \
      return o; \
    }';

    //console.log( script );
    return "module.exports="+script;
    //return "exports = "+script;
  } else {
    src = src.replace(/\r|\n/g,"");
    return "module.exports = \""+src+"\"";
  }
}