/**
 * 添加单测控制
 */
require('../runtimeMonitor.js');

// 这里用几个随机值模似业务逻辑
var a = ~~(Math.random() * 100);
var b = ~~(Math.random() * 100);
var c = ~~(Math.random() * 100);

if(GLOBAL.Monitor){
    var M = Monitor;
    /**
     * 
     * 这里提供一种方法,可以将内部方法的单测代码移至其它独立的文件中并保留,
     * 
     * 在存在Monitor的时候将自动载入并执行,同时可以通过monitor查看执行结果.
     * 
     */
    
    /**
     * 监视a,b,c三个值
     */
    M.setVisible('Random A',function(){
        return a;
    });
    
    M.setVisible('Random B',function(){
        return b;
    });
    
    M.setVisible('Random C',function(){
        return c;
    });
    
    /**
     * 任意变更a,b,c
     */
    M.addAction('recreate',function(){
        a = ~~(Math.random() * 100);
        b = ~~(Math.random() * 100);
        c = ~~(Math.random() * 100);
    });
    
    /*
     * ================================================================
     * ================================================================
     * 
     *          以下为如何整合单测的实例.
     * 
     * ================================================================
     * ================================================================
     */
    

    var ut = M.getUT(__dirname + '/unit_test/ut.js');
    /**
     * 
     * 如果有必要,可以手动让测试case重新执行,
     * 
     * 如果没必要,可以不加.
     * 
     * 也可以通过其它的方式触发reTest动作.
     * 
     */
    M.addAction('re-test',function(){
        ut.reTest();
    });
    
    /**
     * 
     * 当单测的文件成功载入后,即触发这个动作, 
     * 
     * 在这里利用这个动作,将自助的server启动,将在context中创建一个存放错误的堆栈
     * 
     */
    ut.onload = function(context){
        context.errors = []
        M.selfService(8080);
    }
    
    /**
     * 
     * 解析载入的单测代码, 这是一个必须有的动作,
     * 
     * 因为只有在这里通过eval触发才能使单测的代码获得当前上下文的执行环境.
     * 
     * 这段代码保证最后返回的结果是eval(code)的结果即可,
     * 
     * 其它部份可以随意.
     * 
     * 需要注意的是,这里的code,是已经被处理过并去除注释的.直接执行并即可.
     * 
     */
    ut.parse = function(code,context){
        context.param1  = "this is init value";
        return eval(code);
    };
    
    /**
     * 
     * 在整个单测的进行过程中出现的任何错误(不限于测试代码的assert等,
     * 
     * 比如测试文件的载入错误,解析错误等)都将触发这个方法.
     * 
     * 这里演示将最近的10个错误放到monitor中的方法.
     * 
     */
    ut.onerror = function(err,path,context,num , funStr){
        
        var errStr = "find error ,on [" + path + "], index: " + num +", function : \n\n " + funStr + " \n" + err.stack;
        
        if(context.errors.length >= 10){
            context.errors.shift();
        }
        
        context.errors.push(errStr || err);
        
        M.setVisible('Have Errors',function(){
            return context.errors.join("\n\n==========================\n\n");
        });
    };

}

