runtimeMonitor
==============

this is a DevTools for Nodejs.

�����뿴���ڲ�ִ���������dump��һ����ֵ�����ݣ�������ĳЩ�����ִ��һЩ��������process.exit(),�������һЩ������һЩ�����������ݰ���ɾ���ݰ����ı�������԰���ֵ��һЩ����ķ�����ҵ�������Ķ����ȵȡ�
�����ṩһ��htmlҳ�棬�����г����뿴����ֵ����Ҫ�Լ��ڴ��������ã���Ҳ��һЩ��ť����ִ����Ķ�������Ҫ���Լ����ã���Ȼ��ÿ5���ӻ��Զ�ˢ��һ�α��ڼ��ӣ���Ϊ�ؾ��� Monitor.

���������ļ�������require��������λ��. ���ڴ�����require('runtimeMonitor.js').

�Զ���ȫ�ִ���һ��Monitor����.

����ʹ������ʹ�÷�ʽ. 

if(GLOBAL.Monitor){

	var m = Monitor;
	
	m.setVisible('key','value');
	
	m.addAction('name',function(){
		// do someting...
	});
}

�������server. ��ʵ��������ʽ����һ����ʽ�ǰ��������������һ���Ѵ��ڵ�node httpServer�ϡ�

�磺

	  var globalServer = http.createServer();
    
    globalServer.listen(PORT, function() {
        console.log('Server Listening on ' + PORT);
    });
    
    globalServer.on('request', runner);
    
    globalServer.on('request', function(req,res){
        
        
        if(res.wlock){  // �����ǣ����Ϊtrue�����ʾ�ѱ��ҵĴ��봦���ˣ����ǾͲ�Ҫ�ٶ�������ʽ��д����ˡ�
            return;
        }
        // ����Լ������http������
        res.writeHead(404);
        res.end("no content");
        
    });

����һ����ʽ���������ڿ���һ��ģ��ʱ�����£�

var M = Monitor;
M.setPrefix("abc");
M.selfService(8080);

��������£�ֱ�Ӵ������������� 8080�˿ڣ�Ȼ����� /abc ����. 
�ҽ��ṩһ���Լ����ܵ�ɵ������HTTP������ʵ�Ҿ��ǰ�����ļ��д����װ��һ�¡�

*** ע�⣺��������ʵ��Ȩ����֤���ܣ���������ڴ����￴��д��һ���httpSession��ʵ�֣���������Ϊ��������ȫ������ȫ��ʽ���Ǹɵ����ܳ���ȫ����Ĵ��롣�������ڴ��뷢��ʱ���뽫֮�Ƴ�������ڰ�ȫ���⡣

PS:
��Щ������ʱû���ԣ������пӣ����Բ����鱣��������Ӧ�ã��������ϵİ�ȫ���⣨�������Լ�����̫���action���߼������е�visible��Ҳ���������������⣬�����ڴ�й¶�ȱؾ��㲻ɾ������Ҳ��ɾ��

API ��

Monitor.setPrefix(str);
����һ�����ʵ�ǰ׺����Ϊ�����������������������д������Web Serverʵ���ϣ�������Ҫ��һ�����֡�Ĭ�ϵ�ǰ���� smr_monitor

Monitor.canBeHandle(url);
�ж�һ��URL�ǲ��ǿ��Ա�handel��Ҳ�����������Ǹ�setPrefix�����õ�strΪǰ׺��url���ʡ�

Monitor.execute(req,res);
��������canBeHanle����ֵΪtrue����ô������԰�request��response�Ӹ��������������

Monitor.selfService(port);
�����ڲ��ṩ�ļ�httpServer���ṩ���ʡ� port��һ����ʾ�˿ڵ����֡����� 8080. Ĭ����8088.

Monitor.setVisible(key,value);
���ӻ�����һ���ɼ�����key��һ��string, value������һ��ֵ��Ҳ������һ���޲ε��ò���ȷ�з���ֵ��function.���еķ��ض�����JSON���������ҳ����.

Monitor.getVisible(key);
�������ӵ�һ��visible��ֵ��һ������������ò�����������ˡ����������ϣ����һЩ����������keyֵ��ϵ�ֵ�������ʹ��;

Monitor.removeVisible(key);
����ɾ���ģ������ͣ���ʵ��Ҳ���Բ�д�����ǣ�ǿ��֢����ũ�����Ƕ��ġ�

Monitor.addAction(key,fun);
����һ�������еĶ�����key��һ���ַ�����fun��һ���޲ε��õ�function�����Զ���ҳ������һ����ť(��ҳ�������棬����Ҳ�������������ʹ��������ȡ��������˶��ٸ�Visible�Ķ����������ż��˼��ٸ�����Щͷ�Σ��������ø�ҳ��ʵ���ˡ����ü���)����ʹ�õ�ʱ������Խ������������ıհ���Ա��ڻ�ñհ��ڶ�������á�

Monitor.removeAction(key);
����ɾ���ģ������ͣ���ʵ��Ҳ���Բ�д�����ǣ�ǿ��֢����ũ�����Ƕ��ġ�

