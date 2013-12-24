  var radio_ourfirefox =  function(){
	
    const css = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
	const bss =  Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
	
	var drb_uri = 'http://douban.fm/radio';
	var drb_info  = "点击(打开/下一首) 右键(功能菜单)";
	var hadflg = false, mp3url = '',playlist = '',songs={} ,mp3id='';
	var cname = ['红心','私人','华语','欧美','粤语','摇滚','民谣','轻音乐','七零','八零','九零']
	var cid = ['-3','0','1','2','6','7','8','9','3','4','5']
	var shamData = "";
	var drb_i ,drb_b;
	var crtCID = 1,crtCNT = 0,songNum = 0
	var drb_SavePath='';
	var checkInterval = 30*60*1000;
	var logged = false,spflg=false;

	var index=0;
	var au;
	var urls;
	
    // log
	function log2(val) {
		if(Application.prefs.getValue('extensions.doubanradio.debug', null))
			css.logStringMessage("drb debug : "+val)
	}
	
	function ce(name,node,data,handles,insertflg){
			var object = document.createElement(name);
			for(var p in data){
				object.setAttribute(p,data[p])
			}
			for(var p in handles){
				object.addEventListener(p,handles[p],false)
			}
			if (typeof node === 'string') {
				node = document.getElementById(node)
			}
			if(!insertflg){
				if(node) node.appendChild(object)			
			}else{
				if(node) node.insertBefore(object,node.firstChild)
			}
			return object	
		}
	
	function setStatusIcon(type){
		if(type == 1){
			drb_i.setAttribute('src','chrome://doubanradio/skin/radio.jpg')			
		}else if (type == 2){
			drb_i.setAttribute('src','chrome://doubanradio/skin/radio2.jpg')						
		}else{
			drb_i.setAttribute('src','chrome://doubanradio/skin/radio3.gif')			
		}		
	}	

	function init(){
		
		var urlbarIcons = document.getElementById('urlbar-icons');
		
		drb_b = ce('browser',urlbarIcons,{type:'content',width:'1px',height:'1px'},{},false)
		drb_i = ce('image',urlbarIcons,
					{src:'chrome://doubanradio/skin/radio2.jpg',
					tooltiptext:drb_info,contextmenu:"radio_ourfirefox_popup",style:"width:20px;height:20px"},
					{click:function(e)e.button ==0?openOrNext():""},false)
					
		var ps = ce('popupset','main-window');
		var p = ce('menupopup',ps,{id:'radio_ourfirefox_popup'},{
			popupshowing: function(e){
				if (!hadflg) {
					e.preventDefault();
					return;
				}
				document.getElementById('drb_misp').setAttribute('tooltiptext',drb_SavePath);	
				document.getElementById('drb_misp').setAttribute('disabled',drb_SavePath==""?true:false);					
				document.getElementById('drb_mi1').setAttribute('disabled',index==""?true:false);
			//	document.getElementById('drb_mih').setAttribute('disabled',crtCID=="0"?false:true);					
				document.getElementById('drb_mi1').setAttribute('label',index==""?"重播":"重播 : "+ urls.song[index].title);					
			}
		})
		
		
		ce('menuitem',p,{label:'标记喜欢'},{click: function(){
			if(!logged){
				checkLogin(loveIt)
			}else{
				loveIt();
			}			
		}})	
		ce('menuitem',p,{label:'下载歌曲'},{click:saveFile})	
		ce('menuitem',p,{label:'歌曲信息'},{click:popup})	
		ce('menuitem',p,{label:'查找歌词'},{click:findLyric})	
		ce('menuitem',p,{label:'重播',id:'drb_mi1'},{click:playAgain})
		
		var m_channel = ce('menu',p,{label:'电台频道'},{
			click: function(e){
				log2("change : " + e.originalTarget.getAttribute('cid'))
				if (e.originalTarget.getAttribute('cid') !== '') {
					if(e.originalTarget.getAttribute('cid')=='0' && !logged){
						checkLogin(function(){
							openOrNext(e.originalTarget.getAttribute('cid'))
						})
						return;
					}
					openOrNext(e.originalTarget.getAttribute('cid'))
				}
			}
		})		
				
		var m_channel_p = ce('menupopup',m_channel,{},{popupshowing:function(e) {
			document.getElementById("dcid"+crtCID).setAttribute('checked',true);
		}})		
		
		for(var v in cname){
			ce('menuitem',m_channel_p,{label:cname[v],id:"dcid"+cid[v],cid:cid[v],type:'radio'})
		}
		
		ce('menuitem',p,{label:'获得帮助'},{click:getHelp})
		
		ce('menuitem',p,{id:'drb_misp',label:'重置保存路径'},{click: function(){
			drb_SavePath = ''
		}})	
		
		ce('menuitem',p,{label:'标记讨厌',id:'drb_mih'},{click:hateIt})	
		ce('menuitem',p,{label:'查看统计'},{click:radioStatistics})			
		ce('menuitem',p,{label:'关闭电台'},{click:stop})		
		
		
	}
	
	function radioStatistics(){
		openPage('http://douban.fm/mine?type=liked');
	}
	
	function openPage(val){
		gBrowser.selectedTab = gBrowser.addTab(val) 
	}
	
	function getSongInfo(key){
		try{
			return urls.song[index][key]; 
			//songs[mp3id][key]
		}catch(e){
			log2("songinfo error : " + e + " songinfo key "+ key + " songinfo  mp3id" +mp3id)
		}
	}

	// open radio			
	function openOrNext(cid){
		log2("openOrNext~~~")
		if(cid == null) cid = crtCID;
//		addObserver();
		hadflg = true;
		setStatusIcon(3)
//		shamRequest(cid)	
		Request("http://douban.fm/j/mine/playlist?type=n&from=radio&channel="+cid);

		
	}
	
	// close radio
	function stop(){
		//removeObserver();
		setStatusIcon(2)
	//	drb_b.loadURI("about:blank");
		//drb_b.contentDocument=null;
		au.pause();
		au.src="";
	}

	// love it
	function loveIt(){
		log2('loveit :' + playlist);
		var url="http://douban.fm/j/mine/playlist?type=r&sid="+urls.song[index].sid+"&channel="+cid+"&from=radio";

		sendXHR(playlist.replace(/type=\S&sid=\d*/g,"type=r&sid="+mp3id))
	}

	// hate it
	function hateIt(){
		log2('hateit : '+ playlist );
		 var url="http://douban.fm/j/mine/playlist?type=b&sid="+urls.song[index].sid+"&channel="+cid+"&from=radio";

		sendXHR(playlist.replace(/type=\S&sid=\d*/g,"type=b&sid="+mp3id),null,function(){
			log2("hateit : reload")
			openOrNext();
		})
	}
	function unloveIt(){
		 var httpRequest = new XMLHttpRequest();
		 var url="http://douban.fm/j/mine/playlist?type=u&sid="+urls.song[index].sid+"&channel="+cid+"&from=radio";
		 httpRequest.open('GET', url, true);
		}
	function skipIt(){
		 var httpRequest = new XMLHttpRequest();
		 var url="http://douban.fm/j/mine/playlist?type=s&sid="+urls.song[index].sid+"&channel="+cid+"&from=radio";
		 httpRequest.open('GET', url, true);
		foo();
		}
	// get help
	function getHelp(){
		openPage("http://www.ourfirefox.com/archives/1367") 
	}

	// 解码
    function rstr(val,flg){
		let tmp = "";		
		// 待改进
		for(var i =0 ;i<val.length;i++)
			/(\d|[a-z]|[A-Z])/g.test(val[i])? tmp+=val[i]:tmp+='%'+parseInt(val[i].charCodeAt(0)).toString(16)			
		return flg?tmp:decodeURIComponent(tmp)
	}
	
	function reloadMPlayer(){
		drb_b.loadURI(drb_uri);
	} 
	// 加码
	function rstr2(val){
		let tmp = "";		
		// 待改进
		for(var i =0 ;i<val.length;i++){
			if(val[i].charCodeAt(0)<128){
				tmp+=val[i]
			}else{
				let t = encodeURIComponent(val[i])
				t = t.split('%')
				var d = String.fromCharCode(parseInt(t[1],16))
				d+= String.fromCharCode(parseInt(t[2],16))
				d+= String.fromCharCode(parseInt(t[3],16))
				tmp+=d							
			}
		}
		return tmp
	}
	
	// Http监听
	function addObserver(){
		if(!hadflg) {
			bss.addObserver(browserObserver,"http-on-modify-request", false);
			bss.addObserver(browserObserver,"http-on-examine-response", false);
		}
		hadflg = true;
	}
	
	// 删除Http监听
	function removeObserver(){
		bss.removeObserver(browserObserver,"http-on-modify-request");
		bss.removeObserver(browserObserver,"http-on-examine-response");
		hadflg = false;crtCNT = 0;mp3id="";
	}

	// 找歌词
	function findLyric(){
		let searchUrl = "http://mp3.baidu.com/m?f=ms&tn=baidump3lyric&ct=150994944&lf=2&rn=10&lm=-1&word="
		let word = getSongInfo('title')+" "+getSongInfo('artist')
		var req = new XMLHttpRequest();  
		req.open('GET', 'http://www.baidu.com/s?ie=utf-8&wd='+word, true);  
		req.setRequestHeader("Content-Type", "text/xml; charset=gb2312");
		req.onreadystatechange = function (aEvt) {  
		   if (req.readyState == 4) {  
		      if(req.status == 200)  {
				var t = req.responseText.match(/word=[^'"&]+['"&]/i)
				openPage(searchUrl+t.toString().slice(5,-1)) 
		      }
		   }  
		 };  
		 req.send(null); 
	}	

	// 如果豆瓣登录则执行相关操作
	function checkLogin(fn){
		var fnc = fn;
		sendXHR("http://www.douban.com/mine",null,function(txt){
			if(txt.indexOf('<h1>登录豆瓣</h1>')>-1){
				alert("［标记喜欢］或者［私人电台］功能需要登录豆瓣");
				openPage("http://www.douban.com/")		
			}else{
				fnc();
				logged = true;
			}
		})
	}

	function sendXHR(val,header,handler){
		log2("sendXHR " + val)
		 var req = new XMLHttpRequest();  
		 req.open('GET', val, true);
		 req.onreadystatechange = function(aEvt){
		 	if (req.readyState == 4) {
		 		 if (req.status == 200) {
				 	if(handler!= null )
					  handler(req.responseText);
				 }
			}
		 }    
		 req.send(null); 
	}
	
	//==================
	
	function Request(url){

	    var httpRequest = new XMLHttpRequest();

	httpRequest.open('GET', url, true);
	httpRequest.onreadystatechange = function(){
	    //console.log(httpRequest.readyState);

	    if (httpRequest.readyState == 4) 
		if (httpRequest.status == 200)
		{
			
	                urls=JSON.parse(httpRequest.responseText);
			index=0;
			startPlay();
	    }
	};



	   // httpRequest.onload = readyStateChange;


	//console.log(httpRequest, url);

	httpRequest.send(null);
	}
	function foo(){
	index=index+1;
	while(index<urls.song.length&&urls.song[index].albumtitle.match("豆瓣FM"))
		index=index+1;
	if(index<urls.song.length){
		
		au.src=urls.song[index].url;	

		au.play();
		
		setStatusIcon(1)
		var timeS=Math.round(new Date().getTime() / 1000);
		logFile("\n"+urls.song[index].sid+" "+timeS);
		popup();
		
		}else Request("http://douban.fm/j/mine/playlist?type=n&from=radio&channel="+cid);
	
	au.addEventListener('ended', foo);
	}

	function startPlay(){
		if(typeof au == "undefined"||au==null||au.tagName==null||!au.tagName.match(/AUDIO/i)){
			au=drb_b.contentDocument.createElement("audio");
			au.preload=true;
		}
//	var urls=JSON.parse(shamData);
//	au.src=urls.song[index].url;
	
	//alert(au.src);
//	au.play();

	foo();
	
	}
	//==================
	
	// 拦截和预请求
	function shamRequest(scid,flg,againflg,againflg2){
		if(playlist ==""){
			playlist = "http://douban.fm/j/mine/playlist?type=n&channel="+scid			
		}else{
		    playlist = playlist.slice(0,-1)+scid
		}
		log2("shamRequest : "+playlist)
		var req = new XMLHttpRequest();  
		req.open('GET', playlist, true);  
		req.onreadystatechange = function (aEvt) {  
		   if (req.readyState == 4) {  
		      if (req.status == 200) {
			  	log2("shamRequest ： " + req.responseText)
				var t = req.responseText;
				// 重放歌曲
				if(againflg){
					var i = JSON.stringify(songs[mp3id])
					log2("sham 3 " + i)
					var idx = t.indexOf('[{'),idx2 = t.indexOf('}') 
					t = t.substring(0,idx+1)+i+t.substring(idx2+1)
				}
				//过滤广告
				t = adFilter(t)
			  	t = rstr2(t);
			  	log2("shamRequest 2 ： " + t)
			  	shamData = t;
				if(flg) return;
				songNum = 0 ;
				crtCNT = 0
				crtCID = scid 
				//reloadMPlayer();
				startPlay();
				// 重播时的歌曲信息提示
				if (againflg) {
					spflg = true;
					popup();					
				}
			  }
		   }
		}
		req.send(null);   
	}
	
	// 过滤广告
	function adFilter(t){
		if(Application.prefs.getValue('extensions.doubanradio.fliter', null)) return t;
		try {
			log2('adFilter~~');
			let tmp  = JSON.parse(t)
			tmp.song = tmp.song.filter(isAD)
			log2('adFilter : ' + tmp.song)
			return JSON.stringify(tmp)
		}catch(e){
			openOrNext();
			throw e;
		}
		function isAD(element, index, array) {
  				return /^\d{1,}/.test(element['sid']);
		}

	}
	
	function playAgain(){
		shamRequest(crtCID,null,true)				
	}

	// music info
	function popup() {
		  log2("popup : " + mp3id +" name " + getSongInfo('title'))
		//  if(!hadflg) return;
		  let alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);  
		  let image = getSongInfo('picture').replace(/\\/g,'');
		  let songTitle = getSongInfo('title');
		  let album = getSongInfo('albumtitle');
		  let artist = getSongInfo('artist');
		  let l = {
			observe: function(subject, topic, data) {
				if(topic=='alertclickcallback')
					  openPage("http://www.douban.com"+getSongInfo('album').replace(/\\/g,''))
				  
			}  }
    		alertsService.showAlertNotification(image, artist, songTitle +" :: " + album, true, "",l , "");  
	}	
	
	// download mp3		
	function saveFile(data){
		if(!hadflg) return;
		var fp =  Cc["@mozilla.org/filepicker;1"].getService(Components.interfaces.nsIFilePicker)
		fp.init(window, 'Save Douban Music',fp.modeSave)
		fp.defaultExtension  = 'mp3';	
		fp.defaultString = getSongInfo('title')+"-"+getSongInfo('artist')+'.mp3';
		fp.appendFilter('MP3','*.mp3');
		if(drb_SavePath!=""){
			let aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
			aFile.initWithPath(drb_SavePath+getSongInfo('title')+"-"+getSongInfo('artist')+'.mp3');
			downloadMp3(aFile,makeURI(mp3url))	
			return;					
		}
		
		var rv = fp.show()
		if (rv == fp.returnOK || rv == fp.returnReplace) {			
			downloadMp3(fp.file,makeURI(mp3url))
			drb_SavePath = fp.file.path.replace(fp.file.leafName,'')
		}
		
		function downloadMp3(nsIFile,uriToFile){
			var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].
			createInstance(Components.interfaces.nsIWebBrowserPersist);
			const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
			const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
			persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;
			persist.saveURI(uriToFile, null, null, null, "", nsIFile);
			loveIt();
			alert("ok");
		}
		
		function makeURI(aURL) {
		  	var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		  	return ioService.newURI(aURL, null, null);
		}
	}
	 
  	function CCIN(cName, ifaceName){
    		return Components.classes[cName].createInstance(Components.interfaces[ifaceName]);
	}

	var browserObserver = {
			 observe: function(aSubject, aTopic, aData){
	 			 if (aTopic == "http-on-examine-response") {
					aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
					var doc = this.getDoc(aSubject);
					if (doc != null && doc===drb_b.contentDocument) {	
						log2("browser all : " + aSubject.URI.spec);
						if(aSubject.URI.spec.indexOf('http://douban.fm/j/mine/playlist')>-1 
								&& aSubject.URI.spec.indexOf('type=e')>-1){
							// 统计次数，歌单快放时后，刷新shamData备用。
							if(++crtCNT== songNum - 3){
								log2("browser shamRequest~~")
								shamRequest(crtCID,true)								
							}
							log2('browse count : '+ crtCNT + " max : " + songNum)
						} else if(aSubject.URI.spec.indexOf('mine/playlist')>-1){
							log2('browser playlist :' + aSubject.URI.spec)	
							if (!spflg) {
								setStatusIcon(3)
								spflg = false;
							}
							playlist =  aSubject.URI.spec;
							var newListener = new TracingListener();
							aSubject.QueryInterface(Components.interfaces.nsITraceableChannel);
							newListener.originalListener = aSubject.setNewListener(newListener);;
						}else if (aSubject.URI.spec.indexOf('.mp3')>-1) {
							setStatusIcon(1)
							mp3url = aSubject.URI.spec;
							mp3id = mp3url.match(/p\d*/g)[1].replace('p','')
							log2(" browser mp3id : "+mp3id+ " browser mp3 :" +aSubject.URI.spec )
							popup()
						}
					}
				  }
			},
			getDoc: function (aChannel) {
			  try {
					var notificationCallbacks =  aChannel.notificationCallbacks ? aChannel.notificationCallbacks : aChannel.loadGroup.notificationCallbacks;
					if (!notificationCallbacks) return null;
					var domWin = notificationCallbacks.getInterface(Components.interfaces.nsIDOMWindow);
					return domWin.top.document;
			  }
			  catch (e) {return null;}
			}
		}

	 function TracingListener() {}  
	   
	 TracingListener.prototype = {  
	   	songs :"",
 		originalListener: null,
		
		onDataAvailable: function(request, context, inputStream, offset, count){
		 	var binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1","nsIBinaryInputStream");
			var storageStream = CCIN("@mozilla.org/storagestream;1","nsIStorageStream");
			var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1","nsIBinaryOutputStream");

			binaryInputStream.setInputStream(inputStream);
			log2("onDataAvailable 使用shamData~")
			log2("onDataAvailable "+ shamData)
			var data =shamData;	
			this.songs += data;
			var newcount = data.length;
						
			storageStream.init(8192, newcount, null);
			//log2("listen data "+ data)
			shamData = " ";
			
			binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
			binaryOutputStream.writeBytes(data, newcount);
	
			this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, newcount);
	    },

	    onStartRequest: function(request, context){
			this.originalListener.onStartRequest(request, context);
	    },

	    onStopRequest: function(request, context, statusCode){
			log2("onStopRequest 转换数据 开始")
			try{
				let tmpSongs  = JSON.parse(rstr(this.songs))['song']
				for(var i = 0;i<tmpSongs.length;i++){
					log2("onStopRequest "+ tmpSongs[i]['sid'] + " " + tmpSongs[i]['title'])
					songs[tmpSongs[i]['sid']]=tmpSongs[i]
				}
				songNum += tmpSongs.length;
				log2("onStopRequest " + songNum)
			}catch(e){
				log2("onStopRequest 错误 "+ e);
				log2("onStopRequest 错误内容 : " + this.songs);
				log2("onStopRequest 刷新播放器");
				openOrNext();
			};
			this.originalListener.onStopRequest(request, context, statusCode);
			log2("onStopRequest 转换数据 结束 ")			
	    },

	    QueryInterface: function(aIID){
			if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)){
			    return this;
			}
			throw Components.results.NS_NOINTERFACE;
	    }
	 }
	 
	return {open:openOrNext,close:stop,download:saveFile,showInfo:popup,findLyric:findLyric,init:init}
}()
		window.addEventListener("load", radio_ourfirefox.init, false);

function getFile2(fileName){
    var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
    file.append("doubanradio")
    file.append(fileName)
    return file
 }
function logFile(textstr){
    	//alert(textstr);
    	
    	
    		var file=getFile2("myinfo2.txt");
    		Components.utils.import("resource://gre/modules/NetUtil.jsm");
    		Components.utils.import("resource://gre/modules/FileUtils.jsm");

    		// file is nsIFile, data is a string

    		// You can also optionally pass a flags parameter here. It defaults to
    		// FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    		var ostream = FileUtils.openFileOutputStream(file,FileUtils.MODE_WRONLY |FileUtils.MODE_CREATE | FileUtils.MODE_APPEND);
    	//	alert(FileUtils.MODE_APPEND);
    		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
    		                createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    		converter.charset = "UTF-8";
    		var istream = converter.convertToInputStream(textstr);

    		// The last argument (the callback) is optional.
    		NetUtil.asyncCopy(istream, ostream, function(status) {
    		  if (!Components.isSuccessCode(status)) {
    		    // Handle error!
    		    return;
    		  }

    		  // Data has been written to the file.
    		});
    		
    }
