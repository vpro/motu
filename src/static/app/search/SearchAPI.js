const SearchAPI = {

	fragmentSearch :function(collectionId, term, searchLayers, selectedFacets, desiredFacets, callback,
		offset=0 , size=10, innerHitsSize=3, innerHitsOffset=0) {
		var url = '/s';
		var params = {
			term : term,
			searchLayers : searchLayers,
			selectedFacets : selectedFacets,
			offset : offset,
			size : size,
			desiredFacets : desiredFacets
		}
		var xhr = new XMLHttpRequest();
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