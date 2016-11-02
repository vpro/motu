function init() {
	var FlexPlayer = motu.FlexPlayer;
	var mediaObject = {
		url : 'http://os-immix-w/mindoftheuniverse/George_Church/mp4/george_church_H264_AVC_8mb_BenG_169.mp4',
		mimeType : 'video/mp4'
	}
	var component =	(
		<FlexPlayer
			mediaObject={mediaObject} //TODO make this plural for playlist support
		/>
	);

	ReactDOM.render(
		<div className="col-md-12">
			{component}
		</div>, document.getElementById('segment_player')
	);
}

init();