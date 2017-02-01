const DataFormatter = {

	formatSearchResult : function(result) {
		var formattedResult = JSON.parse(JSON.stringify(result._source));
		formattedResult._id = result._id;
		formattedResult._score = result._score;
		formattedResult._type = result._type;
		formattedResult._index = result._index;
		return formattedResult;
	},

	getResultSnippetData : function (result) {
		let snippet = {
			_id : result._id,
			title: result.title || result._id,
			date: result.date,
			description : result.description,
			posterURL : result.posterURL,
			tags : result.tags ? result.tags : null
		}
		if(result._type == 'media_fragment') {
			snippet.docCount = result.docCount;
		}
		return snippet;
	},

	//this highlights the searchTerm in the snippet (TODO this should be replace by using ES highlighting)
	formatTranscriptSnippet(words, searchTerm) {
		var MAX_WORDS = 35;
		var tmp = words.split(' ');
		//console.debug(tmp);
		let i = 0;
		let found = false;
		for(let w of tmp) {
			if(w.indexOf(searchTerm) != -1 || w.indexOf(searchTerm.toLowerCase()) != -1) {
				words = tmp.slice(
					i-6 >= 0 ? i-6 : 0,
					i + MAX_WORDS < tmp.length ? i + MAX_WORDS : tmp.length
				)
				words.splice(0, 0, '(...)');
				if(i != tmp.length -1) {
					words.splice(words.length, 0, '(...)');
				}
				words = words.join(' ');
				found = true;
				break;
			}
			i++;
		}
		if(!found && tmp.length > MAX_WORDS) {
			words = tmp.slice(0, MAX_WORDS);
			words.splice(words.length, 0, '(...)');
			words = words.join(' ');
		}
		return words;
	},

	getFacets() {
		return [
			{
				field : 'name',
				title : 'Researchers'
			},
			{
				field : 'body.value.tags_raw',
				title : 'Segment tags',
				type : 'nested'
			},
			{
				field : 'tags_raw',
				title : 'Interview tags'
			},
			{
				field : 'placeOfResidence',
				title : 'Place of residence'
			},
			{
				field : 'nationality',
				title : 'Nationality'
			}
		]
	}
}

export default DataFormatter;