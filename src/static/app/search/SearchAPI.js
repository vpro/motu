const SearchAPI = {

	fragmentSearch :function(term, searchLayers, selectedFacets, offset, size, callback) {
		var params = {
			term : term,
			searchLayers : searchLayers,
			selectedFacets : selectedFacets,
			offset : offset,
			size : size
		}
		var url = '/s'
		var xhr = new XMLHttpRequest();   // new HttpRequest instance
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}

			}
		}
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(params));
	}

}

export default SearchAPI;