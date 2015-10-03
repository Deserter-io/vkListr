"use strict";

var Worker = {
	init: function() {
		self.onmessage = this.onMessage.bind(this);
		self.callback = this.runLoop.bind(this);
	}
	
	,busy: false
	
	,ids: []

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
		this.v =  e.data.v

		this.offset = 0;
		
		this.runLoop();
	}
	
	,runLoop: function(r) {
		var loop, from, lastId, lengthBefore;
		postMessage({status: "Loop called"});
		
		
		if(r) {
			console.log("runLoop got", r);

			if( r.execute_errors) {
				console.log("Execute errors", r.execute_errors);
				return;
			}
			
			if( r.response) {
				if( r.response.ids && r.response.ids.length>0) {
					lengthBefore = this.ids.length;
					for( loop=0; loop < r.response.ids.length; loop++) {	// max 25
						if( this.ids.length > 0) {
							lastId = this.ids[ this.ids.length - 1];
							
							from = r.response.ids[ loop].indexOf( lastId);
							if( from == -1) {
								console.log('Last id was not found. Just appending. Might be an hole.');
								this.ids = this.ids.concat( r.response.ids[ loop]);
							} else {
								this.ids = this.ids.concat( r.response.ids[ loop].slice( from + 1));
							}
						} else {
							this.ids = r.response.ids[ loop].slice();
						}
					}
					
					//this.offset += this.ids.length - lengthBefore;
					this.offset = r.response.offset + r.response.ids[ r.response.ids.length - 1].length;
					console.log("Offset: ", this.offset);
				}
				
				if( r.response.mass) this.mass = r.response.mass;
				
				if( this.offset >= this.mass) {		// done
					console.log('Worker done.');
					postMessage({ids: this.ids});
					return;
				}
			} else {
				console.log("Ids not found", r);
				return;
			}
		}
		
		// jsonp call to VK API
		var url = 'https://api.vk.com/method/execute'
			+'?access_token='	+ this.token 
			+'&oid='			+ this.oid
			+'&offset='			+ this.offset
			+'&overlap='		+ 2 // this.offset > 0 ? Math.floor( Math.log( this.offset)) : 0
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

