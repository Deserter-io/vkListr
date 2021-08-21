"use strict";

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
		,vkScript: {}
		,defaults: {
			appId:	0
			,v:		5.131
		}
		,props:	{}
		,ids: []
		,init:	function(opts) {
			if( !w.Worker) {
				alert("Old browser? No Worker API");
				throw "No Web Worker API";
				return;
			}
			
			// assign options over defaults
			this.props = $.extend( {}, this.defaults, opts);


			// load vk script files
			this.loadScript('guess');
			this.loadScript('getMembers');


			// cache jQuery objects
			this.$cUser 	= $('.vk-user');
			this.$cAnon 	= $('.vk-anon');

			this.$input		= $('#i-groupname');
			this.$btn		= $('#btn-send');
			this.$out		= $('#b-out');
			this.$group		= $('#b-group');
			this.$login		= $('.m-login');
			this.$logout	= $('.m-logout');
			this.$progress	= $('#b-progress');


			// Events listeners
			this.$login.on('click', this.login.bind(this));
			this.$logout.on('click', this.logout.bind(this));
			
			this.$btn.on('click', this.onClick.bind(this));
			this.worker.onmessage = this.onMessage.bind(this);


			// VK api init
			VK.init({ apiId: this.props.appId});
			VK.Auth.getLoginStatus( this.gotLoginStatus.bind(this));
		}
		
		,loadScript: function(key) {
			$.ajax('vkscript/' + key + '.js', {
					error		: this.gotVkScriptError.bind(this, key) 
					,success	: this.gotVkScript.bind(this, key)
					,dataType	: 'html'
				}
			);
		}
		
		,gotVkScript: function( key, data) {
			this.vkScript[key] = data;
		}
		
		,gotVkScriptError: function( key, xhr) {
			console.log('ERROR Getting vk script: ' + key, arguments);
		}
		
		,ready: function() {
			this.worker = new Worker("vkWorker.js");
			this.worker.onmessage = this.onMessage.bind(this);
		}
		
		,gotLoginStatus: function( response) {
			//console.log('got status: ', response);
			if (response.session) {
				//console.log('vk user: ' + response.session.mid);
				this.token = response.session.sid;
				
				this.$cUser.removeClass('hidden');
				this.$cAnon.addClass('hidden');

				this.ready();
			} else {
				console.log('not auth');

				this.$cUser.addClass('hidden');
				this.$cAnon.removeClass('hidden');
			}
		}
		
		,logout: function(e){
			e.preventDefault();
			VK.Auth.logout( this.gotLoginStatus.bind(this));
		}
		
		,login: function(e){
			e.preventDefault();
			VK.Auth.login( this.gotLoginStatus.bind(this), 0x40000);
		}
		
		,onMessage: function(e) {
			var blob;
			
			if( !e.data) {
				console.log("Message from worker carried no data");
				return;
			}
			
			if( e.data.progress) this.onProgress(e.data.progress, e.data.eta, e.data.mass);
		
			else if( e.data.ids) {
				this.ids = e.data.ids;
				console.log("Received " + this.ids.length + " ids");
				
				this.$progress.addClass('hidden');
				d.title = 'vkListr: готово';
				
				blob = new Blob([this.ids.join("\n")], { type:"text/csv"});
				
				this.$out.html( 'Получено ' + this.ids.length + ' id. <a href="' 
					+w.URL.createObjectURL(blob)
					+ '" download="ids.csv" class="btn btn-success e-download">Скачать</a>' 
					+' Elapsed: ' + Math.floor(e.data.elapsed/1000) +'s, slept ' +Math.floor(e.data.slept/1000) + 's'	
				);
			}

			else if( e.data.elapsed) this.$out.html( e.data.elapsed);
			else console.log('Message received from worker', e);
		}
		
		,onClick: function() {
			this.$input.attr("disabled", true);
			this.guess( this.$input.val());
		}
		
		,terminate: function() {
			this.worker.terminate();
		}
		
		,guess: function(input) {
			var m, oid = 0, screen_name = "";
			if( m = input.match(/^(https?:\/\/)?(m\.)?vk\.com\/([a-z_\.0-9-]+)$/)) {	// url
				screen_name = m[3].toLowerCase();
			} else if( m = input.match(/^-?[0-9]+$/)) {									// number
				oid = input;
			} else if( m = input.match(/^[a-z_\.0-9-]+$/)){								// shortname
				screen_name = input.toLowerCase();
			}
			console.log("oid:",oid,"sn:", screen_name);
			// query VK for group details
			VK.Api.call(
				'execute',
				{
					code		: this.vkScript.guess,
					oid			: oid,
					screen_name	: screen_name,
					v			: this.props.v,
				},
				this.gotResolvedName.bind(this)
			);
		}
		
		,gotResolvedName: function(r) {
			var html;
			
			//console.log("Got resolved:", r.response.oid, r);
			if( r.response  &&  r.response.oid) {
				console.log("oid: " , r.response.oid, r.response);
				
				// display the group
				html = [
					'<div class="media">													 ',
					'   <div class="media-left media-middle">								 ',
					'   	<a href="%URL%" target="_blank">								 ',
					'            <img class="media-object" src="%SRC%" alt="">				 ',
					'   	</a>															 ',
					'   </div>																 ',
					'																		 ',
					'   <div class="media-body">											 ',
					'   	<h4 class="media-heading">%NAME%</h4>							 ',
					'   	<p>id: %OID%, <span id="e-mass">%MASS%</span> участников.		 ',
					'   </div>																 ',
					'</div>																	 ',
				]
					.join("\n")
					.replace('%URL%', 'https://vk.com/' + r.response.screen_name)
					.replace('%SRC%', r.response.photo_50)
					.replace('%NAME%', r.response.name)
					.replace('%OID%', r.response.oid)
					.replace('%MASS%', r.response.mass)
				;
				this.$group.html(html);
				
				
				this.collect( r.response.oid, r.response.mass);
			} else {
				this.$input.removeAttr("disabled");
				console.log('no oid');
			}
		}
		
		,collect: function( oid, mass) {
			this.worker.postMessage( {oid: oid, mass: mass, token: this.token, code: this.vkScript.getMembers, v: this.props.v});
			this.$progress.removeClass('hidden');
		}
		
		/**
		 * Updates progress indicator to the provided value in range 0..1
		 */
		,onProgress: function(p, eta, mass) {
			var val = Math.floor(100*p), percent = '' + val + '%';
			
			d.title = 'vkListr: ' + percent;

			$('.progress-bar', this.$progress).css('width', percent).attr('aria-valuenow', val);
			$('.sr-only', this.$progress).html(percent);
			this.$out.html( 'Осталось ' +eta +'с.');

			$('#e-mass').text( mass);
		}
	};
})(window, document, jQuery, window.VK);
