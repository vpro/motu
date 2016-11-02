import TimeUtil from '../util/TimeUtil';

export default class VideoTimeBar extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
	    window.addEventListener('resize', this.respondCanvas.bind(this));
	    this.respondCanvas();
	}

	componentWillUnmount() {
		console.debug('removing this event listener');
		window.removeEventListener('resize', this.respondCanvas.bind(this));
	}

	respondCanvas() {
		var c = document.getElementById('timebar_canvas' + this.props.mediaObject.id);
		var container = document.getElementById('timebar__' + this.props.mediaObject.id);
		c.width = container.offsetWidth;
		c.height = container.offsetHeight;
	}

	seek(event) {
		if(this.props.fragmentMode === false) {
			var c = document.getElementById("timebar_canvas" + this.props.mediaObject.id);
			var mousePos = this.getMousePos(c, event);
			var dur = this.props.duration;
	        var pos = dur / 100 * (mousePos.x / (c.width / 100));
	        this.props.playerAPI.seek(pos);

		} else {
			var c = document.getElementById("timebar_canvas" + this.props.mediaObject.id);
			var mousePos = this.getMousePos(c, event);
			var dur = this.props.end - this.props.start;
			var pos = dur / 100 * (mousePos.x / (c.width / 100));
			this.props.playerAPI.seek(this.props.start + pos);
		}
		this.respondCanvas();
	}

	componentDidUpdate() {
		var c = document.getElementById("timebar_canvas" + this.props.mediaObject.id);
		var dur = -1;
		var elapsed = -1;
		var t = this.props.curPosition;
        if(!t) {
            t = this.props.start;
        }
		if(this.props.fragmentMode === false) {
	        dur = this.props.duration;
	        var formattedTime = TimeUtil.formatTime(t);
	        elapsed = c.width / 100 * (t / (dur / 100));
	        var startPoint = c.width / 100 * (this.props.start / (dur / 100));
	        var endPoint = c.width / 100 * (this.props.end / (dur / 100));
	        var ctx = c.getContext("2d");
	        ctx.clearRect (0, 0, c.width, c.height);
	        ctx.fillStyle = "#FF0000";
	        ctx.fillRect(0,0, elapsed, c.height / 3);//time progressing
	        ctx.fillStyle = "#00FF00";
	        ctx.fillRect(startPoint, 0, 3, c.height);//time progressing
	        ctx.fillStyle = "#FFFF00";
	        ctx.fillRect(endPoint, 0, 3, c.height);//time progressing
	        ctx.font = "20px Verdana";
	        ctx.fillStyle = "#FFFFFF";
	        ctx.fillText(formattedTime, 10, c.height - 5);
	    } else {
			dur = this.props.end - this.props.start;
			var dt = t - this.props.start;
			var formattedTime = TimeUtil.formatTime(t);
			elapsed = c.width / 100 * (dt / (dur / 100));
			var ctx = c.getContext("2d");
			ctx.clearRect (0, 0, c.width, c.height);
			ctx.fillStyle = "#FF0000";
			ctx.fillRect(0,0, elapsed, c.height / 3);//time progressing
			ctx.font = "20px Verdana";
			ctx.fillStyle = "#FFFF00";
			ctx.fillText(formattedTime, 10, c.height - 5);
        }
        //stop the player when the fragment reaches its end
        if(elapsed >= c.width){
        	this.props.playerAPI.pause();
        }
	}

	getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    return {
	      x: evt.clientX - rect.left,
	      y: evt.clientY - rect.top
	    };
	}

	render() {
		return (
			<div id={'timebar__' + this.props.mediaObject.id} className="timebar">
				<canvas id={'timebar_canvas' + this.props.mediaObject.id} width="300" height="50" onClick={this.seek.bind(this)}>
				</canvas>
			</div>
		)
	}
}