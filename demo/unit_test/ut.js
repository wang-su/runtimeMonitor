/**
 * 这里模似一个单元测试
 * 
 * 全文可以使用的parse被执行处上下文中的所有内容;
 * 
 * 测试代码必须要保证下面这个结构,即通过一个function返回一个测试对像
 * 
 * 每个测试对像可以包含 beforeAll,afterAll,before,after,afterError 等几个可选的属性,值应该是一个可执行的方法.
 * 
 * 每个测试对像中最重要的属性是 run , 它可以是一个可执行的function,也可以是包含多个function的数组.
 * 
 * 框架中将保证执行过程为.
 * 
 * beforeAll before run[0] after [before run[1] after [....before run[n] after]] afterAll;
 * 
 * 测试过程中的错误将触发afterError, 在这个方法中可以判断是否为终止性的致命错误 , 
 * 
 * 如果是致命错误返回true即可终止剩余测试case的执行,否则将继续执行其它case. 
 * 
 * 如果未重新实现afterError,那么所有的错误都认为是致命的.
 * 
 */
function test(){
    // return value;
    return {
        beforeAll:function(){
            console.log("beforeAll 'a' is %d , context.param1 is %s", a , context.param1);
            context.param1 = "run before";
            context.value = 0;
        },
        afterAll:function(){
            console.log("afterAll 'a' is %d , context.param1 is %s", a , context.param1);
            context.param1 = "run after";
        },
        before:function(){
            context.value++;
            console.log("before test, context.value ++");
        },
        after:function(){
            console.log("after test, context.value = %d",context.value);
        },
        afterError:function(err){
            debugger;
            if(err && err.message && err.message.indexOf("a 不应小于 10") != -1){
                console.log("die");
                return true;
            }
        },
        run:[
             function(){
                console.log("runing 1" , a);
                assert(a > 10,"a 不应小于 10 , a is " + a);
                context.next();
             },
             function(){
                 console.log("runing 2");
                 assert(!!false,"这里总是一个错误")
                 context.next();
             },
             function(){
                 console.log("runing 3" , b);
                 assert(b < 80 , "B 不应大于 80 , b is " + b);
                 //context.next();
             },
             function(){
                 console.log("runing 4" , c);
                 assert(c != 0,'C 不应该是0' );
                 context.next();
             }
        ]
    };
}
