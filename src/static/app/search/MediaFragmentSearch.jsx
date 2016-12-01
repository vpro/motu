import SearchAPI from './SearchAPI';
import FlexHits from './FlexHits';
import DataFormatter from '../util/DataFormatter';

export default class MediaFragmentSearch extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			pageSize : 10,
			searchLayers : {'motu' : true, 'motu__srt' : false, 'motu__topics' : true},
			displayFacets : true,
			facets : {},
			selectedFacets : this.props.searchParams ? this.props.searchParams.facets : {}
		}
	}

	componentDidMount() {
		//to an initial search if the URL contains search parameters
		if(this.props.searchParams) {
			this.refs.searchTerm.value = this.props.searchParams.term;
			this.search(
				this.props.searchParams.term,
				this.props.searchParams.from,
				this.props.searchParams.size,
				this.props.searchParams.facets
			);
		}
	}

	/*---------------------------------- SEARCH --------------------------------------*/

	//update the browser address bar, but don't reload. Instead the browser history is used,
	//so it is even possible to go back to previous searches
	updateAddressBar(term, offset, size, facets) {
		var url = "/search?st=" + term + '&sf=' + Object.keys(facets).join(',');
		url += '&fr=' + offset + '&sz=' + size
		window.history.pushState("search", "Search", url);
	}

	search(term, offset, size, facets, updateUrl) {
		SearchAPI.fragmentSearch(
			term,
			this.state.searchLayers,
			this.formatSelectedFacets(facets),
			offset,
			size,
			this.onResults.bind(this)
		);

		if(updateUrl) {
			this.updateAddressBar(term, offset, size, facets);
		}
	}

	onResults(data) {
		//stores the current output of the last search in the state (for bookmarking)
		this.setState({
			searchResults: data ? data.results : null,
			facets : data ? data.facets : null,
			totalHits : data ? data.totalHits : 0,
			totalUniqueHits : data ? data.totalUniqueHits : 0
		});
	}

	//this resets the paging
	newSearch(e) {
		e.preventDefault();
		this.setState(
			{selectedFacets : {}},
			this.search(this.refs.searchTerm.value, 0, this.state.pageSize, [], true)
		)
	}

	//this resets the paging
	toggleFacet(e) {
		let facets = this.state.selectedFacets;
		if(facets[e.target.id]) {
			delete facets[e.target.id];
		} else {
			facets[e.target.id] = true;
		}
		this.setState(
			{selectedFacets : facets},
			this.search(this.refs.searchTerm.value, 0, this.state.pageSize, facets, true)
		)
	}

	//this obviously does not reset the paging
	gotoPage(pageNumber) {
		this.search(
			this.refs.searchTerm.value,
			(pageNumber-1) * this.state.pageSize,
			this.state.pageSize,
			this.state.selectedFacets,
			true
		)
	}

	showMore(result) {
		console.debug('I want to see more of: ');
		console.debug(result);
	}

	/*---------------------------------- BORING FORMATTING FUNCTIONS --------------------------------------*/

	//format the simple quick access dict (key=facet|value, value=true/false) into an proper object for the SearchAPI
	formatSelectedFacets(selectedFacets) {
		let facets = {}
		Object.keys(selectedFacets).forEach((f) => {
			let temp = f.split('\|');
			if(facets[temp[0]]) {
				facets[temp[0]].push(temp[1]);
			} else {
				facets[temp[0]] = [temp[1]];
			}
		});
		return facets;
	}

	getFacetTitle(facetId) {
		let facets = this.getFacets();
		let title = null;
		for(let f of facets) {
			if(f.field == facetId) {
				title = f.title;
				break;
			}
		}
		return title;
	}

	getSearchLayerName(collectionId, index) {
		if(index == collectionId) {
			return this.SEARCH_LAYER_MAPPING['default'];
		}
		else if(index.indexOf(collectionId) != -1) {
			return this.SEARCH_LAYER_MAPPING[index.substring(collectionId.length +2)];
		}
		return 'Unknown?';
	}

	getFacets() {
		return [
			{
				'field' : 'title_raw',
				'title' : 'Researchers'
			},
			{
				'field' : 'tags_raw',
				'title' : 'Interview tags'
			},
			{
				'field' : 'body.value.tags_raw',
				'title' : 'Segment tags',
				'type' : 'nested'
			},
			{
				'field' : 'location',
				'title' : 'Filming location'
			}
		]
	}

	/*---------------------------------- RENDERING --------------------------------------*/

	render() {
		let facets = null;
		let resultList = null;
		let resultStats = null;
		let paging = null;
		let heading = null;

		//only do this when there are search results
		if(this.state.searchResults) {
			let numResults = this.state.totalHits;
			let items = this.state.searchResults.map((result, index) => {
				return (
					<FlexHits
						key={'__' + index}
						result={result}
						searchTerm={this.refs.searchTerm.value}
						itemDetailsPath={this.props.itemDetailsPath}
						showMore={this.showMore.bind(this)}
						searchTerm={this.refs.searchTerm.value}/>
				)
			}, this);


			if(items && numResults > 0) {
				if(this.state.facets) {
					facets = [];
					Object.keys(this.state.facets).forEach((key, index) => {
						let options = this.state.facets[key].map((facet, fIndex) => {
							let facetId = key + '|' + facet.key;
							return (
								<li key={'facet__' + index + '__' + fIndex} className="facet-item">
									<div className="checkbox inline">
										<label>
											<input id={facetId}
												type="checkbox"
												checked={this.state.selectedFacets[facetId] ? true : false}
												onChange={this.toggleFacet.bind(this)}/>
												{facet.key}&nbsp;({facet.doc_count})
										</label>
									</div>
								</li>
							)
						});
						if(options.length > 0) {
							facets.push((
								<div key={'facet__' + index}>
									<h5>{this.getFacetTitle(key)}</h5>
									<ul className="facet-group">
										{options}
									</ul>
								</div>
							))
						}
					});
				}
				//draw the result list
				resultList = (
					<div className="row">
						<div className={facets ? 'col-md-3' : 'col-md-0'}>
							{facets}
						</div>
						<div className={facets ? 'col-md-9' : 'col-md-12'}>
							{items}
						</div>
					</div>
				)
			}

			//draw the result stats
			resultStats = (<h6>Found media objects: {this.state.totalUniqueHits}/{numResults}</h6>);

			//draw the paging buttons
			let pagingButtons = []
			let numPages = Math.ceil(numResults / this.state.pageSize);
			for(let i=0;i<numPages;i++) {
				pagingButtons.push(
					<button key={i+1} type="button" className="btn btn-default" onClick={this.gotoPage.bind(this, i+1)}>
						{i+1}
					</button>
				);
			}
			paging = (
				<div className="btn-group" role="group" aria-label="...">
					{pagingButtons}
				</div>
			);
		}

		//assemble everything and render it on screen
		return (
			<div>
				<div className="row">
					<div className="col-md-12">
						<form className="form-inline">
							<div className="form-group">
								<label htmlFor="search_term">Search</label>
								&nbsp;
								<input type="text" className="form-control" style={{width:'600px'}} id="search_term"
									ref="searchTerm" placeholder="Search"/>
							</div>
							&nbsp;
							<button className="btn btn-default" onClick={this.newSearch.bind(this)}>Submit</button>
						</form>
					</div>
				</div>
				{resultStats}
				{paging}
				<br/>
				{resultList}
			</div>
		)
	}

}