import SearchSnippet from './SearchSnippet';
import DataFormatter from '../util/DataFormatter';

export default class FlexHits extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal : false
		};
	}

	//BIG TODO: there must be an overarching persistent ID system to load individual records
	//eventually this should simply handle persistent (media fragment) URIs, instead of these silly params

	gotoItemDetails(result, fragment) {
		if(this.props.itemDetailsPath && result._id) {
			let temp = window.location.href;
			let arr = temp.split("/");
			let protHostPort = arr[0] + "//" + arr[2];
			let url = protHostPort + '/' + this.props.itemDetailsPath + '?id=' + result._id;
			url += '&cid=motu'
			if(this.props.searchTerm) {
				url += '&fq=' + this.props.searchTerm;
			}
			if(fragment) {
				url += '&s=' + fragment.start;
				url += '&e=' + fragment.end;
			}
			document.location.href = url;
		}
	}

	showMore(result) {
		if(this.props.showMore) {
			this.props.showMore(result);
		}
	}

	render() {
		const result = DataFormatter.formatSearchResult(this.props.result);
		const snippet = DataFormatter.getResultSnippetData(result);
		return (
			<div
				className="search-result"
				key={result._id}
				onClick={this.gotoItemDetails.bind(this, result, null)}
			>
				<SearchSnippet
					data={snippet}
					showMore={this.showMore.bind(this)}
					searchTerm={this.props.searchTerm}
					gotoItemDetails={this.gotoItemDetails.bind(this)}
					/>
			</div>
		);
	}
}