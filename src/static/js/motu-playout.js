function init(metadata, start, end) {
	console.debug(metadata);
	var FlexPlayer = motu.FlexPlayer;
	var mediaObject = {
		url : metadata._source.playableContent[0].url,
		mimeType : 'video/mp4',
		start : start,
		end : end
	}
	var component =	(
		<FlexPlayer
			mediaObject={mediaObject}
		/>
	);

	ReactDOM.render(
		<div className="col-md-12">
			{component}
		</div>, document.getElementById('segment_player')
	);
}

init(_metadata, _start, _end)