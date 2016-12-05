const DataFormatter = {

	formatSearchResult : function(result) {
		var formattedResult = JSON.parse(JSON.stringify(result._source));
		formattedResult._id = result._id;
		formattedResult._score = result._score;
		formattedResult._type = result._type;
		formattedResult._index = result._index;

		//if the result is aggregated with fragments add those too
		if(result.fragments) {
			formattedResult.fragments = result.fragments;
		}
		return formattedResult;
	},

	getResultSnippetData : function (result) {
		let snippet = {
			_id : result._id,
			title: result.title || result._id,
			date: result.date,
			description : result.description,
			posterURL : result.posterURL
		}
		if(result._type == 'annotation' || result._type == 'media_fragment') {
			snippet.docCount = result.docCount;
			if(result.fragments) {
				snippet.fragments = DataFormatter.addFragmentThumbs(result);
			}
		}
		return snippet;
	},

	addFragmentThumbs : function(result) {
		let imgBase = 'http://rdbg.tuxic.nl/mindoftheuniverse/'//TODO move this to a config
		let fragments = result.fragments.map((frag) => {
			let imgUrl = imgBase;
			imgUrl += result._id + '/thumbnails/' + result.target.assetId;
			imgUrl += '/' + result.target.assetId;
			imgUrl += '_' + DataFormatter.zeroFill(Math.floor(frag.start / 1000), 4) + '.jpg';
			frag.posterURL = imgUrl;
			return frag;
		});
		return fragments;
	},

	zeroFill : function(secs, stringLength) {
		let result = secs + ''
		let s = result.length;
		while(s < stringLength) {
			result = '0' + result;
			s++;
		}
		return result;
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
	}
}

export default DataFormatter;