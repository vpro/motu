var jw = jwplayer('video_player').setup({
	file: _scientist.videos[0].url,
	width:'100%',
	type : 'mp4',
	controls : true,
	image: null,
	autostart: false,
	key: 'cp1KvUB8slrOvOjg+U8melMoNwxOm/honmDwGg=='
})

jw.on('bufferChange', loadProgress)
.on('time', playProgress)
.on('play', onPlay)
.on('pause', onPause)
.on('complete', onFinish)
.on('seek', onSeek)
.on('ready', onReady);

function onReady() {
	console.debug('player ready...');
	jw.seek(_start / 1000);

	console.debug(jw.getDuration());
	console.debug(jw.getState());
}

function loadProgress() {
	//console.debug('loading...');
}

function playProgress() {
	//console.debug('cur pos: ' + jw.getPosition());
}

function onPlay() {
	//console.debug('on play...');
}

function onPause() {
	//console.debug('on pause...');
}

function onFinish() {
	//console.debug('Finished');
}

function onSeek() {
	//console.debug('Seeking');
	var current = determineCurrentAnnotation(jw.getPosition());
	if(current && current.length > 0) {
		var sub = current[0];
		console.debug(sub)
		//jump to the sub so you can read it
		var url = document.location.href;
		if(url.indexOf('#') != -1) {
			url = url.substring(0, url.indexOf('#'));
		}
		document.location.href = url + '#' + sub.number;

		//reset the other highlights
		var subs = document.getElementsByClassName('sub')
		for(var i=0;i<subs.length;i++) {
			var elm = subs[i];
			if(elm.id == sub.number) {
				elm.className = 'sub active';
			} else {
				elm.className = 'sub';
			}
		}
	}
}

function determineCurrentAnnotation(sec) {
	var currentAnnotation = null;
	if(_scientist.transcript) {
		var pos = parseInt(sec) * 1000
		currentAnnotation = _scientist.transcript.filter((a, index)=> {
			if(a.start < pos && a.end > pos) {
				return true;
			}
		})
	}
	return currentAnnotation;
}

function seek(start) {
	jw.seek(start / 1000);
}