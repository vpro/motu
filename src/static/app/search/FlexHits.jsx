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

	gotoItemDetails(result) {
		if(this.props.itemDetailsPath && result._id) {
			FlexRouter.gotoItemDetails(this.props.itemDetailsPath, result, this.props.searchTerm);
		}
	}

	render() {
		const result = DataFormatter.formatSearchResult(this.props.result);
		const snippet = DataFormatter.getResultSnippetData(result);
		return (
			<div className="search-result"
				key={result._id}
				onClick={this.gotoItemDetails.bind(this, result)}>

				<SearchSnippet data={snippet} searchTerm={this.props.searchTerm}/>
			</div>
		);
	}
}