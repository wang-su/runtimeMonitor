runtimeMonitor
==============

this is a DevTools for Nodejs.

用于想看到内部执行情况，如dump出一个数值或数据，或者在某些情况下执行一些操作比如process.exit(),或者想对一些对像做一些操作，插数据啊，删数据啊，改变对像属性啊，值行一些特殊的非正常业务驱动的动作等等。
这里提供一个html页面，上面列出你想看到的值（需要自己在代码里设置），也有一些按钮用于执行你的动作（需要你自己设置），然后每5秒钟会自动刷新一次便于监视，因为必竟叫 Monitor.

拷贝两个文件到可以require到的任意位置. 并在代码中require('runtimeMonitor.js').

会自动在全局创建一个Monitor对像.

但是建议使用如下使用方式. 

if(GLOBAL.Monitor){

	var m = Monitor;
	
	m.setVisible('key','value');
	
	m.addAction('name',function(){
		// do someting...
	});
}

如何启动server. 其实有两个方式，第一个方式是把这个东西运行在一个已存在的node httpServer上。

如：

	  var globalServer = http.createServer();
    
    globalServer.listen(PORT, function() {
        console.log('Server Listening on ' + PORT);
    });
    
    globalServer.on('request', runner);
    
    globalServer.on('request', function(req,res){
        
        
        if(res.wlock){  // 处理标记，如果为true，则表示已被我的代码处理了，你们就不要再对这个访问进行处理了。
            return;
        }
        // 你可以继续你的http请求处理
        res.writeHead(404);
        res.end("no content");
        
    });

另外一个方式是用在你在开发一个模块时，如下：

var M = Monitor;
M.setPrefix("abc");   // 给个前缀
M.selfService(8080);  // 给个端口 

这种情况下，直接打开你的浏览器访问 8080端口，然后加上 /abc 即可. 
我将提供一个自己能跑的傻呼呼的HTTP服务，其实我就是把更上面的几行代码包装了一下。

*** 注意：由于懒得实现权限认证功能，（你可以在代码里看到写了一半的httpSession的实现，但是有那么一秒钟开始，我认为不留安全问题的最安全方式就是干掉可能出安全问题的代码。这叫剃刀原理）所以在代码发布时，请将之移除，以免存在安全问题。

PS:
有些方法暂时没测试，可能有坑，所以不建议保留到线上应用，除了以上的安全问题（比如你自己留了太多的action或者加了敏感的visible）也可能有其它的问题，比如内存泄露等必竟你不删引用我也不删。

API ：

Monitor.setPrefix(str);
设置一个访问的前缀，因为这个东西经常运行在你已有写出来的Web Server实现上，所以需要做一个区分。默认的前置是 smr_monitor

Monitor.canBeHandle(url);
判断一个URL是不是可以被handel，也就是以上面那个setPrefix中设置的str为前缀的url访问。

Monitor.execute(req,res);
如果上面的canBeHanle返回值为true，那么，你可以把request与response扔给这个函数来处理。

Monitor.selfService(port);
运行内部提供的简单httpServer来提供访问。 port是一个表示端口的数字。比如 8080. 默认是8088.

Monitor.setVisible(key,value);
增加或设置一个可见对像，key是一个string, value可以是一个值，也可以是一个无参调用并有确切返回值的function.所有的返回都将被JSON化并输出到页面上.

Monitor.getVisible(key);
获得你添加的一个visible的值，一般情况，你是用不到这个东西了。但是如果你希望有一些依赖其它的key值组合的值，你可以使用;

Monitor.removeVisible(key);
用来删除的，不解释，其实我也可以不写，但是，强迫症，码农们你们懂的。

Monitor.addAction(key,fun);
增加一个代码中的动作，key是一个字符串，fun是一个无参调用的function。将自动在页面生成一个按钮(在页面最下面，如果找不到，请下拉。使劲拉，这取决于你加了多少个Visible的东西，我试着加了几百个，有些头晕，但是懒得改页面实现了。能用即可)，在使用的时候，你可以将这个放在任意的闭包里，以便于获得闭包内对像的引用。

Monitor.removeAction(key);
用来删除的，不解释，其实我也可以不写，但是，强迫症，码农们你们懂的。

