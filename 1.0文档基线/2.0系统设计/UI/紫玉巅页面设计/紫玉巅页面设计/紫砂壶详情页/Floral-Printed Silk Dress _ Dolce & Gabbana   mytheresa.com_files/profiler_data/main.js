/*! profiling-script - version 4.8.0 build at 2015-08-10 */!function(a,b){function c(a,b){try{if("function"!=typeof a)return a;if(!a.bugsnag){var c=e();a.bugsnag=function(d){if(b&&b.eventHandler&&(u=d),v=c,!y){var e=a.apply(this,arguments);return v=null,e}try{return a.apply(this,arguments)}catch(f){throw l("autoNotify",!0)&&(x.notifyException(f,null,null,"error"),s()),f}finally{v=null}},a.bugsnag.bugsnag=a.bugsnag}return a.bugsnag}catch(d){return a}}function d(){B=!1}function e(){var a=document.currentScript||v;if(!a&&B){var b=document.scripts||document.getElementsByTagName("script");a=b[b.length-1]}return a}function f(a){var b=e();b&&(a.script={src:b.src,content:l("inlineScript",!0)?b.innerHTML:""})}function g(b){var c=a.console;void 0!==c&&void 0!==c.log&&c.log("[Bugsnag] "+b)}function h(b,c,d){if(d>=5)return encodeURIComponent(c)+"=[RECURSIVE]";d=d+1||1;try{if(a.Node&&b instanceof a.Node)return encodeURIComponent(c)+"="+encodeURIComponent(r(b));var e=[];for(var f in b)if(b.hasOwnProperty(f)&&null!=f&&null!=b[f]){var g=c?c+"["+f+"]":f,i=b[f];e.push("object"==typeof i?h(i,g,d):encodeURIComponent(g)+"="+encodeURIComponent(i))}return e.join("&")}catch(j){return encodeURIComponent(c)+"="+encodeURIComponent(""+j)}}function i(a,b){if(null==b)return a;a=a||{};for(var c in b)if(b.hasOwnProperty(c))try{b[c].constructor===Object?a[c]=i(a[c],b[c]):a[c]=b[c]}catch(d){a[c]=b[c]}return a}function j(a,b){if(a+="?"+h(b)+"&ct=img&cb="+(new Date).getTime(),"undefined"!=typeof BUGSNAG_TESTING&&x.testRequest)x.testRequest(a,b);else{var c=new Image;c.src=a}}function k(a){for(var b={},c=/^data\-([\w\-]+)$/,d=a.attributes,e=0;e<d.length;e++){var f=d[e];if(c.test(f.nodeName)){var g=f.nodeName.match(c)[1];b[g]=f.value||f.nodeValue}}return b}function l(a,b){C=C||k(J);var c=void 0!==x[a]?x[a]:C[a.toLowerCase()];return"false"===c&&(c=!1),void 0!==c?c:b}function m(a){return null!=a&&a.match(D)?!0:(g("Invalid API key '"+a+"'"),!1)}function n(b,c){var d=l("apiKey");if(m(d)&&A){A-=1;var e=l("releaseStage"),f=l("notifyReleaseStages");if(f){for(var h=!1,k=0;k<f.length;k++)if(e===f[k]){h=!0;break}if(!h)return}var n=[b.name,b.message,b.stacktrace].join("|");if(n!==w){w=n,u&&(c=c||{},c["Last Event"]=q(u));var o={notifierVersion:H,apiKey:d,projectRoot:l("projectRoot")||a.location.protocol+"//"+a.location.host,context:l("context")||a.location.pathname,userId:l("userId"),user:l("user"),metaData:i(i({},l("metaData")),c),releaseStage:e,appVersion:l("appVersion"),url:a.location.href,userAgent:navigator.userAgent,language:navigator.language||navigator.userLanguage,severity:b.severity,name:b.name,message:b.message,stacktrace:b.stacktrace,file:b.file,lineNumber:b.lineNumber,columnNumber:b.columnNumber,payloadVersion:"2"},p=x.beforeNotify;if("function"==typeof p){var r=p(o,o.metaData);if(r===!1)return}return 0===o.lineNumber&&/Script error\.?/.test(o.message)?g("Ignoring cross-domain script error. See https://bugsnag.com/docs/notifiers/js/cors"):void j(l("endpoint")||G,o)}}}function o(){var a,b,c=10,d="[anonymous]";try{throw new Error("")}catch(e){a="<generated>\n",b=p(e)}if(!b){a="<generated-ie>\n";var f=[];try{for(var h=arguments.callee.caller.caller;h&&f.length<c;){var i=E.test(h.toString())?RegExp.$1||d:d;f.push(i),h=h.caller}}catch(j){g(j)}b=f.join("\n")}return a+b}function p(a){return a.stack||a.backtrace||a.stacktrace}function q(a){var b={millisecondsAgo:new Date-a.timeStamp,type:a.type,which:a.which,target:r(a.target)};return b}function r(a){if(a){var b=a.attributes;if(b){for(var c="<"+a.nodeName.toLowerCase(),d=0;d<b.length;d++)b[d].value&&"null"!=b[d].value.toString()&&(c+=" "+b[d].name+'="'+b[d].value+'"');return c+">"}return a.nodeName}}function s(){z+=1,a.setTimeout(function(){z-=1})}function t(b,c,d){var e=b[c],f=d(e);b[c]=f,"undefined"!=typeof BUGSNAG_TESTING&&a.undo&&a.undo.push(function(){b[c]=e})}var u,v,w,x={},y=!0,z=0,A=10;x.noConflict=function(){return a.Bugsnag=b,x},x.refresh=function(){A=10},x.notifyException=function(a,b,c,d){b&&"string"!=typeof b&&(c=b,b=void 0),c||(c={}),f(c),n({name:b||a.name,message:a.message||a.description,stacktrace:p(a)||o(),file:a.fileName||a.sourceURL,lineNumber:a.lineNumber||a.line,columnNumber:a.columnNumber?a.columnNumber+1:void 0,severity:d||"warning"},c)},x.notify=function(b,c,d,e){n({name:b,message:c,stacktrace:o(),file:a.location.toString(),lineNumber:1,severity:e||"warning"},d)};var B="complete"!==document.readyState;document.addEventListener?(document.addEventListener("DOMContentLoaded",d,!0),a.addEventListener("load",d,!0)):a.attachEvent("onload",d);var C,D=/^[0-9a-f]{32}$/i,E=/function\s*([\w\-$]+)?\s*\(/i,F="https://notify.bugsnag.com/",G=F+"js",H="2.4.6",I=document.getElementsByTagName("script"),J=I[I.length-1];if(a.atob){if(a.ErrorEvent)try{0===new a.ErrorEvent("test").colno&&(y=!1)}catch(K){}}else y=!1;if(l("autoNotify",!0)){t(a,"onerror",function(b){return"undefined"!=typeof BUGSNAG_TESTING&&(x._onerror=b),function(c,d,e,g,h){var i=l("autoNotify",!0),j={};!g&&a.event&&(g=a.event.errorCharacter),f(j),v=null,i&&!z&&n({name:h&&h.name||"window.onerror",message:c,file:d,lineNumber:e,columnNumber:g,stacktrace:h&&p(h)||o(),severity:"error"},j),"undefined"!=typeof BUGSNAG_TESTING&&(b=x._onerror),b&&b(c,d,e,g,h)}});var L=function(a){return function(b,d){if("function"==typeof b){b=c(b);var e=Array.prototype.slice.call(arguments,2);return a(function(){b.apply(this,e)},d)}return a(b,d)}};t(a,"setTimeout",L),t(a,"setInterval",L),a.requestAnimationFrame&&t(a,"requestAnimationFrame",function(a){return function(b){return a(c(b))}}),a.setImmediate&&t(a,"setImmediate",function(a){return function(b){var d=Array.prototype.slice.call(arguments);return d[0]=c(d[0]),a.apply(this,d)}}),"EventTarget Window Node ApplicationCache AudioTrackList ChannelMergerNode CryptoOperation EventSource FileReader HTMLUnknownElement IDBDatabase IDBRequest IDBTransaction KeyOperation MediaController MessagePort ModalWindow Notification SVGElementInstance Screen TextTrack TextTrackCue TextTrackList WebSocket WebSocketWorker Worker XMLHttpRequest XMLHttpRequestEventTarget XMLHttpRequestUpload".replace(/\w+/g,function(b){var d=a[b]&&a[b].prototype;d&&d.hasOwnProperty&&d.hasOwnProperty("addEventListener")&&(t(d,"addEventListener",function(a){return function(b,d,e,f){return d&&d.handleEvent&&(d.handleEvent=c(d.handleEvent,{eventHandler:!0})),a.call(this,b,c(d,{eventHandler:!0}),e,f)}}),t(d,"removeEventListener",function(a){return function(b,d,e,f){return a.call(this,b,d,e,f),a.call(this,b,c(d),e,f)}}))})}a.Bugsnag=x,"function"==typeof define&&define.amd?define([],function(){return x}):"object"==typeof module&&"object"==typeof module.exports&&(module.exports=x)}(window,window.Bugsnag);var XCM=function(){var a=function(){function a(a){var b,c,d="";for(a=(""+a).replace(/\r\n/g,"\n"),b=0;b<a.length;b++)c=a.charCodeAt(b),128>c?d+=String.fromCharCode(c):c>127&&2048>c?(d+=String.fromCharCode(c>>6|192),d+=String.fromCharCode(63&c|128)):(d+=String.fromCharCode(c>>12|224),d+=String.fromCharCode(c>>6&63|128),d+=String.fromCharCode(63&c|128));return d}function b(a){for(var b="",c=0,d=0,e=0,f=0;c<a.length;)d=a.charCodeAt(c),128>d?(b+=String.fromCharCode(d),c++):d>191&&224>d?(e=a.charCodeAt(c+1),b+=String.fromCharCode((31&d)<<6|63&e),c+=2):(e=a.charCodeAt(c+1),f=a.charCodeAt(c+2),b+=String.fromCharCode((15&d)<<12|(63&e)<<6|63&f),c+=3);return b}var c="f+ziUuQV7tXvBWE9_yxSa5qOwHo6Rc4KJjlDbId2TLPYnheMA-ks80CF3ZmN1gpGr",d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";return{encode:function(b,e){if(null===b)return null;var f,g,h,i,j,k,l,m="",n=0,o=e?d:c;for(b=a(b);n<b.length;)f=b.charCodeAt(n++),g=b.charCodeAt(n++),h=b.charCodeAt(n++),i=f>>2,j=(3&f)<<4|g>>4,k=(15&g)<<2|h>>6,l=63&h,isNaN(g)?k=l=64:isNaN(h)&&(l=64),m=m+o.charAt(i)+o.charAt(j)+o.charAt(k)+o.charAt(l);return m},decode:function(a,e){if(null===a)return null;var f,g,h,i,j,k,l,m="",n=0,o=e?d:c;for(a=a.replace(/[^A-Za-z0-9\+_\-]/g,"");n<a.length;)i=o.indexOf(a.charAt(n++)),j=o.indexOf(a.charAt(n++)),k=o.indexOf(a.charAt(n++)),l=o.indexOf(a.charAt(n++)),f=i<<2|j>>4,g=(15&j)<<4|k>>2,h=(3&k)<<6|l,m+=String.fromCharCode(f),64!==k&&(m+=String.fromCharCode(g)),64!==l&&(m+=String.fromCharCode(h));return m=b(m)}}}(),b=function(){function a(){Date.prototype.toISOString||!function(){function a(a){var b=String(a);return 1===b.length&&(b="0"+b),b}Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+a(this.getUTCMonth()+1)+"-"+a(this.getUTCDate())+"T"+a(this.getUTCHours())+":"+a(this.getUTCMinutes())+":"+a(this.getUTCSeconds())+"."+String((this.getUTCMilliseconds()/1e3).toFixed(3)).slice(2,5)+"Z"}}()}var b,c,d="http:",e="https:",f=0,g="readyState",h=document.getElementsByTagName("head")[0],i=/["\\\x00-\x1f\x7f-\x9f]/g,j={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};return{quoteString:function(a){return a.match(i)?'"'+a.replace(i,function(a){var b=j[a];return"string"==typeof b?b:(b=a.charCodeAt(0),"\\u00"+Math.floor(b/16).toString(16)+(b%16).toString(16))})+'"':'"'+a+'"'},generateRandomNumber:function(){return b=Math.random(),b=b.toString().substring(3,b.toString().length)},getRandomNumber:function(){return void 0===b&&this.generateRandomNumber(),b},toJSON:"object"==typeof JSON&&JSON.stringify?JSON.stringify:function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o;if(null===a)return"null";if(i=typeof a,"undefined"===i)return void 0;if("number"===i||"boolean"===i)return""+a;if("string"===i)return this.quoteString(a);if("object"===i){if("function"==typeof a.toJSON)return this.toJSON(a.toJSON());if(a.constructor===Date)return b=a.getUTCMonth()+1,c=a.getUTCDate(),d=a.getUTCFullYear(),e=a.getUTCHours(),f=a.getUTCMinutes(),g=a.getUTCSeconds(),h=a.getUTCMilliseconds(),10>b&&(b="0"+b),10>c&&(c="0"+c),10>e&&(e="0"+e),10>f&&(f="0"+f),10>g&&(g="0"+g),100>h&&(h="0"+h),10>h&&(h="0"+h),'"'+d+"-"+b+"-"+c+"T"+e+":"+f+":"+g+"."+h+'Z"';if(a.constructor===Array){for(j=[],k=0;k<a.length;k++)j.push(this.toJSON(a[k])||"null");return"["+j.join(",")+"]"}n=[];for(o in a)if(a.hasOwnProperty(o)){if(i=typeof o,"number"===i)l='"'+o+'"';else{if("string"!==i)continue;l=this.quoteString(o)}if(i=typeof a[o],"function"===i||"undefined"===i)continue;m=this.toJSON(a[o]),n.push(l+":"+m)}return"{"+n.join(",")+"}"}},cookie:function(a,b,c){var d,e,f,g;return arguments.length>1&&"[object Object]"!==String(b)?(c=c||{},(null===b||void 0===b)&&(c.expires=-1),"number"==typeof c.expires&&(f=c.expires,g=c.expires=new Date,g.setDate(g.getDate()+f)),b=String(b),document.cookie=[encodeURIComponent(a),"=",b,c.expires?"; expires="+c.expires.toUTCString():"",c.path?"; path="+c.path:"",c.domain?"; domain="+c.domain:"",c.secure?"; secure":""].join("")):(c=b||{},e=c.raw?function(a){return a}:decodeURIComponent,(d=new RegExp("(?:^|; )"+encodeURIComponent(a)+"=([^;]*)").exec(""+document.cookie))?e(d[1]):null)},handleJsonp:function(a,b,d,e){var i,j=f++,k=document.createElement("script"),l=0,m=-1!==navigator.userAgent.indexOf("MSIE 10.0");return a?(window[e]=function(a){i=a},k.type="text/javascript",k.src=a,k.async=!0,void 0===k.onreadystatechange||m||(k.event="onclick",k.htmlFor=k.id="_reqwest_"+j),k.onload=k.onreadystatechange=function(){try{if(k[g]&&"loading"===k[g])return!1;if(k[g]&&"complete"!==k[g]&&"loaded"!==k[g]||l)return d&&d("script[readyState]: "+k[g]+" loaded: "+l+" lastValue: "+c),!1;if(k.onload=k.onreadystatechange=null,k.onclick&&k.onclick(),void 0===i)return d&&d("callback was not called."),!1;b&&b(i)}catch(a){d(a)}h&&k.parentNode&&h.removeChild(k),k=void 0,l=1},void h.insertBefore(k,h.firstChild)):(d("unable to execute jsonp request due url was not defined"),!1)},isLeapYear:function(a){return a%4===0&&a%100!==0||a%400===0},today:function(){return Date.parse(""+new Date)},currentYear:function(){return(new Date).getFullYear()},nextXmasDate:function(){var a,b=Date.parse("Dec 24, "+this.currentYear());return a=b+864e5,this.today()>a?Date.parse("Dec 24, "+(this.currentYear()+1)):b},daysToXmas:function(){var a=864e5;return Math.round((this.nextXmasDate()-this.today())/a)},isXmas:function(){return 0===this.daysToXmas()},getIsoDateString:function(b){return a(),b||(b=new Date),b.toISOString()},getUnixTimeStamp:function(){return Math.round((new Date).getTime()/1e3)},isSsl:function(){return"https:"===document.location.protocol},getProtocol:function(){var a=this.isSsl();return a?e:d}}}(),c=function(){function c(a){try{return a.setItem("test","test"),a.removeItem("test"),!0}catch(b){return!1}}var d,e;if("undefined"!=typeof Storage)try{d=c(sessionStorage),e=c(localStorage)}catch(f){d=!1,e=!1}else d=!1,e=!1;var g="xoo",h="xpl_sesId",i="xpl_sesUpd",j=18e5,k=30,l=600,m=131072,n="xpl_tg",o=document.location.host.split("."),p=o.length>1?"."+o.slice(-2).join("."):null;return{XUPS_PID_COOKIE_NAME:"pid",XUPS_PID_SHORT_COOKIE_NAME:"pid_short",XUPS_PID_SIGNATURE_COOKIE_NAME:"pid_signature",PGB_CACHE:"xpl_pgbCache",MAX_STORAGE:e?m:l,createNewSessionId:function(){var a=b.generateRandomNumber();return this.storeInSession(h,a),a},areCookieParamsValid:function(a,b){return!(!a||void 0===b||null===b||b.length>l)},createSessionCookie:function(a,c){this.areCookieParamsValid(a,c)&&b.cookie(a,c,{domain:p})},createEncodedSessionCookie:function(b,c){this.createSessionCookie(b,a.encode(c))},createExpiringCookie:function(a,c,d){this.areCookieParamsValid(a,c)&&b.cookie(a,c,{expires:d,path:"/",domain:p})},readCookie:function(a){return b.cookie(a)},readEncodedCookie:function(b){return a.decode(this.readCookie(b))},readLocalStorage:function(a){return localStorage.getItem(a)},readLocalStorageIfAvailable:function(a){return e?localStorage.getItem(a):null},readEncodedLocalStorage:function(b){return a.decode(localStorage.getItem(b))},readEncodedLocalStorageIfAvailable:function(a){return e?this.readEncodedLocalStorage(a):null},deleteCookie:function(a){b.cookie(a,null,{path:"/",domain:p}),b.cookie(a,null,{domain:p}),b.cookie(a,null,{path:"/",domain:document.location.host}),b.cookie(a,null,{domain:document.location.host})},isDomStorageAvailable:function(){return d&&e},isLocalStorageAvailable:function(){return e},storeInSession:function(b,c){var e=a.encode(c);d?sessionStorage.setItem(b,e):this.createSessionCookie(b,e)},storePersistently:function(b,c,d){var f=a.encode(c);this.createExpiringCookie(b,f,d||k),e&&localStorage.setItem(b,f)},readFromSession:function(b){return a.decode(d?sessionStorage.getItem(b):this.readCookie(b))},readPersisted:function(b){var c=this.readCookie(b);return a.decode(c||this.readLocalStorageIfAvailable(b))},removePersisted:function(a){this.deleteCookie(a),e&&localStorage.removeItem(a)},removeFromSession:function(a){return d?sessionStorage.removeItem(a):this.deleteCookie(a)},clearDomStorage:function(){e&&localStorage.clear(),d&&sessionStorage.clear()},clearCookies:function(){var a,b,c,d,e=document.cookie.split(";");for(a=0;a<e.length;a++)b=e[a],c=b.indexOf("="),d=c>-1?b.substr(0,c):b,this.deleteCookie(d.replace(/^\s+|\s+$/g,""))},getTestGroupNumber:function(){var a=n,b=this.readPersisted(a)||Math.ceil(1e3*Math.random());return this.storePersistently(a,b,365),b},belongsToTestGroup:function(a,b){return this.getTestGroupNumber()>=a&&this.getTestGroupNumber()<b},cleanupSessionCookies:function(){this.removeFromSession(h),this.removeFromSession(this.PGB_CACHE)},isSessionTimedOut:function(){return(new Date).getTime()-this.readFromSession(i)>j},getSessionId:function(){var a=this.readFromSession(h);return(!a||this.isSessionTimedOut())&&(a=this.createNewSessionId()),this.storeInSession(i,(new Date).getTime()),a},getXupsPid:function(){return this.readEncodedCookie(this.XUPS_PID_COOKIE_NAME)||this.readEncodedLocalStorageIfAvailable(this.XUPS_PID_COOKIE_NAME)},getXupsPid64:function(){return this.readCookie(this.XUPS_PID_COOKIE_NAME)||this.readLocalStorageIfAvailable(this.XUPS_PID_COOKIE_NAME)},getXupsPidShort:function(){return this.readEncodedCookie(this.XUPS_PID_SHORT_COOKIE_NAME)||this.readEncodedLocalStorageIfAvailable(this.XUPS_PID_SHORT_COOKIE_NAME)},getXupsPidShort64:function(){return this.readCookie(this.XUPS_PID_SHORT_COOKIE_NAME)||this.readLocalStorageIfAvailable(this.XUPS_PID_SHORT_COOKIE_NAME)},getXupsPidSignature:function(){return this.readEncodedCookie(this.XUPS_PID_SIGNATURE_COOKIE_NAME)||this.readEncodedLocalStorageIfAvailable(this.XUPS_PID_SIGNATURE_COOKIE_NAME)},getXupsPidSignature64:function(){return this.readCookie(this.XUPS_PID_SIGNATURE_COOKIE_NAME)||this.readLocalStorageIfAvailable(this.XUPS_PID_SIGNATURE_COOKIE_NAME)},getXupsPid64Standard:function(){return a.encode(this.getXupsPid(),!0)},getXupsPidShort64Standard:function(){return a.encode(this.getXupsPidShort(),!0)},isOptOut:function(){var a=this.readCookie(g);return null!==a}}}(),d=function(){function a(a){var b,c,e;for(b=0;b<a.length;b++){if(c=a[b].string,e=a[b].prop,d=a[b].versionSearch||a[b].identity,c&&-1!==c.indexOf(a[b].subString))return a[b].identity;if(e)return a[b].identity}return null}function b(a){var b=a.indexOf(d);return-1===b?null:parseFloat(a.substring(b+d.length+1))}function c(){try{return void 0===navigator.plugins||0===navigator.plugins.length}catch(a){return!0}}var d,e=[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.vendor,subString:"iPhone",identity:"Safari",versionSearch:"OS"},{string:navigator.vendor,subString:"iPad",identity:"Safari",versionSearch:"OS"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera",versionSearch:"Version"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Mozilla",identity:"Explorer",versionSearch:"rv"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],f=[{string:navigator.platform,identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone"},{string:navigator.userAgent,subString:"iPad",identity:"iPad"},{string:navigator.userAgent,subString:"iPod",identity:"iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}],g={Firefox:3.6,Chrome:12,Safari:3.1,Explorer:7,Opera:9},h={doDetection:function(){this.browser=a(e)||"unknown browser",this.version=b(navigator.userAgent)||b(navigator.appVersion)||"unknown version",this.os=a(f)||"unknow OS"},isBrowserWhiteListed:function(){var a=g[this.browser];return!!(void 0!==a&&this.version>=a)},shouldBeMarked:function(a){return a||this.hasFlash()},isIe:function(){return"Explorer"===this.browser},hasFlash:function(){try{return!!(c()?new ActiveXObject("ShockwaveFlash.ShockwaveFlash"):navigator.plugins["Shockwave Flash"])}catch(a){return!1}}};return h.doDetection(),h}(),e=function(){function a(a){return a.replace(/\[PARAM-/g,"[param-")}function e(a){return-1!==a.indexOf("[param-")}function f(a){return a.replace(/\[param-/,"").replace(/]/,"")}function g(){return b.isXmas()?-1:b.daysToXmas()>14?14:b.daysToXmas()}function h(a,b){var c,d;for(d=0;d<b.length;d++)c=document.createElement("param"),c.name=b[d].name,c.value=b[d].value,a.appendChild(c)}return{getProfilingParameterValue:function(){return"undefined"},getGenericParamPlaceholders:function(a){for(var b,c=[];e(a);)b=a.substr(a.indexOf("[param-"),a.length),c.push(b.substr(0,b.indexOf("]")+1)),a=b.substr(b.indexOf("]")+1,b.length);return c},replaceUrlPlaceholders:function(d){var h,i;if(d=d.replace(/\[timestamp]/i,b.getUnixTimeStamp()).replace(/\[random]/i,b.getRandomNumber()).replace(/\[productid]/i,this.getProfilingParameterValue("product_id")).replace(/\[ordertotal]/i,this.getProfilingParameterValue("order_total")).replace(/\[orderid]/i,this.getProfilingParameterValue("order_id")).replace(/\[orderarticle]/i,this.getProfilingParameterValue("order_article")).replace(/\[productquantity]/i,this.getProfilingParameterValue("product_quantity")).replace(/\[xpid]/i,c.getXupsPid()).replace(/\[xpid64]/i,c.getXupsPid64()).replace(/\[xpidshort]/i,c.getXupsPidShort()).replace(/\[xpidshort64]/i,c.getXupsPidShort64()).replace(/\[xpid64standard]/i,encodeURIComponent(c.getXupsPid64Standard())).replace(/\[xpidshort64standard]/i,encodeURIComponent(c.getXupsPidShort64Standard())).replace(/\[daystoxmas]/gi,g()).replace(/\[protocol]/i,b.getProtocol()),d=a(d),e(d))for(h=this.getGenericParamPlaceholders(d),i=0;i<h.length;i++)d=d.replace(h[i],this.getProfilingParameterValue(f(h[i])));return d},writeToDom:function(a){document.getElementsByTagName("BODY")[0].appendChild(a)},writeIframePixel:function(a){var b=document.createElement("iframe");b.src=this.replaceUrlPlaceholders(a),b.allowtransparency="true",b.framespacing="0",b.frameBorder="no",b.scrolling="no",b.width="1",b.height="1",this.writeToDom(b)},writeImgPixel:function(a){var b=document.createElement("img");b.width=1,b.height=1,b.border=0,b.src=this.replaceUrlPlaceholders(a),b.onerror="this.onerror = null;",this.writeToDom(b)},writeJavascriptPixelWithGivenCode:function(a){var b=document.createElement("script");b.type="text/javascript",b.text=a,this.writeToDom(b)},writeJavascriptPixel:function(a){var b=document.createElement("script");b.type="text/javascript",b.src=a,this.writeToDom(b)},writeFlashPixel:function(a,b){if(d.hasFlash()){var c=document.createElement("object");c.type="application/x-shockwave-flash",c.data=a,c.setAttribute("width","1"),c.setAttribute("height","1"),h(c,b),this.writeToDom(c)}},writeTrackingPixel:function(a,c){a.eventId!==c||b.isSsl()&&a.fireOnSSL!==!0||("iframe"===a.pixelType?this.writeIframePixel(a.trackingUrl):this.writeImgPixel(a.trackingUrl))},init:function(a){this.getProfilingParameterValue=a}}}();return{Base64:a,Util:b,User:c,BrowserDetect:d,Pixel:e}}(),Logger=function(){function a(a,f){if(f=f||"info",b){var g=f+" ["+new Date+"]	"+a+"\n";d+=g,c&&void 0!==console&&("error"===f?console.error(g):"warning"===f?console.warn(g):console.log(g)),e&&"error"===f&&e.notifyException(new Error(a))}}var b=!1,c=!1,d="",e=!1;return{errorCodes:{},errors:[],setBugsnag:function(a){"function"==typeof a.notify?e=a:this.logError("Given Object is apparently not an instance of Bugsnag.")},activateLogging:function(a){b=!0,a&&(c=!0)},deactivateLogging:function(){b=!1,c=!1},logError:function(b){a(b,"error")},logWarn:function(b){a(b,"warning")},logTrace:function(b){a(b,"info")},getTraceLog:function(){return d},clearTraceLog:function(){d=""}}}(),Util=function(adpUtil,win,doc){var HTTP="http:",HTTPS="https:",uuid,byTag="getElementsByTagName",readyState="readyState",head=doc[byTag]("head")[0],uniqid=0,lastValue,rvalidchars=/^[\],:{}\s]*$/,rvalidescape=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rvalidtokens=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rvalidbraces=/(?:^|:|,)(?:\s*\[)+/g,trimLeft=/^\s+/,trimRight=/\s+$/;return adpUtil.trim=String.prototype.trim?function(a){return null===a?"":String.prototype.trim.call(a)}:function(a){return null===a?"":a.toString().replace(trimLeft,"").replace(trimRight,"")},adpUtil.diffInDays=function(a,b){a.setHours(0),a.setMinutes(0),a.setSeconds(0),a.setMilliseconds(1),b.setHours(0),b.setMinutes(0),b.setSeconds(0),b.setMilliseconds(1);var c=60*a.getTimezoneOffset()*1e3-60*b.getTimezoneOffset()*1e3;return Math.floor(Math.abs(a.getTime()-b.getTime()-c)/864e5)},adpUtil.getUnixTimeStamp=function(){return Math.round((new Date).getTime()/1e3)},adpUtil.generateUUID=function(){var a=function(){return(65536*(1+Math.random())|0).toString(16).substring(1)};return uuid=a()+a()+"-"+a()+"-"+a()+"-"+a()+"-"+a()+a()+a(),Logger.logTrace("UUID generated: "+uuid),uuid},adpUtil.getUUID=function(){return void 0===uuid&&adpUtil.generateUUID(),uuid},adpUtil.isSsl=function(){return"https:"===doc.location.protocol},adpUtil.getProtocol=function(){var a=adpUtil.isSsl();return a?HTTPS:HTTP},adpUtil.getProtocolAndDomain=function(){var a=adpUtil.isSsl();return(a?HTTPS:HTTP)+"//"+doc.location.host},adpUtil.fallbackValue=function(a){return void 0===a||null===a?"":a},adpUtil.evalJSON="object"==typeof JSON&&JSON.parse?JSON.parse:function(src){return eval("("+src+")")},adpUtil.secureEvalJSON="object"==typeof JSON&&JSON.parse?JSON.parse:function(src){var filtered=src.replace(/\\["\\\/bfnrtu]/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"");if(/^[\],:{}\s]*$/.test(filtered))return eval("("+src+")");throw new SyntaxError("Error parsing JSON, source is not valid.")},adpUtil.parseJSON=function(a){return"string"==typeof a&&a?(a=adpUtil.trim(a),win.JSON&&win.JSON.parse?win.JSON.parse(a):rvalidchars.test(a.replace(rvalidescape,"@").replace(rvalidtokens,"]").replace(rvalidbraces,""))?new Function("return "+a)():null):null},adpUtil.inArray=function(a,b){var c,d;if(!b)return-1;if(Array.prototype.indexOf)return Array.prototype.indexOf.call(b,a);for(d=b.length,c=0;d>c;c++)if(b[c]===a)return c;return-1},adpUtil.jsonpCallback=function(a){lastValue=a},adpUtil.handleJsonp=function(a,b,c,d){var e=uniqid++,f=doc.createElement("script"),g=0,h=-1!==navigator.userAgent.indexOf("MSIE 10.0");win[d]=adpUtil.jsonpCallback,f.type="text/javascript",f.src=a,f.async=!0,void 0===f.onreadystatechange||h||(f.event="onclick",f.htmlFor=f.id="_reqwest_"+e),f.onload=f.onreadystatechange=function(){try{if(f[readyState]&&"loading"===f[readyState])return!1;if(f[readyState]&&"complete"!==f[readyState]&&"loaded"!==f[readyState]||g)return c&&c("script[readyState]: "+f[readyState]+" loaded: "+g+" lastValue: "+lastValue),!1;if(f.onload=f.onreadystatechange=null,f.onclick&&f.onclick(),void 0===lastValue)return c&&c("callback was not called."),!1;b&&b(lastValue),lastValue=void 0}catch(a){lastValue=void 0,c(a)}head&&f.parentNode&&head.removeChild(f),f=void 0,g=1},head.insertBefore(f,head.firstChild)},adpUtil.loadScript=function(a,b,c){var d=uniqid++,e=doc.createElement("script"),f=0;e.type="text/javascript",e.src=a,e.async=!0,void 0!==e.onreadystatechange&&(e.event="onclick",e.htmlFor=e.id="_reqwest_"+d),e.onload=e.onreadystatechange=function(){return e[readyState]&&"complete"!==e[readyState]&&"loaded"!==e[readyState]||f?(c&&c(e),!1):(e.onload=e.onreadystatechange=null,e.onclick&&e.onclick(),b&&b(e),void(f=1))},head.insertBefore(e,head.firstChild)},adpUtil}(XCM.Util||{},window,document),DeviceIdent=function(a){function b(){return a.User.belongsToTestGroup(e,f)}function c(){return a.User.belongsToTestGroup(g,h)}function d(){return b()||c()}var e=0,f=5,g=5,h=10,i="xpl_di",j=Util.getProtocol()+"//www.javascript247.net/",k="b49Nr93";return{addJavaScriptPixelIfRequired:function(){a.User.belongsToTestGroup(e,f)&&this.addJavaScriptPixel()},addFullDeviceIdentPixelIfRequired:function(){a.User.belongsToTestGroup(g,h)&&this.addFullDeviceIdentPixel()},userIsMarked:function(){return!!a.User.readPersisted(i)},markUserWithDeviceIdentCookie:function(){a.User.storePersistently(i,1,365)},addJavaScriptPixel:function(){var b=a.User.getXupsPid();a.Pixel.writeJavascriptPixelWithGivenCode('var di = {t: "'+b+'", v : "'+k+'"};'),a.Pixel.writeJavascriptPixel(j+k+"/di.js")},addFlashPixel:function(){var b,c,d=a.User.getXupsPid();b=j+k+"/c.swf",c=[{name:"movie",value:b},{name:"flashvars",value:"t="+d+"&v="+k}],a.Pixel.writeFlashPixel(b,c)},addFullDeviceIdentPixel:function(){this.addJavaScriptPixel(),this.addFlashPixel()},getTestGroupDescription:function(){return b()?"JAVA_SCRIPT_DI_TAG":c()?"FULL_DI_TAG":"NO_DI_TAG"},requestDeviceIdentProfile:function(){var b,c=a.User.getXupsPid();b=j+"expl/d41d8cd98f00b204e9800998ecf8427e/"+c+".js?functionName=deviceIdentCallback",Util.handleJsonp(b,function(a){this.deviceIdentCallback(a)},function(a){Logger.logError("failed retrieving jsonp response from xups ("+a+")")},"deviceIdentCallback")},addDeviceIdentPixel:function(){this.userIsMarked()?d()&&Logger.logTrace("User is marked as DeviceIdent. Requesting DI IDs..."):(this.markUserWithDeviceIdentCookie(),this.addJavaScriptPixelIfRequired(),this.addFullDeviceIdentPixelIfRequired())}}}(XCM),Pgb=function(a){function b(){Logger.logTrace("save PGBs in session, that are already fired..."),a.User.createEncodedSessionCookie(a.User.PGB_CACHE,e.join(","))}function c(){e=a.User.readEncodedCookie(a.User.PGB_CACHE),void 0!==e&&null!==e&&""!==e?(e=e.split(","),Logger.logTrace("found "+e.length+" PGBs that have been already fired")):(e=[],Logger.logTrace("no PGBs have been fired yet"))}var d,e;return{writePGB:function(b){"iframe"===b.pgbType.toLowerCase()?a.Pixel.writeIframePixel(b.pgbUrl):a.Pixel.writeImgPixel(b.pgbUrl)},init:function(a){d=a,c()},setReturnedPGBs:function(a){var c,d,f=a.piggyBacks;for(d in f)f.hasOwnProperty(d)&&(c=f[d].id,Logger.logTrace('Firing PGB "'+c+'"...'),this.writePGB(f[d]),e.push(c));b()}}}(XCM),Profiler=function(a,b){function c(b){var c,d,e,f,g,h,i=z[b];if(l.hasOwnProperty("paramsValueModification")&&(c=l.paramsValueModification[b],void 0!==c&&(i=a.replaceChars(c,b,i))),l.hasOwnProperty("paramsValueTrimming")&&(d=l.paramsValueTrimming[b],void 0!==d))if(Logger.logTrace('Trimming parameter "'+b+'"'),void 0!==d.delimiter&&""!==d.delimiter){e=d.delimiter,f=i.split(e),g=[];for(h in f)f.hasOwnProperty(h)&&(g=g.concat(a.trim(f[h],d)));i=g.join(e)}else i=a.trim(i,d);return"string"==typeof i&&(i=i.replace(/(\r\n|\n|\r)/gm," ")),encodeURIComponent(i)}function d(a){return l.hasOwnProperty("parameterMapping")&&void 0!==l.parameterMapping[a]&&""!==Util.trim(l.parameterMapping[a])}function e(){return void 0!==z.customer&&z.customer.match(/\S*\.\S{2,3}/)?((void 0===z.event_id||null===z.event_id||""===Util.trim(z.event_id))&&(Logger.logWarn('no event given! -> Setting event_id to "unknown"'),z.event_id="unknown"),!0):(Logger.logError("invalid customer: "+z.customer),!1)}function f(a){return void 0!==z[a]?c(a):void 0}function g(a){a&&a.xpid&&(m=b.Base64.decode(a.xpid),n=a.xpid,o=b.Base64.decode(a.xpidshort),p=a.xpidshort,q=b.Base64.decode(a.xpidsignature),r=a.xpidsignature,b.User.isLocalStorageAvailable()&&m&&o&&q&&(b.User.storePersistently(b.User.XUPS_PID_SIGNATURE_COOKIE_NAME,q),b.User.storePersistently(b.User.XUPS_PID_COOKIE_NAME,m),b.User.storePersistently(b.User.XUPS_PID_SHORT_COOKIE_NAME,o)))}function h(){var c=a.createXupsParamList(),d=s+a.getXupsPath()+"cus="+l.customerId+a.getXplShopIdForXups()+c+"&xpid="+(m||"")+"&xpidsignature="+(q||"")+"&timestamp="+t+"&scriptversion="+y;b.BrowserDetect.shouldBeMarked(!!l.piggybacksMobileActive)?a.writeXupsJsonpPGBs(d):a.writeXupsJsonp(d)}function i(){var c=Util.generateUUID();s=Util.getProtocol(),t=Util.getRandomNumber(),void 0!==z.hostname&&(z.hostname=escape(z.hostname).replace(/\|/g,"*")),z.sessionid=b.User.getSessionId(),z.cookieEnabled=navigator.cookieEnabled,z.userAgent=navigator.userAgent,z.userLang=navigator.language,z.userTimezone=(new Date).getTimezoneOffset()/60*-1,z.uuid=c,z.scorex=Pgb.scorex,Logger.errors.length>0&&(z.errors=Logger.errors),z.hasFlash=b.BrowserDetect.hasFlash(),z.deviceIdentTestGroup=DeviceIdent.getTestGroupDescription(),z.tg=b.User.getTestGroupNumber(),m=b.User.getXupsPid(),n=b.User.getXupsPid64(),o=b.User.getXupsPidShort(),p=b.User.getXupsPidShort64(),q=b.User.getXupsPidSignature(),r=b.User.getXupsPidSignature64(),a.xpidIsAvailable()&&DeviceIdent.addDeviceIdentPixel(),w&&h()}function j(a){var c={};a.origin.indexOf(z.customer)>-1&&"fetchPidData"===a.data&&(c.pid=b.User.getXupsPid(),c.pid_signature=b.User.getXupsPidSignature(),parent.postMessage(c,a.origin))}function k(){return!!window.addEventListener}var l,m,n,o,p,q,r,s,t,u="config/",v=".config.jsonp",w=!0,x="//xups.xplosion.de/?",y="4.6.9-SNAPSHOT",z={},A=!1;return a.XUPS_USE_ROUND_ROBIN_LOAD_BALANCING=!1,a.XUPS_ROUND_ROBIN_PATHES=["//xups1.xplosion.de/?"],"undefined"!=typeof Bugsnag&&(a.Bugsnag=Bugsnag.noConflict(),a.Bugsnag.apiKey="ef041aa39e9796bb8b99e170f45125cf",a.Bugsnag.autoNotify="false",a.Bugsnag.endpoint="//xups.xplosion.de/bs",a.Bugsnag.user={id:b.User.getXupsPid(),ipAddress:"0.0.0.0"},a.Bugsnag.appVersion="4.8.0"),
a.trim=function(a,b){var c=b.firstIndex||0,d=b.lastIndex||255;try{return a.substring(c,d)}catch(e){return a}},a.replaceChars=function(a,b,c){var d,e,f,g,h;if(void 0!==a.old)d=a.old,e=a["new"],Logger.logTrace('Replacing "'+d+'" with "'+e+'" for param "'+b+'"'),f=new RegExp(d,"g"),h=c.replace(f,e);else{for(g in a)a.hasOwnProperty(g)&&(d=a[g].old,e=a[g]["new"],Logger.logTrace('Replacing "'+d+'" with "'+e+'" for param "'+b+'"'),f=new RegExp(d,"g"),c=c.replace(f,e));h=c}return h},a.renameParam=function(a){return Logger.logTrace("Renaming param:   "+a+" -> "+l.parameterMapping[a]),l.parameterMapping[a]},a.createParamString=function(b){var e=d(b)?a.renameParam(b):b;return"&"+e+"="+c(b)},a.createXupsParamList=function(){var b,c="";for(b in z)z.hasOwnProperty(b)&&"customer"!==b&&"customer_id"!==b&&(Logger.logTrace("Processing params:   "+b+": "+z[b]),c+=a.createParamString(b,!1));return c},a.xpidIsAvailable=function(){return!!m},a.xUpsCallback=function(b){g(b),a.xpidIsAvailable()&&DeviceIdent.addDeviceIdentPixel()},a.writeXupsJsonp=function(b){b+="&px=jsonp",Logger.logTrace("xupsUrl: "+b),Util.handleJsonp(b,function(b){a.xUpsCallback(b)},function(b){a.xUpsCallback(),Logger.logError("failed retrieving jsonp response from xups ("+b+")")},"profilingCallResponse")},a.writeXupsJsonpPGBs=function(b){b+="&px=jsonppgbs",Logger.logTrace("xupsUrl: "+b),Util.handleJsonp(b,function(b){a.xUpsCallback(b),Pgb.setReturnedPGBs(b)},function(b){a.xUpsCallback(),Logger.logError("failed retrieving jsonp response from xups ("+b+")")},"profilingCallResponse")},a.getXplShopIdForXups=function(){return l.hasOwnProperty("xplShopId")?"&xplsid="+l.xplShopId:""},a.getXupsPath=function(){var b;return a.XUPS_USE_ROUND_ROBIN_LOAD_BALANCING&&!Util.isSsl()?(b=Math.round(100*Math.random())%a.XUPS_ROUND_ROBIN_PATHES.length,a.XUPS_ROUND_ROBIN_PATHES[b]):x},a.doProfile=function(){var a,c;if(l.profilingActive===!1)return Logger.logWarn("Profiling is set inactive in config for this customer!"),void Logger.logTrace("Script ends here.");if(Logger.logTrace("Start Profiling"),b.User.getTestGroupNumber(),b.Pixel.init(f),Pgb.init(l.customerId),i(),a=l.externalTrackingPixel){Logger.logTrace("Found external tracking configuration...");for(c in a)a.hasOwnProperty(c)&&b.Pixel.writeTrackingPixel(a[c],z.event_id);Logger.logTrace("Finished processing external tracking configuration.")}},a.checkConfig=function(){return void 0===l.customerId||void 0===l.profilingActive?(Logger.logError("Mandatory basic config parameters are missing!"),!1):!0},a.loadConfigSuccessCallback=function(b){Logger.logTrace("Successfully loaded customer config!"),A=!0,a.initConfig(b)},a.loadConfigErrorCallback=function(a){A=!0,Logger.logError("Failed loading customer config: "+a)},a.loadCustomerConfig=function(){var c=Util.getProtocolAndDomain()+"/"+u+z.customer+v;b.BrowserDetect.isIe()&&(c=c+"?cachebuster="+Util.generateRandomNumber()),Logger.logTrace("Loading customer config [different domain, jsonp]: "+c),Util.handleJsonp(c,function(b){a.loadConfigSuccessCallback(b)},function(b){a.loadConfigErrorCallback(b)},"parseResponse")},a.params=function(){return z},a.replaceParamsPlaceholder=function(){var a;for(a in z)z.hasOwnProperty(a)&&"string"==typeof z[a]&&(z[a]=z[a].replace(/\[FORMATTEDTIMESTAMP]/,Util.getIsoDateString()).replace(/\[formattedtimestamp]/,Util.getIsoDateString()))},a.listenToCrossDomainEvents=function(){k()&&window.addEventListener("message",j,!1)},a.initProfiling=function(c){try{if("undefined"!=typeof a.Bugsnag&&Logger.setBugsnag(a.Bugsnag),b.User.isOptOut())return Logger.logWarn("User is opted out!"),void Logger.logWarn("Aborted profiling!");if(z=c,!e())return void Logger.logError("Invalid mandatory params!");Logger.logTrace("Params ok."),a.replaceParamsPlaceholder(),A=!1,a.loadCustomerConfig(),a.listenToCrossDomainEvents()}catch(d){"undefined"!=typeof a.Bugsnag&&a.Bugsnag.notifyException(d)}},a.finishedLoadingConfig=function(){return A},a.initConfig=function(b){l=b,a.checkConfig()?a.doProfile():Logger.logError("Profiling not started due to error in config!")},a}(Profiler||{},XCM),paramsHolder={},i,parts,urlParams=document.location.search.substring(1).split("&");for(i=0;i<urlParams.length;i++)parts=urlParams[i].split("="),paramsHolder[decodeURIComponent(parts[0])]=decodeURIComponent(parts[1]);Profiler.initProfiling(paramsHolder);