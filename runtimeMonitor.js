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
var reg_path =  new RegExp('^/' +prefix + "/(.*)$",'i');

var VisibleMap = {}, ActionMap = {};

var randomStr = function(len){
    var str = '';
    while(str.length < len)
        str += (~~(Math.random() * 36)).toString(36);
    return str;
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
            
            port = port || '8088';
            var globalServer = http.createServer();
            
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
        }
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


