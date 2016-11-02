import TimeUtil from '../util/TimeUtil';
import DataFormatter from '../util/DataFormatter';
/*
The search snippet can contain a list of media fragments:
- these are stored under the 'fragments' key
- the 'docCount' key stores how many fragments were found

*/

export default class SearchSnippet extends React.Component {

	constructor(props) {
		super(props);
	}

	showMore(e) {
		e.stopPropagation();
		if(this.props.showMore) {
			this.props.showMore(this.props.data);
		}
	}

	render() {
		let poster = null; //poster of the media object
		let fragments = null; //the fragments found within each media object

		//the poster of the media object
		if(this.props.data.posterURL) {
			poster = (
				<img className="media-object" src={this.props.data.posterURL}
					style={{height:'100px'}}
					alt="Could not find image"/>
			)
		}

		//the fragments that are contained within this media object
		if(this.props.data.fragments) {
			let showMore = null;
			let innerHits = this.props.data.fragments.map((frag, index) => {
				let fragPoster = null;
				let fragSnippet = DataFormatter.formatTranscriptSnippet(frag.words, this.props.searchTerm);
				if(frag.posterURL) {
					fragPoster = (
						<img className="media-object" src={frag.posterURL}
							style={{height:'100px'}}
							alt="Could not find image"/>
					)
				}
				return (
					<div key={'frag__' + index} className="media fragment-hit">
						<div className="media-left media-middle">
							<a href="#">
								{fragPoster}
							</a>
  						</div>
  						<div className="media-body">
							<h4 className="media-heading">
								{frag.title ? frag.title + ' ' : ''}{TimeUtil.formatMillisToTime(frag.start)}
							</h4>
							{fragSnippet}
						</div>
					</div>
				)
			});
			if(this.props.data.fragments.length < this.props.data.docCount) {
				showMore = (
					<button className="btn btn-primary" onClick={this.showMore.bind(this)}>Show more</button>
				)
			}

			fragments = (
				<div style={{paddingTop : '85px'}}>
					<strong>Number of fragments found: {this.props.data.docCount}</strong>
					{innerHits}
					<br/>
					{showMore}
				</div>
			)
		}

		//draw the whole thing
		return (
			<div className="media">
				<div className="media-left">
					<a href="#">
						{poster}
					</a>
					</div>
					<div className="media-body">
					<h4 className="media-heading">
						{this.props.data.title ? this.props.data.title + ' ' : ''}
						({this.props.data.date ? this.props.data.date : ''})
					</h4>
					{fragments}
				</div>
			</div>
		)
	}
}