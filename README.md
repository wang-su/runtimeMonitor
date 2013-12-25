#runtimeMonitor

>this is a DevTools for Nodejs.

##物种起源

在平时的开发过程中,我经常希望看到实时的运行状态,如特别的变量的值,一些统计数据等,并且在特定的情况下,希望可以触发一些用于测试目的或其它目地的而存在的动作,如提供测试数据,模拟运行状态,制造错误条件等,如何提供这些功能并使这些额外的内容可控,始终是一个问题.

另外由于个人习惯,经常在每个模块的开发过程中顺路在文件中写一些代码用于测试文件内不对外的一些方法或进行一些开发中的功能或性能的自测.如何管理这些代码并且在需要的时候能随时执行测试case便成了一个问题.

于是有一些代码不断的堆积,不停演变,最终进化出了这个工具.用于想看到内部执行情况，如dump出一个数值或数据，或者在某些情况下执行一些操作比如process.exit(),或者想对一些对像做一些操作，插数据啊，删数据啊，改变对像属性啊，执行一些特殊的非正常业务驱动的动作等等。 这里提供一个html页面，上面列出你想看到的值（需要自己在代码里设置），也有一些按钮用于执行你的动作（需要你自己设置），然后每5秒钟会自动刷新一次便于监视，因为必竟叫 Monitor. 另外还会提供一个单测的管理能力

##使用方法

获得monitor

	npm install runtime-monitor

然后在代码中引入

	require('runtime-monitor')

会自动在全局创建一个Monitor对像,但是建议使用如下使用方式.

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

    globalServer.on('request', function(req,res){
        var url = req.url;
        if(GLOBAL.Monitor && Monitor.canBeHandle(url)){
            Monitor.execute(req,res);
        }else {
    		// 你可以继续你的http请求处理
            res.writeHead(404);
            res.end("no content");
    	};
    });
    
另外一个方式是用在你在开发一个模块时，如下：

    var M = Monitor; 
    M.setPrefix("abc"); // 给个前缀
    M.selfService(8080); // 给个端口

这种情况下，直接打开你的浏览器访问 8080端口，然后加上 /abc 即可. 我将提供一个自己能跑的傻呼呼的HTTP服务，其实我就是把更上面的几行代码包装了一下。

**注意**：由于懒得实现权限认证功能，（你可以在代码里看到写了一半的httpSession的实现，但是有那么一秒钟开始，我认为不留安全问题的最安全方式就是干掉可能出安全问题的代码。这叫剃刀原理）所以在代码发布时，还请将移除require，以免存在安全问题。

**PS**: 有些方法暂时没测试，可能有坑，所以不建议保留到线上应用，除了以上的安全问题（比如你自己留了太多的action或者加了敏感的visible）也可能有其它的问题，比如内存泄露等必竟你不删引用我也不删。

##API ：

###Monitor.setPrefix(str); 

设置一个访问的前缀，因为这个东西经常运行在你已有写出来的Web Server实现上，所以需要做一个区分。默认的前置是 smr_monitor

###Monitor.canBeHandle(url); 

判断一个URL是不是可以被handel，也就是以上面那个setPrefix中设置的str为前缀的url访问。

###Monitor.execute(req,res); 

如果上面的canBeHanle返回值为true，那么，你可以把request与response扔给这个函数来处理。

###Monitor.selfService(port); 

运行内部提供的简单httpServer来提供访问。 port是一个表示端口的数字。比如 8080. 默认是8088.

###Monitor.setVisible(key,value); 

增加或设置一个可见对像，key是一个string, value可以是一个值，也可以是一个无参调用并有确切返回值的function.所有的返回都将被JSON化并输出到页面上.

###Monitor.getVisible(key); 

获得你添加的一个visible的值，一般情况，你是用不到这个东西了。但是如果你希望有一些依赖其它的key值组合的值，你可以使用;

###Monitor.removeVisible(key); 

用来删除的，不解释，其实我也可以不写，但是，强迫症，码农们你们懂的。另外，key可以是个正则，用于删除一堆

###Monitor.addAction(key,fun); 

增加一个代码中的动作，key是一个字符串，fun是一个无参调用的function。将自动在页面生成一个按钮(在新版本里被移动到了页面的左侧,防止在下面的时候因为设置了太多的visible导至的使用困难)，在使用的时候，你可以将这个放在任意的闭包里，以便于获得闭包内对像的引用。

###Monitor.removeAction(key); 

用来删除的，不解释，其实我也可以不写，但是，强迫症，码农们你们懂的。另外，key可以是个正则，用于删除一堆

###Monitor.getUT(fileName);

用来载入一个单测文件,通过这个方法可以一部份单测代码移至开发文件之外. 方法返回一个控制对像.你需要重新实现这个对像上的几个事件方法.

###Monitor.getUT.executeCode;

由Monitor.getUT方法创建并返回,代表一个单测文件对像, 存在以下方法:

	/**
	 * 重新跑一次测试.
	 */
	reTest:function(){}

存在以下几个事件,**其中parse方法必须在希望被执行的上下文内被重写.用于使单测代码取得所需的执行空间.** 其它的事件方法可以根据需要进行重写.

	/**
	 * 
	 * 测试内容载入完成时执行一次,可以重写这个方法用于获得载入完成事件.
	 * 
	 * @param context {Object}
	 *      一个引用的上下文对像,在将在ut的执行代码中绑定一些值等.是一个辅助对像.每个ut使用一个.
	 *      在parse的时候,可以用于放置一些初始化的对像和值等.如果改变方法的参数名称,则在ut.js中使用时,也要随之更改.
	 *      并且在测试的过程中, 测试的调度代码也会向上面写入一些相关的信息.
	 */
	onload = function(context){};
	/**
	 * 
	 * 用于解析载入的ut文件的内容,并获得待测试的业务内容的执行范围
	 * 正常情况下,直接使用如下格式的functin即可以满足执行要求
	 * 
	 *       function(code,context){
	 *          return eval(code);
	 *       }
	 * 
	 * @param code {String}
	 *      已经处理过的代码的字符串表示.
	 *      
	 * @param context  {Object}
	 *      一个引用的上下文对像,在将在ut的执行代码中绑定一些值等.是一个辅助对像.每个ut使用一个.
	 *      在parse的时候,可以用于放置一些初始化的对像和值等.如果改变方法的参数名称,则在ut.js中使用时,也要随之更改.
	 *      并且在测试的过程中, 测试的调度代码也会向上面写入一些相关的信息.
	 */
	parse = function(code,context){throw new Error('can not get the object');},
	/**
	 * 如果发生执行错误时触发的事件.
	 * 
	 * @param error {Error} 
	 *      所发生的错误对像内容.
	 * @param path {String}
	 *      发生错误时所执行的文件路径
	 * @param context {Object}
	 *      一个引用的上下文对像,在将在ut的执行代码中绑定一些值等.是一个辅助对像.每个ut使用一个.
	 *      在parse的时候,可以用于放置一些初始化的对像和值等.如果改变方法的参数名称,则在ut.js中使用时,也要随之更改.
	 *      并且在测试的过程中, 测试的调度代码也会向上面写入一些相关的信息.
	 * @param index {Number}
	 * 		一个索引值,用于指出发生错误的测试case是整个测试队列中第几项. 这个参数在捕获非测试case引发的错误时不存在
	 * @param funStr {String}
	 * 		发生错误的测试case的toString值,一般情况下应该为错误的测试方法的文本表示. 这个参数在捕获非测试case引发的错误时不存在
	 */
	onerror = null,
	/**
	 * 全部执行完成,或被完全终止
	 * 
	 * @param context
	 *      一个引用的上下文对像,在将在ut的执行代码中绑定一些值等.是一个辅助对像.每个ut使用一个.
	 *      在parse的时候,可以用于放置一些初始化的对像和值等.如果改变方法的参数名称,则在ut.js中使用时,也要随之更改.
	 *      并且在测试的过程中, 测试的调度代码也会向上面写入一些相关的信息.
	 */
	oncomplete = null,