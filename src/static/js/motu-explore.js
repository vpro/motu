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

		//reset all
		var all = document.getElementsByClassName('scientist');
		for(var i=0;i<all.length;i++) {
			if(all[i].hasAttribute('id')) { //the elements in the selected area don't have an idea
				document.getElementById(all[i].id).className = 'col-md-3 scientist';
				//document.getElementById(all[i].id).style.display = 'inline-block';
			}
		}

		//highlight the hits
		for(var i=0;i<hits.length;i++) {
			document.getElementById(hits[i].id).className = 'col-md-3 scientist active';
		}

		//reset all the tags
		var ets = document.getElementsByClassName('explore-tag');
		for(var i=0;i<ets.length;i++) {
			document.getElementById(ets[i].id).className = 'data explore-tag';
		}

		//highlight the selected tag

		tagElm.className = 'data explore-tag active';


		setSelected(hits);
	}
}

function setSelected(hits) {
	document.getElementById('selected_scientists').innerHTML = '';
	for(var i=0;i<hits.length;i++) {
		var tmp = document.getElementById(hits[i].id).cloneNode(true);
		//document.getElementById(hits[i].id).style.display = 'none';
		tmp.removeAttribute("id");
		document.getElementById('selected_scientists').appendChild(tmp);
	}
}