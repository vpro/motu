var _clickedLine = null;

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
.on('seeked', onSeeked)
.on('ready', onReady);

function onReady() {
	_clickedLine = getCurrentAnnotation(_start / 1000);
	jw.seek(_start / 1000);
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

function onSeeked() {
	var sub = _clickedLine;
	if(!sub) {
		sub = getCurrentAnnotation(jw.getPosition());
	}
	if(sub) {
		//jump to the sub so you can read it
		var url = document.location.href;
		if(url.indexOf('#') != -1) {
			url = url.substring(0, url.indexOf('#'));
		}
		document.location.href = url + '#' + sub.number;

		//reset the other highlights
		var subs = document.getElementsByClassName('sub');
		for(var i=0;i<subs.length;i++) {
			var elm = subs[i];
			if(elm.id == sub.number) {
				elm.className = 'sub active';
			} else {
				elm.className = 'sub';
			}
		}
		_clickedLine = null;
	}
}

function getCurrentAnnotation(sec) {
	if(_scientist.transcript) {
		var pos = parseInt(sec) * 1000
		var currentAnnotation = _scientist.transcript.filter((a, index)=> {
			if(a.start <= pos && a.end >= pos) {
				return true;
			} else if(pos < a.start && pos >= a.start - 500) {//first try to fetch the closest one AHEAD
				return true;
			} else if(pos > a.end && pos <= a.end + 500) {//then try to fetch the closest one BEFORE
				return true;
			}
			return false;
		});
		if(currentAnnotation.length > 0) {
			return currentAnnotation[0];
		}
	}
	return null;
}

function gotoLine(index) {
	_clickedLine = _scientist.transcript[index];
	if(_clickedLine) {
		jw.seek(_clickedLine.start / 1000);
	}
}