import moment from 'moment';
import SearchAPI from './SearchAPI';
import FlexHits from './FlexHits';
import FlexPaging from './FlexPaging';
import DataFormatter from '../util/DataFormatter'; //only for MOTU

class MultiLayeredFragmentSearch extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			pageSize : 25,
			searchLayers : {'motu' : false, 'motu__srt' : false, 'motu__topics' : true},
			displayFacets : true,
			aggregations : {},
			selectedFacets : this.props.searchParams ? this.props.searchParams.facets : {},
			currentPage : -1
		}
	}

	/*---------------------------------- COMPONENT INIT --------------------------------------*/

	componentDidMount() {
		if(this.props.searchParams) {
			window.onpopstate = function(event) {
	  			//console.debug("location: " + document.location + ", state: " + JSON.stringify(event.state));
	  			document.location.href=document.location;
			};
		}

		//do an initial search only if there are search params
		if(this.props.searchParams && this.refs.searchTerm) {
			if(this.props.searchParams.term != '' || Object.keys(this.props.searchParams.facets).length > 0) {
				this.refs.searchTerm.value = this.props.searchParams.term;
				this.search(
					this.props.searchParams.term,
					this.props.searchParams.from,
					this.props.searchParams.size,
					this.props.searchParams.facets
				);
			}
		}
	}

	/*---------------------------------- SEARCH --------------------------------------*/

	//TODO make sure to read the current URL path instead of constructing a URL for recipes only!
	//MADE MODIFICATIONS FOR MOTU
	updateAddressBar(term, offset, size, facets, layers) {
		if(this.props.searchParams) {
			var sl = Object.keys(layers).filter((l) => {
				return layers[l];
			}).join(',');

			var url = "/search" + "?st=" + term + '&sf=' + Object.keys(facets).join(',');
			url += '&fr=' + offset + '&sz=' + size;
			if(sl != '') {
				url += '&sl=' + sl;
			}
			window.history.pushState("search", "Search", url);
		}
	}

	search(term, offset, size, facets, updateUrl) {
		if(offset + size <= 10000) {
			SearchAPI.fragmentSearch(
				this.props.collection,
				term,
				this.state.searchLayers,
				this.formatSelectedFacets(facets),//format just before calling the API
				{}, //left out for MOTU
				function(data) { //send the results to the component output (see onOutput())
					this.onOutput.call(
						this,
						this.constructor.name,
						data,
						Math.ceil(offset / this.state.pageSize) + 1
					);
				}.bind(this),
				offset,
				size
			);

			if(updateUrl) {
				this.updateAddressBar(term, offset, size, facets, this.state.searchLayers);
			}
		} else {
			console.debug('Currently the search engine cannot look beyond this point, please narrow your search terms');
		}
	}

	//this resets the paging
	newSearch(e) {
		e.preventDefault();
		this.setState(
			{selectedFacets : {}},
			this.search(this.refs.searchTerm.value, 0, this.state.pageSize, {}, true)
		)
	}

	//this resets the paging
	toggleSearchLayer(e) {
		let searchLayers = this.state.searchLayers;
		searchLayers[e.target.id] = !searchLayers[e.target.id];
		this.setState(
			{searchLayers : searchLayers},
			this.search(
				this.refs.searchTerm.value,
				0,
				this.state.pageSize,
				this.state.selectedFacets,
				true
			)
		);
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

	//format the simple quick access dict (key=facet|value, value=true/false) into an proper object for the SearchAPI
	formatSelectedFacets(selectedFacets) {
		let facets = {}
		Object.keys(selectedFacets).forEach((f) => {
			let temp = f.split('\|');
			let key = temp[0]
			let value = this.formatDateHistogramFacetValue(key, temp[1]);//to make sure the match the date format in the index
			if(facets[key]) {
				facets[key].push(value);
			} else {
				facets[key] = [value];
			}
		});
		return facets;
	}

	getFacetTitle(facetId) {
		let facets = DataFormatter.getFacets();
		let title = null;
		for(let f of facets) {
			if(f.field == facetId) {
				title = f.title;
				break;
			}
		}
		return title;
	}

	//TODO possibly move this to a suitable utily class
	formatDateHistogramFacetValue(key, value) {
		let desiredFacets = DataFormatter.getFacets().filter((f) => {
			return f.field == key;
		});
		if(desiredFacets.length == 1) {
			let qf = desiredFacets[0].queryDateFormat;
			if(qf) {
				return moment(value, 'DD-MM-YYYY').format(qf);
			}
		}
		return value;
	}

	/*---------------------------------- COMMUNICATION CONDUIT TO OWNER --------------------------------------*/


	onOutput(componentClass, data, pageNumber) {
		//passes along the output to the owner (if specified in the props)
		if(this.props.onOutput) {
			let dateField = this.state.collectionConfig.getDateFields();
			console.debug(dateField);
  			if(dateField && dateField.length > 0) {
  				dateField = dateField[0];
  			}
  			//this propagates the query output back to the recipe, who will delegate it further to any configured visualisation
  			this.props.onOutput(this.constructor.name, {
				collectionId : this.props.collection, //currently this is the same as the collection ID in the collection API
				results : data, //the results of the query that was last issued
				dateField : dateField //the currently selected datafield (TODO this is currently defined in the collection config)
			});
			//this.props.onOutput(componentClass, data);
		}
		//stores the current output of the last search in the state (for bookmarking)
		if(componentClass == 'MultiLayeredFragmentSearch') {
			this.setState({
				currentOutput: data ? data.results : null,
				aggregations : data ? data.aggregations : null,
				totalHits : data ? data.totalHits : 0,
				totalUniqueHits : data ? data.totalUniqueHits : 0,
				currentPage : data ? pageNumber : -1
			});
		}
	}

	render() {
		let facets = null;
		let resultList = null;
		let resultStats = null;
		let paging = null;
		let heading = null;

		//draw a heading with the name of the collection (if configured that way)
		if(this.props.header) {
			heading = (<h3>Search through:&nbsp;{this.props.collection}</h3>)
		}

		//only draw this when there are search results
		if(this.state.currentOutput) {
			let numResults = this.state.totalHits;
			let items = this.state.currentOutput.map((result, index) => {
				return (
					<FlexHits
						key={'__' + index}
						result={result}
						searchTerm={this.refs.searchTerm.value}
						collectionConfig={this.state.collectionConfig}
						itemDetailsPath={this.props.itemDetailsPath}
						showMore={this.showMore.bind(this)}
						searchTerm={this.refs.searchTerm.value}/>
				)
			}, this);


			if(items && numResults > 0) {
				if(this.state.aggregations) {
					facets = [];
					Object.keys(this.state.aggregations).forEach((key, index) => {
						let options = this.state.aggregations[key].map((facet, fIndex) => {
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
			//resultStats = (<h6>Found media objects: {this.state.totalUniqueHits}/{numResults}</h6>);

			//draw the paging buttons
			if(this.state.currentPage > 0) {
				paging = <FlexPaging
					currentPage={this.state.currentPage}
					numPages={Math.ceil(numResults / this.state.pageSize)}
					gotoPage={this.gotoPage.bind(this)}/>
			}
		}

		//render the stuff on screen
		return (
			<div>
				{heading}
				<div className="row">
					<div className="col-md-12">
						<form className="form-inline">
							<div className="form-group">
								<input type="text" className="form-control" style={{width: '500px'}} id="search_term"
									ref="searchTerm" placeholder="Search"/>
							</div>
							&nbsp;
							<button className="btn btn-default" onClick={this.newSearch.bind(this)}>Search</button>
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

export default MultiLayeredFragmentSearch;