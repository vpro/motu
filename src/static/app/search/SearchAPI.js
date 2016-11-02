const SearchAPI = {

	fragmentSearch :function(term, searchLayers, selectedFacets, offset, size, callback) {
		var params = {
			term : term,
			searchLayers : searchLayers,
			selectedFacets : selectedFacets,
			offset : offset,
			size : size
		}
		var xhr = new XMLHttpRequest();   // new HttpRequest instance
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				console.debug(xhr);
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}

			}
		}
		xhr.open("POST", "/s");
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(params));
	}

}

export default SearchAPI;