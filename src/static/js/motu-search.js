function init() {
	var MultiLayeredFragmentSearch = motu.MultiLayeredFragmentSearch;

	var component =	(
		<MultiLayeredFragmentSearch
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