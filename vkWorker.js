function gotVkResponse(r) {
	console.log('Got vk response, posting message back to main script', r);
	postMessage(r);
}

onmessage = function(e) {
  console.log('Message received from main script', e.data);


  var url = "https://api.vk.com/method/users.get?access_token=" + e.data.token + '&callback=gotVkResponse';
  importScripts( url);
}


