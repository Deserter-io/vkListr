"use strict";

var Worker = {
	init: function() {
		self.onmessage = this.onMessage.bind(this);
		self.callback = this.runLoop.bind(this);
	}
	
	,busy: false
	
	,ids: []
	,started: 0
	,waited: 0

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
		this.started = (new Date()).getTime();

		this.oid = e.data.oid > 0 ? e.data.oid : -e.data.oid;
		this.token = e.data.token;
		this.mass = e.data.mass ? e.data.mass : 0;
		this.code = encodeURIComponent( e.data.code.replace(/\s+/g,' '));
		this.v =  e.data.v

		this.offset = 0;
		
		this.runLoop();
	}
	
	// in case of errors
	,abort: function( msg, r) {
		console.log( msg, r);
		postMessage({abort: 1, msg: msg});
		self.close();
		return;
	}
	
	,runLoop: function(r) {
		var loop, from, lastId, lengthBefore, url, now, diff;

		now = (new Date()).getTime();
		
		if(r) {	// VK api call returned smth
			
			// respect VK limit of max 3 api calls within 1 second
			this.times.push(now);
			this.times = this.times.slice(-3);

			//console.log("runLoop got", r, "offset:"+this.offset, "mass:"+this.mass);

			// check for errors
			if( r.execute_errors)	return this.abort("Execute errors", r);
			if( r.error) {
				if( r.error.error_code == 6) {
					console.log("Times:", this.times);
				}
				return this.abort("Error", r, this.times);
			}

			if( !r.response) {
				return this.abort("No response property", r);
			} else {
				if( r.response.ids && r.response.ids.length>0) {
					lengthBefore = this.ids.length;
					for( loop=0; loop < r.response.ids.length; loop++) {	// max 25
						if( this.ids.length) {
							lastId = this.ids[ this.ids.length - 1];
							
							from = r.response.ids[ loop].indexOf( lastId);
							if( from == -1) {
								console.log('Last id ' + lastId + ' was not found in loop ', loop, this.ids, r.response.ids[loop]);
								this.ids = this.ids.concat( r.response.ids[ loop]);
							} else {
								this.ids = this.ids.concat( r.response.ids[ loop].slice( from + 1));
							}
						} else {
							this.ids = r.response.ids[ loop].slice();
						}
					}
					
					this.offset = r.response.next;
				}
				
				if( r.response.mass) this.mass = r.response.mass;
				
				if( this.mass) postMessage({progress: this.offset / this.mass});
				
				if( this.offset >= this.mass) {		// done
					console.log('Worker done.');
					postMessage({ids: this.ids, elapsed: (new Date()).getTime() - this.started, slept: this.waited});
					self.close();
					return;
				}
			}
		}
		
		// jsonp call to VK API
		url = 'https://api.vk.com/method/execute'
			+'?access_token='	+ this.token 
			+'&oid='			+ this.oid
			+'&offset='			+ this.offset

			// TODO overlap must depend on the offset size: min 2, growing up to 10 for a 1E6 offset
			+'&overlap='		+ 2 // this.offset > 0 ? Math.floor( Math.log( this.offset)) : 0

			+'&mass='			+ this.mass
			+'&code='			+ this.code
			+'&v='				+ this.v
			+'&callback=callback'
		;
		
		if( this.times.length >= 3) {
			diff = 1100 - (new Date()).getTime() + this.times[0];
			if( diff > 0) {
				diff += 100;	// just in case
				this.waited += diff;
				self.setTimeout( this.runLoop.bind(this), diff);	// wait
				return;
			}
		}


		// do the jsonp VK API call
		importScripts( url);
	}
	
	,callback2: function (r) {
		console.log('Got vk response, posting message back to main script', r);
		postMessage(r);
	}
	
	,times: []
	
	
};

Worker.init();

