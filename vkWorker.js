var Worker = {
	init: function() {
		self.onmessage = this.onMessage.bind(this);
		self.callback = this.runLoop.bind(this);
	}
	
	,busy: false

	,onMessage: function(e) {
		if( !e.data  ||  !e.data.oid  ||  !e.data.token  || !e.data.code) {
			postMessage({ error: "Missing oid or token"});
			return;
		}

		
		if( this.busy) {
			postMessage({ error: "Worker busy"});
			return;
		}
		
		console.log('Worker got oid ', e.data.oid);
		this.busy = true;

		this.oid = e.data.oid > 0 ? e.data.oid : -e.data.oid;
		this.token = e.data.token;
		this.mass = e.data.mass ? e.data.mass : 0;
		this.code = encodeURIComponent( e.data.code.replace(/\s+/g,' '));
		this.v =  e.data.v ? e.data.v : 5.37

		this.offset = 0;
		
		this.runLoop();
	}
	
	,runLoop: function(r) {
		
		if(r) {
			console.log('Some response from VK', r);
			return;
		}
		
		// jsonp call to VK API
		var url = 'https://api.vk.com/method/execute'
			+'?access_token='	+ this.token 
			+'&oid='			+ this.oid
			+'&offset='			+ this.offset
			+'&mass='			+ this.mass
			+'&code='			+ this.code
			+'&v='				+ this.v
			+'&callback=callback'
		;
		importScripts( url);
		
	}
	
	,callback2: function (r) {
		console.log('Got vk response, posting message back to main script', r);
		postMessage(r);
	}
	
	,times: []
	
	
};

Worker.init();

