import PlayerAPI from './PlayerAPI';

//key: cp1KvUB8slrOvOjg+U8melMoNwxOm/honmDwGg==
//https://developer.jwplayer.com/jw-player/docs/developer-guide/api/javascript_api_reference

export default class JWPlayer extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			jw : null
		}
	}

	componentDidMount() {
		let type = 'mp4';
		if (this.props.mediaObject.mimeType && this.props.mediaObject.mimeType.indexOf('audio') != -1) {
			type = 'mp3';
		}
		const jw = jwplayer('video_player__' + this.props.mediaObject.id).setup({
			file: this.props.mediaObject.url,
			width:'100%',
			type : type,
			controls : true,
			image: null,
			autostart: false,
			//start: this.props.mediaObject.start / 1000,
			key: 'cp1KvUB8slrOvOjg+U8melMoNwxOm/honmDwGg=='
		})
		if(this.props.eventCallbacks) {
			jw.on('bufferChange', this.props.eventCallbacks.loadProgress.bind(this))
			.on('time', this.props.eventCallbacks.playProgress.bind(this))
			.on('play', this.props.eventCallbacks.onPlay.bind(this))
			.on('pause', this.props.eventCallbacks.onPause.bind(this))
			.on('complete', this.props.eventCallbacks.onFinish.bind(this))
			.on('seek', this.props.eventCallbacks.onSeek.bind(this))
			.on('ready', this.onReady.bind(this, jw));
		}
	}

	onReady(jw) {
		this.setState({jw : jw}, function() {
			if(this.props.onPlayerReady) {
				this.props.onPlayerReady(new JWPlayerAPI(this.state.jw));
			}
			let start = this.props.mediaObject.start ? this.props.mediaObject.start : 0;
			if(start > 0) {
				this.state.jw.seek(start / 1000);
			}
		}.bind(this));
	}

	componentWillUnmount() {
		if(this.state.jw) {
			this.state.jw.remove();
		}
	}

	render() {
		return (<div id={'video_player__' + this.props.mediaObject.id}/>);
	}

}

class JWPlayerAPI extends PlayerAPI {

	constructor(playerAPI) {
		super(playerAPI);
	}

	/* ------------ Implemented API calls ------------- */

	play() {
		this.playerAPI.play();
	}

	pause() {
		this.playerAPI.pause();
	}

	seek(secs) {
		this.playerAPI.seek(secs);
	}

	getPosition(callback) {
		callback(this.playerAPI.getPosition());
	}

	getDuration(callback) {
		callback(this.playerAPI.getDuration());
	}

	isPaused(callback) {
		callback(this.playerAPI.getState() == 'paused');
	}

	/* ----------------------- non-essential player specific calls ----------------------- */

	//TODO
}