function init() {
	var MediaFragmentSearch = motu.MediaFragmentSearch;

	var component =	(
		<MediaFragmentSearch
			itemDetailsPath="play"
			collection="motu"
			searchParams={searchParams}
		/>
	);

	ReactDOM.render(
		<div className="col-md-12">
			{component}
		</div>, document.getElementById('fragment_search')
	);
}

init();