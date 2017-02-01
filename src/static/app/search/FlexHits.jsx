import SearchSnippet from './SearchSnippet';
import DataFormatter from '../util/DataFormatter';
import FlexRouter from '../util/FlexRouter';

export default class FlexHits extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal : false
		};
	}

	//BIG TODO: there must be an overarching persistent ID system to load individual records
	//eventually this should simply handle persistent (media fragment) URIs, instead of these silly params

	gotoItemDetails(result) {
		if(this.props.itemDetailsPath && result._id) {
			FlexRouter.gotoItemDetails(this.props.itemDetailsPath, result, this.props.searchTerm);
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
				onClick={this.gotoItemDetails.bind(this, result)}
			>
				<SearchSnippet
					data={snippet}
					showMore={this.showMore.bind(this)}
					searchTerm={this.props.searchTerm}
					/>
			</div>
		);
	}
}