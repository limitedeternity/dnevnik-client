(function(Ya,Za){'object'==typeof exports&&'undefined'!=typeof module?module.exports=Za():'function'==typeof define&&define.amd?define(Za):Ya.whenDomReady=Za()})(this,function(){'use strict';var Ya=['interactive','complete'],Za=function(_a,ab){return new Promise(function(bb){_a&&'function'!=typeof _a&&(ab=_a,_a=null),ab=ab||window.document;var db=function(){return bb(void(_a&&setTimeout(_a)))};-1===Ya.indexOf(ab.readyState)?ab.addEventListener('DOMContentLoaded',db):db()})};return Za.resume=function($a){return function(_a){return Za($a).then(function(){return _a})}},Za});!function(Ya){if('object'==typeof exports&&'undefined'!=typeof module)module.exports=Ya();else if('function'==typeof define&&define.amd)define([],Ya);else{var Za;Za='undefined'==typeof window?'undefined'==typeof global?'undefined'==typeof self?this:self:global:window,Za.localforage=Ya()}}(function(){return function Ya(Za,$a,_a){function ab(eb,fb){if(!$a[eb]){if(!Za[eb]){var gb='function'==typeof require&&require;if(!fb&&gb)return gb(eb,!0);if(bb)return bb(eb,!0);var hb=new Error('Cannot find module \''+eb+'\'');throw hb.code='MODULE_NOT_FOUND',hb}var ib=$a[eb]={exports:{}};Za[eb][0].call(ib.exports,function(jb){var kb=Za[eb][1][jb];return ab(kb||jb)},ib,ib.exports,Ya,Za,$a,_a)}return $a[eb].exports}for(var bb='function'==typeof require&&require,db=0;db<_a.length;db++)ab(_a[db]);return ab}({1:[function(Ya,Za){(function(_a){'use strict';function ab(){jb=!0;for(var lb,mb,nb=kb.length;nb;){for(mb=kb,kb=[],lb=-1;++lb<nb;)mb[lb]();nb=kb.length}jb=!1}var db,eb=_a.MutationObserver||_a.WebKitMutationObserver;if(eb){var fb=0,gb=new eb(ab),hb=_a.document.createTextNode('');gb.observe(hb,{characterData:!0}),db=function(){hb.data=fb=++fb%2}}else if(_a.setImmediate||void 0===_a.MessageChannel)db='document'in _a&&'onreadystatechange'in _a.document.createElement('script')?function(){var lb=_a.document.createElement('script');lb.onreadystatechange=function(){ab(),lb.onreadystatechange=null,lb.parentNode.removeChild(lb),lb=null},_a.document.documentElement.appendChild(lb)}:function(){setTimeout(ab,0)};else{var ib=new _a.MessageChannel;ib.port1.onmessage=ab,db=function(){ib.port2.postMessage(0)}}var jb,kb=[];Za.exports=function(lb){1!==kb.push(lb)||jb||db()}}).call(this,'undefined'==typeof global?'undefined'==typeof self?'undefined'==typeof window?{}:window:self:global)},{}],2:[function(Ya,Za,$a){'use strict';function _a(){}function ab(qb){if('function'!=typeof qb)throw new TypeError('resolver must be a function');this.state=pb,this.queue=[],this.outcome=void 0,qb!==_a&&fb(this,qb)}function bb(qb,rb,sb){this.promise=qb,'function'==typeof rb&&(this.onFulfilled=rb,this.callFulfilled=this.otherCallFulfilled),'function'==typeof sb&&(this.onRejected=sb,this.callRejected=this.otherCallRejected)}function db(qb,rb,sb){lb(function(){var tb;try{tb=rb(sb)}catch(ub){return mb.reject(qb,ub)}tb===qb?mb.reject(qb,new TypeError('Cannot resolve promise with itself')):mb.resolve(qb,tb)})}function eb(qb){var rb=qb&&qb.then;if(qb&&'object'==typeof qb&&'function'==typeof rb)return function(){rb.apply(qb,arguments)}}function fb(qb,rb){function sb(xb){vb||(vb=!0,mb.reject(qb,xb))}function tb(xb){vb||(vb=!0,mb.resolve(qb,xb))}var vb=!1,wb=gb(function(){rb(tb,sb)});'error'===wb.status&&sb(wb.value)}function gb(qb,rb){var sb={};try{sb.value=qb(rb),sb.status='success'}catch(tb){sb.status='error',sb.value=tb}return sb}var lb=Ya(1),mb={},nb=['REJECTED'],ob=['FULFILLED'],pb=['PENDING'];Za.exports=$a=ab,ab.prototype.catch=function(qb){return this.then(null,qb)},ab.prototype.then=function(qb,rb){if('function'!=typeof qb&&this.state===ob||'function'!=typeof rb&&this.state===nb)return this;var sb=new this.constructor(_a);return this.state===pb?this.queue.push(new bb(sb,qb,rb)):db(sb,this.state===ob?qb:rb,this.outcome),sb},bb.prototype.callFulfilled=function(qb){mb.resolve(this.promise,qb)},bb.prototype.otherCallFulfilled=function(qb){db(this.promise,this.onFulfilled,qb)},bb.prototype.callRejected=function(qb){mb.reject(this.promise,qb)},bb.prototype.otherCallRejected=function(qb){db(this.promise,this.onRejected,qb)},mb.resolve=function(qb,rb){var sb=gb(eb,rb);if('error'===sb.status)return mb.reject(qb,sb.value);var tb=sb.value;if(tb)fb(qb,tb);else{qb.state=ob,qb.outcome=rb;for(var ub=-1,vb=qb.queue.length;++ub<vb;)qb.queue[ub].callFulfilled(rb)}return qb},mb.reject=function(qb,rb){qb.state=nb,qb.outcome=rb;for(var sb=-1,tb=qb.queue.length;++sb<tb;)qb.queue[sb].callRejected(rb);return qb},$a.resolve=function(qb){return qb instanceof this?qb:mb.resolve(new this(_a),qb)},$a.reject=function(qb){var rb=new this(_a);return mb.reject(rb,qb)},$a.all=function(qb){function rb(zb,Ab){sb.resolve(zb).then(function(Cb){vb[Ab]=Cb,++wb!==tb||ub||(ub=!0,mb.resolve(yb,vb))},function(Cb){ub||(ub=!0,mb.reject(yb,Cb))})}var sb=this;if('[object Array]'!==Object.prototype.toString.call(qb))return this.reject(new TypeError('must be an array'));var tb=qb.length,ub=!1;if(!tb)return this.resolve([]);for(var vb=Array(tb),wb=0,xb=-1,yb=new this(_a);++xb<tb;)rb(qb[xb],xb);return yb},$a.race=function(qb){function rb(xb){sb.resolve(xb).then(function(yb){ub||(ub=!0,mb.resolve(wb,yb))},function(yb){ub||(ub=!0,mb.reject(wb,yb))})}var sb=this;if('[object Array]'!==Object.prototype.toString.call(qb))return this.reject(new TypeError('must be an array'));var tb=qb.length,ub=!1;if(!tb)return this.resolve([]);for(var vb=-1,wb=new this(_a);++vb<tb;)rb(qb[vb]);return wb}},{1:1}],3:[function(Ya){(function(_a){'use strict';'function'!=typeof _a.Promise&&(_a.Promise=Ya(2))}).call(this,'undefined'==typeof global?'undefined'==typeof self?'undefined'==typeof window?{}:window:self:global)},{2:2}],4:[function(Ya,Za){'use strict';function _a(Vc,Wc){if(!(Vc instanceof Wc))throw new TypeError('Cannot call a class as a function')}function db(Vc,Wc){Vc=Vc||[],Wc=Wc||{};try{return new Blob(Vc,Wc)}catch($c){if('TypeError'!==$c.name)throw $c;for(var Xc='undefined'==typeof BlobBuilder?'undefined'==typeof MSBlobBuilder?'undefined'==typeof MozBlobBuilder?WebKitBlobBuilder:MozBlobBuilder:MSBlobBuilder:BlobBuilder,Yc=new Xc,Zc=0;Zc<Vc.length;Zc+=1)Yc.append(Vc[Zc]);return Yc.getBlob(Wc.type)}}function eb(Vc,Wc){Wc&&Vc.then(function(Xc){Wc(null,Xc)},function(Xc){Wc(Xc)})}function fb(Vc,Wc,Xc){'function'==typeof Wc&&Vc.then(Wc),'function'==typeof Xc&&Vc.catch(Xc)}function gb(Vc){return'string'!=typeof Vc&&(console.warn(Vc+' used as a key, but it is not a string.'),Vc=Vc+''),Vc}function hb(Vc){for(var Wc=Vc.length,Xc=new ArrayBuffer(Wc),Yc=new Uint8Array(Xc),Zc=0;Zc<Wc;Zc++)Yc[Zc]=Vc.charCodeAt(Zc);return Xc}function ib(Vc){return new lc(function(Wc){var Xc=Vc.transaction(mc,pc),Yc=db(['']);Xc.objectStore(mc).put(Yc,'key'),Xc.onabort=function(Zc){Zc.preventDefault(),Zc.stopPropagation(),Wc(!1)},Xc.oncomplete=function(){var Zc=navigator.userAgent.match(/Chrome\/(\d+)/),$c=navigator.userAgent.match(/Edge\//);Wc($c||!Zc||43<=parseInt(Zc[1],10))}}).catch(function(){return!1})}function jb(Vc){return'boolean'==typeof jc?lc.resolve(jc):ib(Vc).then(function(Wc){return jc=Wc})}function kb(Vc){var Wc=kc[Vc.name],Xc={};Xc.promise=new lc(function(Yc){Xc.resolve=Yc}),Wc.deferredOperations.push(Xc),Wc.dbReady=Wc.dbReady?Wc.dbReady.then(function(){return Xc.promise}):Xc.promise}function lb(Vc){var Wc=kc[Vc.name],Xc=Wc.deferredOperations.pop();Xc&&Xc.resolve()}function mb(Vc,Wc){var Xc=kc[Vc.name],Yc=Xc.deferredOperations.pop();Yc&&Yc.reject(Wc)}function nb(Vc,Wc){return new lc(function(Xc,Yc){if(Vc.db){if(!Wc)return Xc(Vc.db);kb(Vc),Vc.db.close()}var Zc=[Vc.name];Wc&&Zc.push(Vc.version);var $c=ic.open.apply(ic,Zc);Wc&&($c.onupgradeneeded=function(_c){var ad=$c.result;try{ad.createObjectStore(Vc.storeName),1>=_c.oldVersion&&ad.createObjectStore(mc)}catch(bd){if('ConstraintError'!==bd.name)throw bd;console.warn('The database "'+Vc.name+'" has been upgraded from version '+_c.oldVersion+' to version '+_c.newVersion+', but the storage "'+Vc.storeName+'" already exists.')}}),$c.onerror=function(_c){_c.preventDefault(),Yc($c.error)},$c.onsuccess=function(){Xc($c.result),lb(Vc)}})}function ob(Vc){return nb(Vc,!1)}function pb(Vc){return nb(Vc,!0)}function qb(Vc,Wc){if(!Vc.db)return!0;var Xc=!Vc.db.objectStoreNames.contains(Vc.storeName),Yc=Vc.version<Vc.db.version,Zc=Vc.version>Vc.db.version;if(Yc&&(Vc.version!==Wc&&console.warn('The database "'+Vc.name+'" can\'t be downgraded from version '+Vc.db.version+' to version '+Vc.version+'.'),Vc.version=Vc.db.version),Zc||Xc){if(Xc){var $c=Vc.db.version+1;$c>Vc.version&&(Vc.version=$c)}return!0}return!1}function rb(Vc){return new lc(function(Wc,Xc){var Yc=new FileReader;Yc.onerror=Xc,Yc.onloadend=function(Zc){var $c=btoa(Zc.target.result||'');Wc({__local_forage_encoded_blob:!0,data:$c,type:Vc.type})},Yc.readAsBinaryString(Vc)})}function sb(Vc){return db([hb(atob(Vc.data))],{type:Vc.type})}function tb(Vc){return Vc&&Vc.__local_forage_encoded_blob}function ub(Vc){var Wc=this,Xc=Wc._initReady().then(function(){var Yc=kc[Wc._dbInfo.name];if(Yc&&Yc.dbReady)return Yc.dbReady});return fb(Xc,Vc,Vc),Xc}function vb(Vc){kb(Vc);for(var Wc=kc[Vc.name],Xc=Wc.forages,Yc=0;Yc<Xc.length;Yc++)Xc[Yc]._dbInfo.db&&(Xc[Yc]._dbInfo.db.close(),Xc[Yc]._dbInfo.db=null);return nb(Vc,!1).then(function(Zc){for(var $c=0;$c<Xc.length;$c++)Xc[$c]._dbInfo.db=Zc}).catch(function(Zc){throw mb(Vc,Zc),Zc})}function wb(Vc,Wc,Xc){try{var Yc=Vc.db.transaction(Vc.storeName,Wc);Xc(null,Yc)}catch(Zc){if(!Vc.db||'InvalidStateError'===Zc.name)return vb(Vc).then(function(){var $c=Vc.db.transaction(Vc.storeName,Wc);Xc(null,$c)});Xc(Zc)}}function Hb(Vc){var Wc,Xc,Yc,Zc,$c,_c=.75*Vc.length,ad=Vc.length,bd=0;'='===Vc[Vc.length-1]&&(_c--,'='===Vc[Vc.length-2]&&_c--);var cd=new ArrayBuffer(_c),dd=new Uint8Array(cd);for(Wc=0;Wc<ad;Wc+=4)Xc=rc.indexOf(Vc[Wc]),Yc=rc.indexOf(Vc[Wc+1]),Zc=rc.indexOf(Vc[Wc+2]),$c=rc.indexOf(Vc[Wc+3]),dd[bd++]=Xc<<2|Yc>>4,dd[bd++]=(15&Yc)<<4|Zc>>2,dd[bd++]=(3&Zc)<<6|63&$c;return cd}function Ib(Vc){var Wc,Xc=new Uint8Array(Vc),Yc='';for(Wc=0;Wc<Xc.length;Wc+=3)Yc+=rc[Xc[Wc]>>2],Yc+=rc[(3&Xc[Wc])<<4|Xc[Wc+1]>>4],Yc+=rc[(15&Xc[Wc+1])<<2|Xc[Wc+2]>>6],Yc+=rc[63&Xc[Wc+2]];return 2==Xc.length%3?Yc=Yc.substring(0,Yc.length-1)+'=':1==Xc.length%3&&(Yc=Yc.substring(0,Yc.length-2)+'=='),Yc}function Ob(Vc,Wc,Xc,Yc){var Zc=this;Vc=gb(Vc);var $c=new lc(function(_c,ad){Zc.ready().then(function(){void 0===Wc&&(Wc=null);var bd=Wc,cd=Zc._dbInfo;cd.serializer.serialize(Wc,function(dd,ed){ed?ad(ed):cd.db.transaction(function(fd){fd.executeSql('INSERT OR REPLACE INTO '+cd.storeName+' (key, value) VALUES (?, ?)',[Vc,dd],function(){_c(bd)},function(gd,hd){ad(hd)})},function(fd){if(fd.code===fd.QUOTA_ERR){if(0<Yc)return void _c(Ob.apply(Zc,[Vc,bd,Xc,Yc-1]));ad(fd)}})})}).catch(ad)});return eb($c,Xc),$c}function Wb(){var Vc='_localforage_support_test';try{return localStorage.setItem(Vc,!0),localStorage.removeItem(Vc),!1}catch(Wc){return!0}}function Xb(){return!Wb()||0<localStorage.length}function fc(Vc,Wc){Vc[Wc]=function(){var Xc=arguments;return Vc.ready().then(function(){return Vc[Wc].apply(Vc,Xc)})}}function gc(){for(var Wc,Vc=1;Vc<arguments.length;Vc++)if(Wc=arguments[Vc],Wc)for(var Xc in Wc)Wc.hasOwnProperty(Xc)&&(Mc(Wc[Xc])?arguments[0][Xc]=Wc[Xc].slice():arguments[0][Xc]=Wc[Xc]);return arguments[0]}var hc='function'==typeof Symbol&&'symbol'==typeof Symbol.iterator?function(Vc){return typeof Vc}:function(Vc){return Vc&&'function'==typeof Symbol&&Vc.constructor===Symbol&&Vc!==Symbol.prototype?'symbol':typeof Vc},ic=function(){try{if('undefined'!=typeof indexedDB)return indexedDB;if('undefined'!=typeof webkitIndexedDB)return webkitIndexedDB;if('undefined'!=typeof mozIndexedDB)return mozIndexedDB;if('undefined'!=typeof OIndexedDB)return OIndexedDB;if('undefined'!=typeof msIndexedDB)return msIndexedDB}catch(Vc){}}();'undefined'==typeof Promise&&Ya(3);var jc,kc,lc=Promise,mc='local-forage-detect-blob-support',nc=Object.prototype.toString,oc='readonly',pc='readwrite',qc={_driver:'asyncStorage',_initStorage:function(Vc){function Wc(){return lc.resolve()}var Xc=this,Yc={db:null};if(Vc)for(var Zc in Vc)Yc[Zc]=Vc[Zc];kc||(kc={});var $c=kc[Yc.name];$c||($c={forages:[],db:null,dbReady:null,deferredOperations:[]},kc[Yc.name]=$c),$c.forages.push(Xc),Xc._initReady||(Xc._initReady=Xc.ready,Xc.ready=ub);for(var bd,_c=[],ad=0;ad<$c.forages.length;ad++)bd=$c.forages[ad],bd!==Xc&&_c.push(bd._initReady().catch(Wc));var cd=$c.forages.slice(0);return lc.all(_c).then(function(){return Yc.db=$c.db,ob(Yc)}).then(function(dd){return Yc.db=dd,qb(Yc,Xc._defaultConfig.version)?pb(Yc):dd}).then(function(dd){Yc.db=$c.db=dd,Xc._dbInfo=Yc;for(var fd,ed=0;ed<cd.length;ed++)fd=cd[ed],fd!==Xc&&(fd._dbInfo.db=Yc.db,fd._dbInfo.version=Yc.version)})},_support:function(){try{if(!ic)return!1;var Vc='undefined'!=typeof openDatabase&&/(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent)&&!/BlackBerry/.test(navigator.platform),Wc='function'==typeof fetch&&-1!==fetch.toString().indexOf('[native code');return(!Vc||Wc)&&'undefined'!=typeof indexedDB&&'undefined'!=typeof IDBKeyRange}catch(Xc){return!1}}(),iterate:function(Vc,Wc){var Xc=this,Yc=new lc(function(Zc,$c){Xc.ready().then(function(){wb(Xc._dbInfo,oc,function(_c,ad){if(_c)return $c(_c);try{var bd=ad.objectStore(Xc._dbInfo.storeName),cd=bd.openCursor(),dd=1;cd.onsuccess=function(){var ed=cd.result;if(ed){var fd=ed.value;tb(fd)&&(fd=sb(fd));var gd=Vc(fd,ed.key,dd++);void 0===gd?ed.continue():Zc(gd)}else Zc()},cd.onerror=function(){$c(cd.error)}}catch(ed){$c(ed)}})}).catch($c)});return eb(Yc,Wc),Yc},getItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=new lc(function(Zc,$c){Xc.ready().then(function(){wb(Xc._dbInfo,oc,function(_c,ad){if(_c)return $c(_c);try{var bd=ad.objectStore(Xc._dbInfo.storeName),cd=bd.get(Vc);cd.onsuccess=function(){var dd=cd.result;void 0===dd&&(dd=null),tb(dd)&&(dd=sb(dd)),Zc(dd)},cd.onerror=function(){$c(cd.error)}}catch(dd){$c(dd)}})}).catch($c)});return eb(Yc,Wc),Yc},setItem:function(Vc,Wc,Xc){var Yc=this;Vc=gb(Vc);var Zc=new lc(function($c,_c){var ad;Yc.ready().then(function(){return ad=Yc._dbInfo,'[object Blob]'===nc.call(Wc)?jb(ad.db).then(function(bd){return bd?Wc:rb(Wc)}):Wc}).then(function(bd){wb(Yc._dbInfo,pc,function(cd,dd){if(cd)return _c(cd);try{var ed=dd.objectStore(Yc._dbInfo.storeName);null===bd&&(bd=void 0);var fd=ed.put(bd,Vc);dd.oncomplete=function(){void 0===bd&&(bd=null),$c(bd)},dd.onabort=dd.onerror=function(){var gd=fd.error?fd.error:fd.transaction.error;_c(gd)}}catch(gd){_c(gd)}})}).catch(_c)});return eb(Zc,Xc),Zc},removeItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=new lc(function(Zc,$c){Xc.ready().then(function(){wb(Xc._dbInfo,pc,function(_c,ad){if(_c)return $c(_c);try{var bd=ad.objectStore(Xc._dbInfo.storeName),cd=bd.delete(Vc);ad.oncomplete=function(){Zc()},ad.onerror=function(){$c(cd.error)},ad.onabort=function(){var dd=cd.error?cd.error:cd.transaction.error;$c(dd)}}catch(dd){$c(dd)}})}).catch($c)});return eb(Yc,Wc),Yc},clear:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){wb(Wc._dbInfo,pc,function($c,_c){if($c)return Zc($c);try{var ad=_c.objectStore(Wc._dbInfo.storeName),bd=ad.clear();_c.oncomplete=function(){Yc()},_c.onabort=_c.onerror=function(){var cd=bd.error?bd.error:bd.transaction.error;Zc(cd)}}catch(cd){Zc(cd)}})}).catch(Zc)});return eb(Xc,Vc),Xc},length:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){wb(Wc._dbInfo,oc,function($c,_c){if($c)return Zc($c);try{var ad=_c.objectStore(Wc._dbInfo.storeName),bd=ad.count();bd.onsuccess=function(){Yc(bd.result)},bd.onerror=function(){Zc(bd.error)}}catch(cd){Zc(cd)}})}).catch(Zc)});return eb(Xc,Vc),Xc},key:function(Vc,Wc){var Xc=this,Yc=new lc(function(Zc,$c){return 0>Vc?void Zc(null):void Xc.ready().then(function(){wb(Xc._dbInfo,oc,function(_c,ad){if(_c)return $c(_c);try{var bd=ad.objectStore(Xc._dbInfo.storeName),cd=!1,dd=bd.openCursor();dd.onsuccess=function(){var ed=dd.result;return ed?void(0===Vc?Zc(ed.key):cd?Zc(ed.key):(cd=!0,ed.advance(Vc))):void Zc(null)},dd.onerror=function(){$c(dd.error)}}catch(ed){$c(ed)}})}).catch($c)});return eb(Yc,Wc),Yc},keys:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){wb(Wc._dbInfo,oc,function($c,_c){if($c)return Zc($c);try{var ad=_c.objectStore(Wc._dbInfo.storeName),bd=ad.openCursor(),cd=[];bd.onsuccess=function(){var dd=bd.result;return dd?void(cd.push(dd.key),dd.continue()):void Yc(cd)},bd.onerror=function(){Zc(bd.error)}}catch(dd){Zc(dd)}})}).catch(Zc)});return eb(Xc,Vc),Xc}},rc='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',tc=/^~~local_forage_type~([^~]+)~/,uc='__lfsc__:',vc=uc.length,wc='arbf',xc='blob',yc='si08',zc='ui08',Ac='uic8',Bc='si16',Cc='si32',Dc='ur16',Ec='ui32',Fc='fl32',Gc='fl64',Hc=vc+wc.length,Ic=Object.prototype.toString,Jc={serialize:function(Vc,Wc){var Xc='';if(Vc&&(Xc=Ic.call(Vc)),Vc&&('[object ArrayBuffer]'===Xc||Vc.buffer&&'[object ArrayBuffer]'===Ic.call(Vc.buffer))){var Yc,Zc=uc;Vc instanceof ArrayBuffer?(Yc=Vc,Zc+=wc):(Yc=Vc.buffer,'[object Int8Array]'==Xc?Zc+=yc:'[object Uint8Array]'==Xc?Zc+=zc:'[object Uint8ClampedArray]'==Xc?Zc+=Ac:'[object Int16Array]'==Xc?Zc+=Bc:'[object Uint16Array]'==Xc?Zc+=Dc:'[object Int32Array]'==Xc?Zc+=Cc:'[object Uint32Array]'==Xc?Zc+=Ec:'[object Float32Array]'==Xc?Zc+=Fc:'[object Float64Array]'==Xc?Zc+=Gc:Wc(new Error('Failed to get type for BinaryArray'))),Wc(Zc+Ib(Yc))}else if('[object Blob]'===Xc){var $c=new FileReader;$c.onload=function(){var _c='~~local_forage_type~'+Vc.type+'~'+Ib(this.result);Wc(uc+xc+_c)},$c.readAsArrayBuffer(Vc)}else try{Wc(JSON.stringify(Vc))}catch(_c){console.error('Couldn\'t convert value into a JSON string: ',Vc),Wc(null,_c)}},deserialize:function(Vc){if(Vc.substring(0,vc)!==uc)return JSON.parse(Vc);var Wc,Xc=Vc.substring(Hc),Yc=Vc.substring(vc,Hc);if(Yc===xc&&tc.test(Xc)){var Zc=Xc.match(tc);Wc=Zc[1],Xc=Xc.substring(Zc[0].length)}var $c=Hb(Xc);switch(Yc){case wc:return $c;case xc:return db([$c],{type:Wc});case yc:return new Int8Array($c);case zc:return new Uint8Array($c);case Ac:return new Uint8ClampedArray($c);case Bc:return new Int16Array($c);case Dc:return new Uint16Array($c);case Cc:return new Int32Array($c);case Ec:return new Uint32Array($c);case Fc:return new Float32Array($c);case Gc:return new Float64Array($c);default:throw new Error('Unkown type: '+Yc);}},stringToBuffer:Hb,bufferToString:Ib},Kc={_driver:'webSQLStorage',_initStorage:function(Vc){var Wc=this,Xc={db:null};if(Vc)for(var Yc in Vc)Xc[Yc]='string'==typeof Vc[Yc]?Vc[Yc]:Vc[Yc].toString();var Zc=new lc(function($c,_c){try{Xc.db=openDatabase(Xc.name,Xc.version+'',Xc.description,Xc.size)}catch(ad){return _c(ad)}Xc.db.transaction(function(ad){ad.executeSql('CREATE TABLE IF NOT EXISTS '+Xc.storeName+' (id INTEGER PRIMARY KEY, key unique, value)',[],function(){Wc._dbInfo=Xc,$c()},function(bd,cd){_c(cd)})})});return Xc.serializer=Jc,Zc},_support:function(){return'function'==typeof openDatabase}(),iterate:function(Vc,Wc){var Xc=this,Yc=new lc(function(Zc,$c){Xc.ready().then(function(){var _c=Xc._dbInfo;_c.db.transaction(function(ad){ad.executeSql('SELECT * FROM '+_c.storeName,[],function(bd,cd){for(var dd=cd.rows,ed=dd.length,fd=0;fd<ed;fd++){var gd=dd.item(fd),hd=gd.value;if(hd&&(hd=_c.serializer.deserialize(hd)),void 0!==(hd=Vc(hd,gd.key,fd+1)))return void Zc(hd)}Zc()},function(bd,cd){$c(cd)})})}).catch($c)});return eb(Yc,Wc),Yc},getItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=new lc(function(Zc,$c){Xc.ready().then(function(){var _c=Xc._dbInfo;_c.db.transaction(function(ad){ad.executeSql('SELECT * FROM '+_c.storeName+' WHERE key = ? LIMIT 1',[Vc],function(bd,cd){var dd=cd.rows.length?cd.rows.item(0).value:null;dd&&(dd=_c.serializer.deserialize(dd)),Zc(dd)},function(bd,cd){$c(cd)})})}).catch($c)});return eb(Yc,Wc),Yc},setItem:function(Vc,Wc,Xc){return Ob.apply(this,[Vc,Wc,Xc,1])},removeItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=new lc(function(Zc,$c){Xc.ready().then(function(){var _c=Xc._dbInfo;_c.db.transaction(function(ad){ad.executeSql('DELETE FROM '+_c.storeName+' WHERE key = ?',[Vc],function(){Zc()},function(bd,cd){$c(cd)})})}).catch($c)});return eb(Yc,Wc),Yc},clear:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){var $c=Wc._dbInfo;$c.db.transaction(function(_c){_c.executeSql('DELETE FROM '+$c.storeName,[],function(){Yc()},function(ad,bd){Zc(bd)})})}).catch(Zc)});return eb(Xc,Vc),Xc},length:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){var $c=Wc._dbInfo;$c.db.transaction(function(_c){_c.executeSql('SELECT COUNT(key) as c FROM '+$c.storeName,[],function(ad,bd){var cd=bd.rows.item(0).c;Yc(cd)},function(ad,bd){Zc(bd)})})}).catch(Zc)});return eb(Xc,Vc),Xc},key:function(Vc,Wc){var Xc=this,Yc=new lc(function(Zc,$c){Xc.ready().then(function(){var _c=Xc._dbInfo;_c.db.transaction(function(ad){ad.executeSql('SELECT key FROM '+_c.storeName+' WHERE id = ? LIMIT 1',[Vc+1],function(bd,cd){var dd=cd.rows.length?cd.rows.item(0).key:null;Zc(dd)},function(bd,cd){$c(cd)})})}).catch($c)});return eb(Yc,Wc),Yc},keys:function(Vc){var Wc=this,Xc=new lc(function(Yc,Zc){Wc.ready().then(function(){var $c=Wc._dbInfo;$c.db.transaction(function(_c){_c.executeSql('SELECT key FROM '+$c.storeName,[],function(ad,bd){for(var cd=[],dd=0;dd<bd.rows.length;dd++)cd.push(bd.rows.item(dd).key);Yc(cd)},function(ad,bd){Zc(bd)})})}).catch(Zc)});return eb(Xc,Vc),Xc}},Lc={_driver:'localStorageWrapper',_initStorage:function(Vc){var Wc=this,Xc={};if(Vc)for(var Yc in Vc)Xc[Yc]=Vc[Yc];return Xc.keyPrefix=Xc.name+'/',Xc.storeName!==Wc._defaultConfig.storeName&&(Xc.keyPrefix+=Xc.storeName+'/'),Xb()?(Wc._dbInfo=Xc,Xc.serializer=Jc,lc.resolve()):lc.reject()},_support:function(){try{return'undefined'!=typeof localStorage&&'setItem'in localStorage&&'function'==typeof localStorage.setItem}catch(Vc){return!1}}(),iterate:function(Vc,Wc){var Xc=this,Yc=Xc.ready().then(function(){for(var dd,Zc=Xc._dbInfo,$c=Zc.keyPrefix,_c=$c.length,ad=localStorage.length,bd=1,cd=0;cd<ad;cd++)if(dd=localStorage.key(cd),0===dd.indexOf($c)){var ed=localStorage.getItem(dd);if(ed&&(ed=Zc.serializer.deserialize(ed)),void 0!==(ed=Vc(ed,dd.substring(_c),bd++)))return ed}});return eb(Yc,Wc),Yc},getItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=Xc.ready().then(function(){var Zc=Xc._dbInfo,$c=localStorage.getItem(Zc.keyPrefix+Vc);return $c&&($c=Zc.serializer.deserialize($c)),$c});return eb(Yc,Wc),Yc},setItem:function(Vc,Wc,Xc){var Yc=this;Vc=gb(Vc);var Zc=Yc.ready().then(function(){void 0===Wc&&(Wc=null);var $c=Wc;return new lc(function(_c,ad){var bd=Yc._dbInfo;bd.serializer.serialize(Wc,function(cd,dd){if(dd)ad(dd);else try{localStorage.setItem(bd.keyPrefix+Vc,cd),_c($c)}catch(ed){'QuotaExceededError'!==ed.name&&'NS_ERROR_DOM_QUOTA_REACHED'!==ed.name||ad(ed),ad(ed)}})})});return eb(Zc,Xc),Zc},removeItem:function(Vc,Wc){var Xc=this;Vc=gb(Vc);var Yc=Xc.ready().then(function(){var Zc=Xc._dbInfo;localStorage.removeItem(Zc.keyPrefix+Vc)});return eb(Yc,Wc),Yc},clear:function(Vc){var Wc=this,Xc=Wc.ready().then(function(){for(var $c,Yc=Wc._dbInfo.keyPrefix,Zc=localStorage.length-1;0<=Zc;Zc--)$c=localStorage.key(Zc),0===$c.indexOf(Yc)&&localStorage.removeItem($c)});return eb(Xc,Vc),Xc},length:function(Vc){var Wc=this,Xc=Wc.keys().then(function(Yc){return Yc.length});return eb(Xc,Vc),Xc},key:function(Vc,Wc){var Xc=this,Yc=Xc.ready().then(function(){var Zc,$c=Xc._dbInfo;try{Zc=localStorage.key(Vc)}catch(_c){Zc=null}return Zc&&(Zc=Zc.substring($c.keyPrefix.length)),Zc});return eb(Yc,Wc),Yc},keys:function(Vc){var Wc=this,Xc=Wc.ready().then(function(){for(var ad,Yc=Wc._dbInfo,Zc=localStorage.length,$c=[],_c=0;_c<Zc;_c++)ad=localStorage.key(_c),0===ad.indexOf(Yc.keyPrefix)&&$c.push(ad.substring(Yc.keyPrefix.length));return $c});return eb(Xc,Vc),Xc}},Mc=Array.isArray||function(Vc){return'[object Array]'===Object.prototype.toString.call(Vc)},Nc={},Oc={},Pc={INDEXEDDB:qc,WEBSQL:Kc,LOCALSTORAGE:Lc},Qc=[Pc.INDEXEDDB._driver,Pc.WEBSQL._driver,Pc.LOCALSTORAGE._driver],Rc=['clear','getItem','iterate','key','keys','length','removeItem','setItem'],Sc={description:'',driver:Qc.slice(),name:'localforage',size:4980736,storeName:'keyvaluepairs',version:1},Tc=function(){function Vc(Wc){for(var Xc in _a(this,Vc),Pc)if(Pc.hasOwnProperty(Xc)){var Yc=Pc[Xc],Zc=Yc._driver;this[Xc]=Zc,Nc[Zc]||this.defineDriver(Yc)}this._defaultConfig=gc({},Sc),this._config=gc({},this._defaultConfig,Wc),this._driverSet=null,this._initDriver=null,this._ready=!1,this._dbInfo=null,this._wrapLibraryMethodsWithReady(),this.setDriver(this._config.driver).catch(function(){})}return Vc.prototype.config=function(Wc){if('object'===(void 0===Wc?'undefined':hc(Wc))){if(this._ready)return new Error('Can\'t call config() after localforage has been used.');for(var Xc in Wc){if('storeName'==Xc&&(Wc[Xc]=Wc[Xc].replace(/\W/g,'_')),'version'==Xc&&'number'!=typeof Wc[Xc])return new Error('Database version must be a number.');this._config[Xc]=Wc[Xc]}return!('driver'in Wc&&Wc.driver)||this.setDriver(this._config.driver)}return'string'==typeof Wc?this._config[Wc]:this._config},Vc.prototype.defineDriver=function(Wc,Xc,Yc){var Zc=new lc(function($c,_c){try{var ad=Wc._driver,bd=new Error('Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver');if(!Wc._driver)return void _c(bd);for(var fd,cd=Rc.concat('_initStorage'),dd=0,ed=cd.length;dd<ed;dd++)if(fd=cd[dd],!fd||!Wc[fd]||'function'!=typeof Wc[fd])return void _c(bd);var gd=function(hd){Nc[ad]&&console.info('Redefining LocalForage driver: '+ad),Nc[ad]=Wc,Oc[ad]=hd,$c()};'_support'in Wc?Wc._support&&'function'==typeof Wc._support?Wc._support().then(gd,_c):gd(!!Wc._support):gd(!0)}catch(hd){_c(hd)}});return fb(Zc,Xc,Yc),Zc},Vc.prototype.driver=function(){return this._driver||null},Vc.prototype.getDriver=function(Wc,Xc,Yc){var Zc=Nc[Wc]?lc.resolve(Nc[Wc]):lc.reject(new Error('Driver not found.'));return fb(Zc,Xc,Yc),Zc},Vc.prototype.getSerializer=function(Wc){var Xc=lc.resolve(Jc);return fb(Xc,Wc),Xc},Vc.prototype.ready=function(Wc){var Xc=this,Yc=Xc._driverSet.then(function(){return null===Xc._ready&&(Xc._ready=Xc._initDriver()),Xc._ready});return fb(Yc,Wc,Wc),Yc},Vc.prototype.setDriver=function(Wc,Xc,Yc){function Zc(){ad._config.driver=ad.driver()}function $c(dd){return ad._extend(dd),Zc(),ad._ready=ad._initStorage(ad._config),ad._ready}function _c(dd){return function(){function ed(){for(;fd<dd.length;){var gd=dd[fd];return fd++,ad._dbInfo=null,ad._ready=null,ad.getDriver(gd).then($c).catch(ed)}Zc();var hd=new Error('No available storage method found.');return ad._driverSet=lc.reject(hd),ad._driverSet}var fd=0;return ed()}}var ad=this;Mc(Wc)||(Wc=[Wc]);var bd=this._getSupportedDrivers(Wc),cd=null===this._driverSet?lc.resolve():this._driverSet.catch(function(){return lc.resolve()});return this._driverSet=cd.then(function(){var dd=bd[0];return ad._dbInfo=null,ad._ready=null,ad.getDriver(dd).then(function(ed){ad._driver=ed._driver,Zc(),ad._wrapLibraryMethodsWithReady(),ad._initDriver=_c(bd)})}).catch(function(){Zc();var dd=new Error('No available storage method found.');return ad._driverSet=lc.reject(dd),ad._driverSet}),fb(this._driverSet,Xc,Yc),this._driverSet},Vc.prototype.supports=function(Wc){return!!Oc[Wc]},Vc.prototype._extend=function(Wc){gc(this,Wc)},Vc.prototype._getSupportedDrivers=function(Wc){for(var $c,Xc=[],Yc=0,Zc=Wc.length;Yc<Zc;Yc++)$c=Wc[Yc],this.supports($c)&&Xc.push($c);return Xc},Vc.prototype._wrapLibraryMethodsWithReady=function(){for(var Wc=0,Xc=Rc.length;Wc<Xc;Wc++)fc(this,Rc[Wc])},Vc.prototype.createInstance=function(Wc){return new Vc(Wc)},Vc}(),Uc=new Tc;Za.exports=Uc},{3:3}]},{},[4])(4)});function serialize(Ya){if(Ya&&'FORM'===Ya.nodeName){var Za,$a,_a=[];for(Za=Ya.elements.length-1;0<=Za;--Za)if(''!==Ya.elements[Za].name)switch(Ya.elements[Za].nodeName){case'INPUT':switch(Ya.elements[Za].type){case'text':case'hidden':case'password':case'button':case'reset':case'submit':_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].value));break;case'checkbox':case'radio':Ya.elements[Za].checked&&_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].value));break;case'file':}break;case'TEXTAREA':_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].value));break;case'SELECT':switch(Ya.elements[Za].type){case'select-one':_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].value));break;case'select-multiple':for($a=Ya.elements[Za].options.length-1;0<=$a;--$a)Ya.elements[Za].options[$a].selected&&_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].options[$a].value));}break;case'BUTTON':switch(Ya.elements[Za].type){case'reset':case'submit':case'button':_a.push(Ya.elements[Za].name+'='+encodeURIComponent(Ya.elements[Za].value));}}return _a.join('&')}}!function(Ya){var Za=!1;if('function'==typeof define&&define.amd&&(define(Ya),Za=!0),'object'==typeof exports&&(module.exports=Ya(),Za=!0),!Za){var $a=window.Cookies,_a=window.Cookies=Ya();_a.noConflict=function(){return window.Cookies=$a,_a}}}(function(){function Ya(){for(var ab,$a=0,_a={};$a<arguments.length;$a++)for(var bb in ab=arguments[$a],ab)_a[bb]=ab[bb];return _a}function Za($a){function _a(ab,bb,db){var eb;if('undefined'!=typeof document){if(1<arguments.length){if('number'==typeof(db=Ya({path:'/'},_a.defaults,db)).expires){var fb=new Date;fb.setMilliseconds(fb.getMilliseconds()+864e5*db.expires),db.expires=fb}db.expires=db.expires?db.expires.toUTCString():'';try{eb=JSON.stringify(bb),/^[\{\[]/.test(eb)&&(bb=eb)}catch(ob){}bb=$a.write?$a.write(bb,ab):encodeURIComponent(bb+'').replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),ab=(ab=(ab=encodeURIComponent(ab+'')).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent)).replace(/[\(\)]/g,escape);var gb='';for(var hb in db)db[hb]&&(gb+='; '+hb,!0!==db[hb]&&(gb+='='+db[hb]));return document.cookie=ab+'='+bb+gb}ab||(eb={});for(var ib=document.cookie?document.cookie.split('; '):[],jb=/(%[0-9A-Z]{2})+/g,kb=0;kb<ib.length;kb++){var lb=ib[kb].split('='),mb=lb.slice(1).join('=');this.json||'"'!==mb.charAt(0)||(mb=mb.slice(1,-1));try{var nb=lb[0].replace(jb,decodeURIComponent);if(mb=$a.read?$a.read(mb,nb):$a(mb,nb)||mb.replace(jb,decodeURIComponent),this.json)try{mb=JSON.parse(mb)}catch(ob){}if(ab===nb){eb=mb;break}ab||(eb[nb]=mb)}catch(ob){}}return eb}}return _a.set=_a,_a.get=function(ab){return _a.call(_a,ab)},_a.getJSON=function(){return _a.apply({json:!0},[].slice.call(arguments))},_a.defaults={},_a.remove=function(ab,bb){_a(ab,'',Ya(bb,{expires:-1}))},_a.withConverter=Za,_a}return Za(function(){})}),(()=>{'use strict';if('/'==location.pathname)void 0===Cookies.get('AccessToken')?location.href.includes('#access_token=')?(Cookies.set('AccessToken_Temp',location.href.split('/')[location.href.split('/').length-1].split('=')[location.href.split('/')[location.href.split('/').length-1].split('=').length-2].replace('&state',''),{expires:2592000,secure:!0}),location.replace('/login')):whenDomReady().then(()=>{document.querySelector('#button-login').addEventListener('click',Ya=>{Ya.preventDefault(),document.querySelector('#error').style.display='block',document.querySelector('#error').innerHTML='<div class=\'loader\'>Loading...</div>',navigator.onLine?location.href='https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo&redirect_uri=https://dnevnik-client.herokuapp.com/':document.querySelector('#error').innerHTML='<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">\u041E\u0444\u0444\u043B\u0430\u0439\u043D \xAF_(\u30C4)_/\xAF</p>'})}):location.replace('/main');else if('/main'==location.pathname){let Ya=[];navigator.onLine?(Ya.push(new Promise(Za=>Cookies.set('Offset',-new Date().getTimezoneOffset()/60)&&Za()).then(()=>{fetch('/dnevnik',{method:'POST',headers:{'Content-Type':'application/json'}}).then(Za=>{localforage.setItem('dnevnik',Za).then(()=>{whenDomReady().then(()=>{localforage.getItem('dnevnik').then($a=>{document.querySelector('#dnevnik-out').innerHTML=$a})})})})})),Ya.push(fetch('/stats',{method:'POST',headers:{'Content-Type':'application/json'}}).then(Za=>{localforage.setItem('stats',Za).then(()=>{whenDomReady().then(()=>{localforage.getItem('stats').then($a=>{document.querySelector('#stats-out').innerHTML=$a})})})}))):(localforage.getItem('stats').then(Za=>{null===Za?Ya.push(whenDomReady().then(()=>{document.querySelector('#stats-out').innerHTML='<h4 class="mdl-cell mdl-cell--12-col">\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u044B \xAF_(\u30C4)_/\xAF</h5>\u041A\u0430\u0436\u0435\u0442\u0441\u044F, \u0412\u044B \u0432 \u043E\u0444\u0444\u043B\u0430\u0439\u043D\u0435 :> </div>'})):Ya.push(whenDomReady().then(()=>{localforage.getItem('stats').then($a=>{document.querySelector('#stats-out').innerHTML=$a})}))}),localforage.getItem('dnevnik').then(Za=>{null===Za?Ya.push(whenDomReady().then(()=>{document.querySelector('#dnevnik-out').innerHTML='<h4 class="mdl-cell mdl-cell--12-col">\u0414\u043D\u0435\u0432\u043D\u0438\u043A</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u044B \xAF_(\u30C4)_/\xAF</h5>\u041A\u0430\u0436\u0435\u0442\u0441\u044F, \u0412\u044B \u0432 \u043E\u0444\u0444\u043B\u0430\u0439\u043D\u0435 :> </div>'})):Ya.push(whenDomReady().then(()=>{localforage.getItem('dnevnik').then($a=>{document.querySelector('#dnevnik-out').innerHTML=$a})}))})),Promise.all(Ya).catch(Za=>{console.log(Za)}),whenDomReady().then(()=>{document.querySelector('#dnevnik-date').addEventListener('submit',Za=>{Za.preventDefault();let $a=Za.target;navigator.onLine&&(document.querySelector('#dnevnik-out').innerHTML='<h4 class=\'mdl-cell mdl-cell--12-col\'>\u0414\u043D\u0435\u0432\u043D\u0438\u043A</h4></div><div class=\'section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone\'><div class=\'loader\'>Loading...</div></div>',new Promise(_a=>Cookies.set('Offset',-new Date().getTimezoneOffset()/60)&&_a()).then(()=>{fetch('/dnevnik',{method:'POST',headers:{'Content-Type':'application/json'},body:serialize($a)}).then(_a=>{localforage.setItem('dnevnik',_a).then(()=>{localforage.getItem('dnevnik').then(ab=>{document.querySelector('#dnevnik-out').innerHTML=ab,setTimeout(()=>{$a.submit()},240000)})})})}))}),document.querySelector('#dnevnik-stats').addEventListener('submit',Za=>{Za.preventDefault();let $a=Za.target;navigator.onLine&&(document.querySelector('#stats-out').innerHTML='<h4 class=\'mdl-cell mdl-cell--12-col\'>\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430</h4></div><div class=\'section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone\'><div class=\'loader\'>Loading...</div></div>',fetch('/stats',{method:'POST',headers:{'Content-Type':'application/json'},body:serialize($a)}).then(_a=>{localforage.setItem('stats',_a).then(()=>{localforage.getItem('stats').then(ab=>{document.querySelector('#stats-out').innerHTML=ab})})}))}),document.querySelector('#dnevnik-settings').addEventListener('submit',Za=>{Za.preventDefault();let $a=Za.target;navigator.onLine&&fetch('/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:serialize($a)}).then(_a=>{document.querySelector('#error').innerHTML(_a),setTimeout(()=>{location.replace('/')},500)})}),document.querySelector('#logout').addEventListener('click',Za=>{Za.preventDefault(),navigator.onLine&&(localforage.clear(),location.replace('/logout'))}),document.querySelector('#reset-storage').addEventListener('click',Za=>{Za.preventDefault(),navigator.onLine&&(localforage.clear(),location.reload())}),document.querySelector('#reset-sw').addEventListener('click',Za=>{Za.preventDefault(),navigator.onLine&&'serviceWorker'in navigator&&(navigator.serviceWorker.getRegistrations().then(function($a){$a.forEach(function(_a){_a.unregister()})}),localforage.clear(),location.replace('/logout'))})})}HTMLDocument.prototype.__defineGetter__('write',()=>{return null})})();
