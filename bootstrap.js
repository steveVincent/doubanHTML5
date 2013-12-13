/* ***** BEGIN LICENSE BLOCK *****
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/
 * 
 * The Original Code is PictuTools Mozilla Extension.
 * 
 * The Initial Developer of the Original Code is
 * Copyright (C)2012 Diego Casorran <dcasorran@gmail.com>
 * All Rights Reserved.
 * 
 * ***** END LICENSE BLOCK ***** */

let {classes: Cc, interfaces: Ci, utils: Cu} = Components,tn,addon;

Cu.import("resource://gre/modules/Services.jsm");

function rsc(n) 'resource://' + addon.tag + '/' + n;

let spec = [
	
	//{e:'menu',d:{label:'Edit'},i:[
			
	{e:'menuitem',d:{label:'Ancient Look',tooltiptext:'Makes the image look like very old photographs',url:'http://labs.wanokoto.jp/olds#ended',ja:'data[Old][url]=##u'}},
			
	
	
	{e:'menuitem',d:{label:'Google',tooltiptext:'Reverse image search using Google Images',url:'http://www.google.com/searchbyimage?hl=en&safe=off&client=firefox-a&rls=org.mozilla:en-US:official&site=search&image_url=##u'}},
			

	
			{e:'menuitem',d:{label:'Decode QR Code',tooltiptext:'Lets you decode a 1D or 2D barcode',url:'http://zxing.org/w/decode?u=##u&full=true'}},
			{e:'menuitem',d:{label:'i2OCR',tooltiptext:'Free online OCR that converts images into editable text.',url:'http://www.i2ocr.com?i2ocr_url=##u&i2ocr_languages=cn%2Cchi_sim#i2ocr_form'}},
			//'http://www.sciweavers.org/free-online-ocr?url=##u#i2ocr_form'}},
		//]}	
];

function ic(o,n) {
	try {
		let u = Services.io.newURI(n.substr(0,let (x = n.indexOf('##')) ++x || n.length),null,null);
		o.addEventListener('error',function() {
			this.setAttribute('image',u?u.prePath + '/favicon.ico':rsc('icon.png'));
			u = null;
		},false);
		o.setAttribute('image',u.resolve('favicon.ico'));
	} catch(e) {
		o.setAttribute('image',rsc('icon.png'));
	} finally {
		o=n= null;
	}
}

function lo(a,d) {
	a.addEventListener("load", function() {
		a.removeEventListener("load", arguments.callee, true);
		a.contentWindow.scrollTo(0,4096);
		a=d=null;
	}, true );
}

function handler(ev) {
	let o = ev.target, l = tn.src, d = tn.ownerDocument, u = o.getAttribute('url'), w = d.defaultView;
	
	if(!(/^http/i.test(l))) {
		w.alert(_('main.invalidfile') || 'Sorry, this is not a supported image file (ie. does not belong to the http protocol)');
	} else {
		let p = o.hasAttribute('ja'),s,j,fc = function(a,b) {
			switch(b) {
				case 'u': return encodeURIComponent(l);
				case 't': return encodeURIComponent(tn.title||tn.alt||d.title);
			}
		};
		
		u = u.replace(/##(\w)/g,fc);
		
		try {
			let b = Services.wm.getMostRecentWindow("navigator:browser").getBrowser(),
				t = b.selectedTab = b.addTab();
				//rsc('loading.png')
			if(p) {
				p = o.getAttribute('ja').replace(/##(\w)/g,fc);
				j = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
				s = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
				s.setData(p,p.length);
				j.addHeader("Content-Type", "application/x-www-form-urlencoded");
				j.addContentLength = true;
				j.setData(s);
				d=function()b.loadURIWithFlags(u,0,null,null,j);
			} else {
				d=function()b.loadURI(u);
			}
			w.setTimeout(function()(d(),o.hasAttribute('opt') && lo(b.getBrowserForTab(t),o)||0),140);
		} catch(e) {
			w.alert(e);
		}
	}
}

function attachReady(window) {
	if(!window || window.location != 'chrome://browser/content/browser.xul')
		return;
	
	function c(n) window.document.createElement(n);
	function z(n) n.toLowerCase().replace(/[^\w]/g,'');
	function e(e,a) {
		if((e=c(e))&&a)
			for(let x in a)e.setAttribute(x,a[x]);
		return e;
	}
	// let localeStrings = [];
	function u(i,m) {
		let o;
		if(i.d) {
			i.d.tag = z(i.d.label);
			i.d.id=i.d.id||((m.id.indexOf(addon.tag)==0?m.id:addon.tag)+'-'+i.d.tag);
			i.d['class'] = i.e + '-iconic';
			
			if(_) {
				let base = i.e + '.' + (m.hasAttribute('tag') ? m.getAttribute('tag') + '.' : '') + i.d.tag;
				// localeStrings.push(base + ': '+i.d.label);
				
				i.d.label = _(base) || i.d.label;
				// if(i.d.tooltiptext)
					// localeStrings.push(base + '.tooltiptext: '+i.d.tooltiptext);
				
				i.d.tooltiptext = _(base + '.tooltiptext') || i.d.tooltiptext;
				if(!i.d.tooltiptext) delete i.d.tooltiptext;
			}
		}
		m.appendChild(o=e(i.e,i.d));
		switch(i.e) {
			case 'menu':
				let n = e('menupopup',i.d);
				o.appendChild(n);
				if(i.i) for each(let s in i.i) u(s,n);
				o.setAttribute('image',rsc('icons/'+i.d.tag+'.png'));
				return (n.removeAttribute('id'), n);
			case 'menuitem':
				
				o.addEventListener('command', handler, true);
				ic(o,i.d.url);
			default:
				break;
		}
		return o;
	}
	
	window.setTimeout(function() {
		let p = window.document.getElementById('contentAreaContextMenu');
		p.addEventListener('popupshown',lis,false);
		p=u({e:'menu',d:{label:addon.name,id:addon.tag}},p);
		for each(let i in spec)u(i,p);
		//word2Count();
		// window.alert(localeStrings.join("\n"));
	/* 	let desc = [];
		for each(let z in spec) {
			if(!z.i||z.d.label == 'Convert')continue;
			desc.push('&oplus; '+z.d.label+':<ol>');
			for each(let m in z.i) {
				if(!m.d)continue;
				desc.push('<li><b>'+m.d.label+'</b>: <em>'+m.d.tooltiptext+'</em></li>');
			}
			desc.push('</ol>');
		}
		let fmts = [];
		for each(let f in spec[0].i) if(f.d)fmts.push(f.d.label.replace(/to|format|\s/gi,''));
		desc.push('It also lets you convert images to the formats '+fmts.join(', '));
		window.alert(desc.join("\n")); */
	},901);
}
function attach(domWindow) {
	if(domWindow.document.readyState == "complete") {
		attachReady(domWindow);
	} else {
		domWindow.addEventListener('load', function(ev) {
			domWindow.removeEventListener(ev.type, arguments.callee, false);
			attachReady(domWindow);
		}, false);
	}
}

function detach(window) {
	let $ = function(n) window.document.getElementById(n),
		m = $('contentAreaContextMenu');
	m.removeEventListener('popupshown',lis,false);
	m.removeChild($(addon.tag));
}

let lis = {
	onOpenWindow: function(aWindow) {
		let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow)
		attach(domWindow)
	},
	onCloseWindow: function() {},
	onWindowTitleChange: function() {},
	handleEvent: function(ev) {
		switch(ev.type) {
			case 'popupshown':
				if(ev.target.id == 'contentAreaContextMenu') {
					ev.target.addEventListener('popuphidden',this,false);
					ev.target.ownerDocument.getElementById(addon.tag).hidden =
						!((tn = ev.originalTarget.triggerNode) instanceof Ci.nsIImageLoadingContent);
				}
				break;
			case 'popuphidden':
				if(ev.target.id == 'contentAreaContextMenu') {
					tn = null;
					ev.target.removeEventListener('popuphidden',this,false);
				}
			default:
				break;
		}
	}
};

function setwm(x) {
	let e,f = x ? attach : detach,wm = Services.wm;
	
	wm[x ? 'addListener' : 'removeListener'](lis);
	
	e = wm.getEnumerator("navigator:browser");
	while(e.hasMoreElements())
		f(e.getNext().QueryInterface(Ci.nsIDOMWindow));
}

(function(global) global.loadSubScript = function(file,scope)
	Services.scriptloader.loadSubScript(file,scope||global))(this);

function setup(data) {
	
	let io = Services.io;
	
	(addon = data).tag = data.name.toLowerCase().replace(/[^\w]/g,'');
	
	io.getProtocolHandler("resource")
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(addon.tag,
			io.newURI(__SCRIPT_URI_SPEC__+'/../',null,null));
	
	loadSubScript(rsc('locale.js'));
	setwm(1);
}

function startup(data) {
	let tmp = {};
	Cu.import("resource://gre/modules/AddonManager.jsm", tmp);
	tmp.AddonManager.getAddonByID(data.id,setup);
}

function shutdown(data, reason) {
	if(reason == APP_SHUTDOWN)
		return;
	
	setwm();
	Services.io.getProtocolHandler("resource")
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(addon.tag,null);
}

function install(data, reason) {}
function uninstall(data, reason) {}
