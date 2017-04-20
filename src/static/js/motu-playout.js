var _clickedLine = null;
var _clickedSegment = null;

var jw = jwplayer('video_player').setup({
	file: _interview.video.url,
	width:'100%',
	type : 'mp4',
	controls : true,
	image: null,
	mute: false,
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
	_clickedSegment = getCurrentSegment(_start / 1000);
	jw.seek(_start / 1000);
}

function loadProgress() {
	//console.debug('loading...');
}

function playProgress() {
	highlight(getCurrentAnnotation(jw.getPosition()), 'sub');
	highlight(getCurrentSegment(jw.getPosition()), 'segment');
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
	console.debug('seeked');
	var sub = _clickedLine || getCurrentAnnotation(jw.getPosition());
	var segment = _clickedSegment || getCurrentSegment(jw.getPosition());
	if(sub) {
		highlight(sub, 'sub');
		document.getElementById(sub.number).scrollIntoView();
		_clickedLine = null;
	}
	if(segment) {
		highlight(segment, 'segment');
		document.getElementById(segment.number).scrollIntoView();
		_clickedSegment = null;
	}
}

function getCurrentAnnotation(sec) {
	if(_interview.transcript) {
		var pos = parseInt(sec) * 1000
		var currentAnnotation = _interview.transcript.filter((a, index)=> {
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

function getCurrentSegment(sec) {
	if(_interview.annotations.segments) {
		var pos = parseInt(sec) * 1000
		var currentSegment = _interview.annotations.segments.filter((a, index)=> {
			if(a.start <= pos && a.end >= pos) {
				return true;
			} else if(pos < a.start && pos >= a.start - 500) {//first try to fetch the closest one AHEAD
				return true;
			} else if(pos > a.end && pos <= a.end + 500) {//then try to fetch the closest one BEFORE
				return true;
			}
			return false;
		});
		if(currentSegment.length > 0) {
			return currentSegment[0];
		}
	}
	return null;
}

function highlight(line, type) {
	if(line) {
		var lines = document.getElementsByClassName(type);
		for(var i=0;i<lines.length;i++) {
			var elm = lines[i];
			if(elm.id == line.number) {
				elm.className = type + ' active';
			} else if(elm.className.indexOf('active') != -1) {
				elm.className = type;
			}
		}
	} else { //reset all highlighting of this type
		var lines = document.getElementsByClassName(type);
		for(var i=0;i<lines.length;i++) {
			lines[i].className = type;
		}
	}
}

function gotoLine(index) {
	_clickedLine = _interview.transcript[index];
	if(_clickedLine) {
		jw.seek(_clickedLine.start / 1000);
	}

    var url = '/play?&id=' + _interview.id + '&s=' + _clickedLine.start + '&e=' + _clickedLine.end;

    // change history to resemble navigating the transcripts
    window.history.pushState( 'play', 'Play', url );

}

function gotoSegment(index) {
	_clickedSegment = _interview.annotations.segments[index];
	if(_clickedSegment) {
		jw.seek(_clickedSegment.start / 1000);
	}

	var url = '/play?&id=' + _interview.id + '&s=' + _clickedSegment.start + '&e=' + _clickedSegment.end;

	// change history to resemble navigating the segments
    window.history.pushState( 'play', 'Play', url );

}

// act on user navigation through browser history
window.onpopstate = function( e ) {

	var start = getParameterByName( 's', document.location );

	if( start ) {
        jw.seek( start / 1000 );
    }

};

function togglePanel(button, panelId) {
	var current = document.getElementById('panel_' + panelId).style.display;

	//reset all the panels, then toggle the selected one
	var panels = document.getElementsByClassName('share-panel');
	for(var i=0;i<panels.length;i++) {
		panels[i].style.display = 'none';
	}
	document.getElementById('panel_' + panelId).style.display = current == 'block' ? 'none' : 'block';

	//reset all the buttons, then toggle the selected one
	var buttons = document.getElementsByClassName('share-btn');
	for(var i=0;i<buttons.length;i++) {
		buttons[i].className = 'btn btn-default share-btn';
	}
	button.className = 'btn' + (current == 'block' ? ' btn-default share-btn' : ' btn-danger share-btn');
}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}