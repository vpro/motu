function highlight(tag) {

	var hits = _scientists.filter(function(s) {
		return s.interviewTags.hasOwnProperty(tag);
	});

	//reset all
	var all = document.getElementsByClassName('scientist');
	for(var i=0;i<all.length;i++) {
		document.getElementById(all[i].id).className = 'col-md-2 scientist';
	}

	//highlight the hits
	for(var i=0;i<hits.length;i++) {
		document.getElementById(hits[i].id).className = 'col-md-2 scientist active';
	}

	//reset all the tags
	var ets = document.getElementsByClassName('explore-tag');
	for(var i=0;i<ets.length;i++) {
		document.getElementById(ets[i].id).className = 'explore-tag';
	}

	//highlight the selected tag
	document.getElementById(tag).className = 'explore-tag active';

}