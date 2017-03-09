//in case there is a URL parameter for tag, highlight right after the page is loaded
var url = window.location.href;
var tag = null;
if(url.indexOf('?') != -1) {
	tag = url.substring(url.indexOf('?') + 1);
	if(tag.indexOf('=') != -1) {
		highlight(tag.split('=')[1].replace('%20', ' '));
	}
}

function highlight(tag) {
	var tagElm = document.getElementById(tag);
	if(tagElm) {
		var hits = _scientists.filter(function(s) {
			return s.interviewTags.hasOwnProperty(tag);
		});

		//highlight and move forward the hits
		moveForward(hits);

		//reset all the tags
		var ets = document.getElementsByClassName('explore-tag');
		for(var i=0;i<ets.length;i++) {
			document.getElementById(ets[i].id).className = 'data explore-tag';
		}

		//highlight the selected tag

		tagElm.className = 'data explore-tag selected';


	}
}

function moveForward(hits) {
	//remove all the copied elements (which have the active class)
	var numActive = parseInt(document.getElementsByClassName('highlighted').length);
	for(var i=0;i<numActive;i++) {
		document.getElementById('scientists').removeChild(
			document.getElementById('scientists').firstChild
		);
	}

	//show all elements again
	var all = document.getElementsByClassName('box');
	for(var i=0;i<all.length;i++) {
		if(all[i].hasAttribute('id')) { //the elements in the selected area don't have an idea
			//document.getElementById(all[i].id).className = 'box';
			document.getElementById(all[i].id).style.display = 'inline-block';
		}
	}

	//then copy, move and highlight the hits and hide the copied elements
	for(var i=0;i<hits.length;i++) {
		var tmp = document.getElementById(hits[i].id).cloneNode(true);
		tmp.removeAttribute("id");
		tmp.className += ' highlighted';

		//hide the real element
		document.getElementById(hits[i].id).style.display = 'none';

		//put the cloned element in front
		document.getElementById('scientists').prepend(tmp);
	}
}