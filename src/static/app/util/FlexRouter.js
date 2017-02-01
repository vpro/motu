const FlexRouter = {

	//this is typically called from a search recipe after clicking a search result
	gotoItemDetails : function(itemDetailsRecipePath, searchResult, searchTerm) {
		let url = FlexRouter.__getBaseUrl() + '/' + itemDetailsRecipePath + '?id=' + searchResult._id;
		url += '&cid=' + searchResult._index;
		if(searchTerm) {
			url += '&st=' + searchTerm;
		}
		if(searchResult._type == 'media_fragment') {
			url += '&s=' + searchResult.start;
			url += '&e=' + searchResult.end;
		}
		document.location.href = url;
	},

	//this is typically called from a collection browsing recipe after selecting a collection for closer study
	gotoSearch : function(searchRecipePath, collectionIds) {
		let url = FlexRouter.__getBaseUrl() + '/' + searchRecipePath + '?cids=' + collectionIds.join(',');
		document.location.href =  url;
	},

	__getBaseUrl : function() {
		let temp = window.location.href;
		let arr = temp.split("/");
		return arr[0] + "//" + arr[2];
	}

}

export default FlexRouter;