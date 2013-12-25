/**
 * Runtime Monitor
 * 
 * 一个监视器工具, DEBUG 神器, 
 * 
 * 用于监测运行时的相关状态, 并可以在代码中触发一些操作;
 * 
 * !! 这里没实现认证相关，是因为更安全的方式是直接删掉这个文件。
 * 
 */

var http = require("http");
var fs = require("fs");
var EventEmitter = require('events').EventEmitter;
var prefix = 'smr_monitor';

//绑定assert到全局空间
GLOBAL.assert = require('assert');

var reg_path =  new RegExp('^/' +prefix + "/(.*)$",'i');

var VisibleMap = {}, ActionMap = {};

var randomStr = function(len){
    var str = '';
    while(str.length < len)
        str += (~~(Math.random() * 36)).toString(36);
    return str;
};

var lineComment = /\s*\/\/.*$/gm;
var multiLineComment = /\s*\/\*(?:.|\n)*?\*\/\s*/igm;
/**
 * 用于过滤载入代码的注释.
 */
var removeComment = function(code){
  return code.replace(lineComment,"").replace(multiLineComment , "");
};


/**
 * 维持状态的http session.
 * 用于进行登陆等认证处理. 
 */
var Session = (function(){
    
    var map = {};
    
    var fireTimeout = function(id){
        
        var timer = null;
        
        if(!id || !(timer = map[id])){
            return;
        }
        
        clearTimeout(timer[2]);
        timer[0].emit('timeout',id);
        timer.length = 0;
        delete map[id];
    };
    
    return {
        getSession:function(id){
            return (map[id] && map[id][0]) || false;
        },
        create:function(id,idleTime){
            
            if(!id || typeof(idleTime) != 'number'){
                console.log(arguments);
                throw new Error("id or idleTime is null");
            }
            
            if(map[id]){
                this.active(id);
                return;
            };
            
            var timer = map[id] = [new EventEmitter(),idleTime];
            timer[2] = setTimeout(fireTimeout,idleTime,id);
            return timer[0];
        },
        active:function(id){
            var timer = null;
            if(!id || !(timer = map[id])){
                return;
            }
            clearTimeout(timer[2]);
            timer[2] = setTimeout(fireTimeout,timer[1],id);
        },
        count:function(){
            return Object.keys(map);
        }
    };
})();


var getUTRunner = function(path){
    
    var stepName = "loading";
    
    // 每个测试的上下文空间,用于绑定一些值或流程控制方法.
    var context = {};
    
    var before, after, beforeAll, afterAll, runList, runItem , afterError;
    var testIndex = 0;
    
    // 这是一个delay对像
    var executeCode = {
            /**
             * 
             * 用于解析载入的ut文件的内容,并获得待测试的业务内容的执行范围
             * 正常情况下,直接使用如下格式的functin即可以满足执行要求
             * 
             *       Q.getRunner("unit.js").parse = function(code,context){
             *          return eval(code);
             *       }
             * 
             * @param code 
             *      已经处理过的代码的字符串表示.
             * @param context
             *      一个引用的上下文对像,在将在ut的执行代码中绑定一些值等.是一个辅助对像.每个ut使用一个.
             *      在parse的时候,可以用于放置一些初始化的对像和值等.如果改变方法的参数名称,则在ut.js中使用时,也要随之更改.
             *      并且在测试的过程中, 测试的调度代码也会向上面写入一些相关的信息.
             */
            parse:function(code,context){throw new Error('can not get the object');},
            /**
             * 如果发生执行错误时触发的事件.
             * @param error {Error} 
             *      所发生的错误对像内容.
             * @param path {String}
             *      发生错误时所执行的文件路径
             */
            onerror:null,
            /**
             * 测试内容载入完成时执行一次
             */
            onload:null,
            /**
             * 全部执行完成,或被完全终止
             * @param context
             *      整个执行过程中的上下文对像.
             */
            oncomplete:null,
            /**
             * 重新跑一次测试.
             */
            reTest:function(){
                // 还原三个状态
                testIndex = 0;
                stepName = 'loading';
                runItem = runList[testIndex];
                
                context['next']();
            }
    };
    
    var logErr = function(err){
        console.error("failed : on Step [" + stepName + "] File [" + path + "],  Error stack : \n" + (err.stack || err));
    };
    
    var processError = function(err , funStr){
     // 如果有事件则通知,否则打印到console中.
        executeCode.onerror ? executeCode.onerror(err, path, context ,testIndex , funStr) : logErr(err);
        if(afterError){
            try{
                /**
                 * 在不是faile的情况下,当afterError返回true,则认为是致命错误.
                 */
                if(afterError != context.faile && afterError(err , testIndex , funStr)){
                    context.faile();
                }else{
                    context.next();
                }
            }catch(e){
                // 这里不应该再有错误,如果有,log出来,然后吞掉..
                console.error(e.stack || e);
            }
        }
    }
    


    var runTest = function(){
        
        runItem = runList[testIndex];
        
        // 在这里绑定控制方法,是为了不被用户的parse影响.
        /**
         * 
         *  执行下一个测试单元
         *  
         */
        context['next'] = function(){
            
            debugger;
            if(stepName == 'failed'){
                executeCode.oncomplete && process.nextTick(executeCode.oncomplete.bind(executeCode,context));
                return;
            }else if(stepName == 'run'){
                after && after();   // 这里的after其实是上一个runItem的after;
            }
            
            stepName = 'run';
            
            if(runItem){
                before && before();
                process.nextTick(function(runItem){
                    try{
                        runItem();
                    }catch(err){
                        processError(err, runItem.toString());
                    }
                }.bind(null,runItem));
                runItem = runList[ ++ testIndex ];
            }else{
                stepName = 'afterAll';
                afterAll && afterAll();
                context.exitCode = 0;
                executeCode.oncomplete && process.nextTick(executeCode.oncomplete.bind(executeCode,context));
            }
        };
        

        if(stepName == 'loading'){
            stepName = 'beforeAll';
            beforeAll && beforeAll();
        }
        
        if(runItem){
            context['next'] ();
        }
        
    };
    
    //这个异步是必须的,用于构建一个delay对像;
    fs.readFile(path,{encoding:'utf8'},function(err,data){
        
        if(err){
            executeCode.onerror ? executeCode.onerror(err, path, context , testIndex) : logErr(err);
            return;
        }
        
        // 释放IO.保证onload先去执行;
        process.nextTick(function(){
            
            var realData = "(" + removeComment(data) + ")()";
            
            var runner = {};
            
            try{
                runner = executeCode.parse(realData,context);
            }catch(e){
                executeCode.onerror ? executeCode.onerror( e , path, context , testIndex) :  logErr(err);
                return;
            }
            
            /**
             * 
             * 停止执行继续,并认为余下所有的都将失败
             * 
             */
            context['faile'] = function(){
                stepName = 'failed';
                context.exitCode = 1;
                this.next();
            };
            
            before = runner.before || false;
            beforeAll = runner.beforeAll || false;
            after = runner.after || false;
            afterAll = runner.afterAll || false;
            runList = Array.isArray(runner.run) ? runner.run : [runner.run];
            
            // 如果不指明错误的处理方法,则认为所有的错误都将是中断性的致命错误.
            afterError = runner.afterError || context.faile;
            
            try{
                runTest();
            }catch(err){
                processError(err);
                
                // 如果有事件则通知,否则打印到console中.
//                executeCode.onerror ? executeCode.onerror(err, path, context) : logErr(err);
//                if(afterError){
//                    try{
//                        /**
//                         * 在不是faile的情况下,当afterError返回true,则认为是致命错误.
//                         */
//                        if(afterError != context.faile && afterError()){
//                            context.faile();
//                        }
//                    }catch(e){
//                        // 这里不应该再有错误,如果有,log出来,然后吞掉..
//                        console.error(e.stack || e);
//                    }
//                }
            }
        });
        
        executeCode.onload && executeCode.onload(context);
        
        
    });
    return executeCode;
};

var toWatchPageData = function(){
    
    var content = {} ,values;
    
    for(var key in VisibleMap){
        
        try{
            values = JSON.stringify(Monitor.getVisible(key));
        }catch(e){
            values = "can not to get the value,\n " + e.stack;
        }
        content [key] = values;
    }
    
    return content;
};

var toCommandData = function(){
    var keys = Object.keys(ActionMap);
    return keys;
};

var getData = function(){
    return JSON.stringify({
        data:toWatchPageData(),
        command:toCommandData()
    });
};

var canBeHandle = function(url){
    return reg_path.test(url);  
};

var template = '<!DOCTYPE html>' +
                '<html><head><meta charset="UTF-8">' +
                '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">' +
                '<meta name="apple-mobile-web-app-capable" content="yes">' +
                '<title>Clouda Runtime Monitor</title>' +
                '<style type="text/css"> pre{ width: 95%; height:80px; border:1px solid #ccc; word-wrap: break-word; word-break: normal; overflow: auto; } '+
                '#commands{transition-duration:700ms; opacity:0.7; position: fixed; bottom: 30px; background: #f0f0f0; right: -250px; top: 0px; width: 330px; height:100%; overflow: auto;}'+
                '#commands:hover{right: 5px; opacity:1;}'+
                'a{ display:inline-block; min-width:100px; min-height:30px; background:#eee; border:3px solid #ccc; border-radius:10px; padding:10px; margin:10px; text-align:center; text-decoration:none; line-height:30px; } ' +
                'a:hover{border:#AAA 3px solid; background:#fff;}</style>' +
                '<script type="text/javascript" src="/$_prefix_$/js"></script>' +
                '</head><body>' +
                '<h1>Runtime Monitor</h1>' +
                '<section id="monitor"></section>'+
                '<section id="commands"></section>'+
                '</body></html>';

var runner = function(req, res) {
    
    var url = req.url;
    var part = null;
    if(!canBeHandle(url)){
        return;
    }
    
    res.wlock = true;
    
    var cookie = (req.headers['cookie'] || "");
        cookie = cookie.split('; ');
        cookie = cookie.filter(function(item){ return item.indexOf('smrsid=') == 0; });
        cookie = (cookie[0] || '').split('=')[1];

//    var session = null;
//    
//    if(!cookie || !(session = Session.getSession(cookie))){
//        console.log('new session.');
//        cookie = randomStr(32);
//        res.setHeader("Set-Cookie", ["smrsid=" + cookie + "; path=/" + prefix + "/"]);
//        Session.create(cookie, 1000 * 60);
//    }else{
//        Session.active(cookie);
//    }
    
    if(part = reg_path.exec(url)[1]){
        part = part.split("/"); 
    }
    
    //debugger;
    switch(part[0]){
        case "js":
            
            fs.readFile( __dirname + '/runtimeMonitorClient.js', {encoding:'utf-8'},function(err,data){
                
                if(err){
                    res.writeHead(404);
                    res.end(err.stack);
                    return;
                }
                
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
                res.setHeader('Cache-Control','no-cache');
                res.writeHead(200);
                res.end(data + "\nsetPrefix('" + prefix + "');");
                
            });
            
            break;
        case "data":
            
            res.setHeader('Content-Type', 'text/json; charset=UTF-8');
            res.setHeader('Cache-Control','no-cache');
            
            res.writeHead(200);
            
            res.end(getData());
            
            break;
        case "command":
            //debugger;
            var key = decodeURI(part[1]);
            var run = null;
            
            try{
                if(run = ActionMap[key]){
                    //debugger;
                    run();
                }
            }catch(e){
                res.writeHead(200, {'Content-Type' : "text/json"});
                res.end("error:%s",e.stack);
            }
            res.setHeader('Cache-Control','no-cache');
            res.writeHead(204);
            res.end("");
            break;
        default:
            res.setHeader('Cache-Control','no-cache');
            res.writeHead(200, {'Content-Type' : "text/html"});
            //res.end(JSON.stringify(cookie));
            res.end(template.replace('$_prefix_$', prefix ));
    }
};

var globalServer = false;
var Monitor = {
        canBeHandle:canBeHandle,
        setPrefix:function(_prefix){
            prefix = _prefix;
            // default is /^\/smr_monitor\/(.*)$/i;
            reg_path =  new RegExp('^/' +prefix + "/(.*)$",'i');
        },
        execute:runner,
        /**
         * 
         * 添加一个可监视的东西.包含一个KEY,每次重复设定时,即复盖之前的值.
         * 如果传入的value是一个function必须保证可以无参调用并有明确的返回值.
         * 
         * !!! 这里不禁止但是也建议使用Array或Object等引用对像,
         * 因为在忘记移除的情况下容易造成内存占用问题.如果记得回收,他则可以很好工作.
         * 
         * @param key {String}  
         *      监视对像的名称. 
         *      
         * @param value {Object|Function}  
         *      实际的可观查对像,可以是一个简单值也可以是一个有返回值的Function,
         *      
         */
        setVisible:function(key,value){
            VisibleMap[key] = value;
        },
        /**
         * 
         * 获取一个监视对像的输出值. 对于简单对像则直接返回,function则返回执行后的值.
         * 
         * @param key {String}  监视对像的名称. 
         */
        getVisible:function(key){
            
            var item = VisibleMap[key];
            
            return typeof(item) == 'function' ? item() : item;
        },
        /**
         * 
         * 删除一个监视对像
         * 
         * @param key {String}  监视对像的名称. 
         */
        removeVisible:function(key){
            if(key instanceof RegExp){
                var keys = Object.keys(VisibleMap);
                var k = null;
                for(var index in keys){
                    k = keys[index];
                    if(key.test(k)){
                        delete VisibleMap[k];
                    }
                }
            }else{
                delete VisibleMap[key];
            }
        },
        
        /**
         * 添加一个可执行的动作.动作必须被无参执行.
         * @param key
         * @param action
         */
        addAction:function(key,action){
            if(!key || typeof(action) != 'function'){
                return;
            }
            ActionMap[key] = action;
        },
        /**
         * 移除一个已添加的动作.
         * @param key
         */
        removeAction:function(key){
            if(key instanceof RegExp){
                var keys = Object.keys(ActionMap);
                var k = null;
                for(var index in keys){
                    k = keys[index];
                    if(key.test(k)){
                        delete ActionMap[k];
                    }
                }
            }else{
                delete ActionMap[key];
            }
        },
        selfService:function(port){
            
            if(globalServer){
                return;
            }
            
            port = port || '8088';
            globalServer = http.createServer();
            
            globalServer.listen(port, function() {
                console.log('Runtime Monitor Listening on ' + port);
            });
            
            globalServer.on('request', runner);
            globalServer.on('request', function(req,res){
                if(res.wlock){  // 处理标记，如果为true，则表示已被其它处理函数处理.
                    return;
                }
                
                res.writeHead(404);
                res.end("no content");
            });
        },
        getUT:getUTRunner
};

module.exports = Monitor;

GLOBAL.Monitor = Monitor;

// ===============   Unit Test   ===================//

(function(){
    
    var PORT = 8080;
    
    Monitor.setVisible('Random1',function(){
        return ~~(Math.random() * 100);
    });
    Monitor.setVisible('Random2',function(){
        return ~~(Math.random() * 100);
    });
    Monitor.setVisible('Random3',function(){
        return ~~(Math.random() * 100);
    });
    Monitor.setVisible('Random4',function(){
        return ~~(Math.random() * 100);
    });
    
    Monitor.setVisible('template',function(){
        var buf = new Buffer(template);
        return buf.toString('hex');
    });
    
    Monitor.setVisible('ActiveSession',function(){
        return Session.count();
    });
    
    Monitor.setVisible('CountSession',function(){
        return Session.count().length;
    });
    
    Monitor.addAction('addVisible',function(){
        Monitor.setVisible('htmlTemplate',function(){
            return template;
        });
    });
    
    
    Monitor.addAction('cleanVisible',function(){
        debugger;
        Monitor.removeVisible(/^Random.*/i);
    });
    
    Monitor.addAction('testFun',function(){
        console.log('runTestFun');
    });
    
    Monitor.addAction('shuntdown',function(){
        console.log('shuntdown');
        process.exit(0);
    });
    
    
    Monitor.addAction('setPrefix',function(){
       Monitor.setPrefix(randomStr(10));
    });
    
    
    var count = 0;
    
    //Monitor.selfService();
    
    var globalServer = http.createServer();
    
    globalServer.listen(PORT, function() {
        console.log('Server Listening on ' + PORT);
    });
    
    globalServer.on('request', runner);
    
    globalServer.on('request', function(req,res){
        
        Monitor.setVisible('request count',function(){
            return count++;
        });
        
        if(res.wlock){  // 处理标记，如果为true，则表示已被其它处理函数处理.
            return;
        }
        
        res.writeHead(404);
        res.end("no content");
        
    });

});// ();


