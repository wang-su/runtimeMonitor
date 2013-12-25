/**
 * 
 * 最简单的使用方法
 * 
 */
require('../runtimeMonitor.js');

var PORT = 8080;
var M = Monitor;

M.setVisible('Value',100);

M.setVisible('Random1',function(){
    return ~~(Math.random() * 100);
});

M.setVisible('Random2',function(){
    return ~~(Math.random() * 100);
});

M.addAction('addVisible',function(){
    M.setVisible('Random3',function(){
        return M.getVisible('Value') * M.getVisible('Random1') * M.getVisible('Random2');
    });
});

M.addAction('removeVisible',function(){
    M.removeVisible('Random3');
});

M.addAction('testFun',function(){
    console.log('runTestFun');
});

M.addAction('shuntdown',function(){
    console.log('shuntdown');
    process.exit(0);
});


//M.selfService();

M.selfService(8080);
