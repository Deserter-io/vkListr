"use strict";

var Worker = {
	setup: function() {
		self.onmessage = this.onMessage.bind(this);
		self.callback = this.runLoop.bind(this);
	}
	
	,busy		: false
	,ids		: []
	,started	: 0
	,waited		: 0
	,eta		: 0
	
	,times		: []	// last 3 api call times
	,samples	: []	// estimates for a total job time

	,onMessage: function(e) {
		var mandatory = "oid,mass,token,code,v".split(','), prop;

		if( !e.data) {
			postMessage({ error: "Missing event data"});
			throw "Missing event data";
			return;
		}

		// verify all properties are in place
		for( prop=0; prop<mandatory.length; prop++) {
			if( !e.data.hasOwnProperty( mandatory[prop])) {
				postMessage({ error: "missing property " + mandatory[prop] });
				return;
			}
		}


		// is worker available?
		if( this.busy) {
			postMessage({ error: "Worker busy"});
			return;
		}


		this.init( e.data);
		this.runLoop();
	}
	
	
	/**
	 * Reset prior each new group run
	 */
	,init: function( props) {
		this.busy = true;

		this.started = (new Date()).getTime();
		
		this.ids	= [];
		this.waited	= 0;

		this.oid	= props.oid > 0 ? props.oid : -props.oid;
		this.token	= props.token;
		this.mass	= props.mass ? props.mass : 0;
		this.code	= encodeURIComponent( props.code.replace(/\s+/g,' '));
		this.v		= props.v;

		this.offset	= 0;
	}


	// in case of bad errors
	,abort: function( msg, r) {
		console.log( msg, r);
		postMessage({abort: 1, msg: msg});
		self.close();
		return;
	}
	
	,cbSum: function(sum, val) { return sum + val; }
	
	,runLoop: function(r) {
		var loop, from, lastId, lengthBefore, url, now, diff, progress;

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
				
				
				// Before next api call
				now = (new Date()).getTime();

				// Progress and ETA
				if( this.mass) {
					progress = this.offset / this.mass;
					this.samples.push( this.mass * ( now - this.started) / this.offset);
					this.samples = this.samples.slice(-10);
					
					postMessage({progress: progress, eta: this.samples.reduce( this.cbSum, 0) / this.samples.length });
				}
				
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
};

Worker.setup();

