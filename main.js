/**
 * Main script for VK group members fetcher.
 *
 * Launches a web worker to do a long task of getting full list of VK group members.
 *
 * by Sergei Sokolov <hello@sergeisokolov.com>
 * Moscow, Russia, 2015.
 */

var App = (function(w,d,$,VK){
	return {
		worker: {}
		,defaults: {
			appId:	0
			,v:		5.35
		}
		,props:	{}
		,init:	function(opts) {
			if( !w.Worker) {
				console.log("No Worker API");
				return;
			}
			
			this.props = $.extent({}, this.defaults, opts);
			
			this.worker = new Worker("vkWorker.js");
			
			// jQuery objects
			this.$input	= $('#i-groupname');
			this.$btn	= $('#btn-send');
			this.$out	= $('#b-out');


			VK.init({ apiId: this.props.appId});
				
			this.$btn.on('click', this.onClick.bind(this));
			
			this.worker.onmessage = this.onMessage.bind(this);
		}
		
		,onMessage: function(e) {
			this.$out.html( e.data);
			console.log('Message received from worker', e);
		}
		
		,onClick: function() {
			this.worker.postMessage( this.$input.val());
			console.log('Message posted to worker');
		}
		
		,terminate: function() {
			this.worker.terminate();
		}
	};
})(window, document, jQuery, window.VK);
