#!/usr/bin/pythonw2.7

from elasticsearch import Elasticsearch

class SearchEngine():

	def __init__(self, config):
		self.config = config
		self.es = Elasticsearch(host='localhost', port=9210)
		print self.es.info()

	def getResource(self, resourceId, collectionId):
		resp = self.es.get(index=collectionId, id=resourceId)
		return resp

	def fragmentSearch(self, collectionId, term, searchLayers, selectedFacets, offset=0 , size=10, innerHitsOffset=0, innerHitsSize=3):
		indices = []
		namedQueries = []
		hasFragmentQuery = False
		filterBlock = {}
		aggregationBlock = {}

		#determine the indices to query and what named queries (for the 'should' block) to run on those
		for key in searchLayers:
			if searchLayers[key]:
				indices.append(key)

				#look for media fragment indices
				if key.find('__') != -1 and not hasFragmentQuery:
					#this query will run against all media fragment indices
					namedQueries.append({
						"nested": {
							"path": "body.value",
							"query": {
								"bool": {
									"should": [{
										"match": {
											"body.value.words": term
										}
									}]
								}
							},
							"inner_hits": {
								"size": innerHitsSize,
								"from" : innerHitsOffset
							},
							"_name": 'media_fragment'
						}
		        	});
					hasFragmentQuery = True
				elif key == collectionId:
					namedQueries.append({
						"match": {
							"_all": {
								"query": term,
								"_name": "all_metadata" #make sure to make this a constant!
							}
						}
					});

		if len(indices) == 0:
			return None

		#then determine the filter queries (for the entire query and each aggregator!)
		if selectedFacets:
			filters = []
			for f in selectedFacets:
				ors = []
				for value in selectedFacets[f]:
					query = {"match" : {}}
					query['match'][f] = value;
					ors.append(query)


				filters.append({"or": ors})

			print filters

			#http://stackoverflow.com/questions/23634687/elasticsearch-nested-and-or-filter
			if len(filters) > 0:
				filterBlock = {#TODO make sure this is better than should/must queries
					'and' : filters
				}

		collectionFacets = self.getFacets();
		if collectionFacets:
			#generate the aggregations
			for f in collectionFacets:
				aggr = {
					"aggs" : {},
					"filter": filterBlock
				}
				aggr['aggs'][f['field']] = {
					"terms": {
						"field": f['field']
					}
				}
				#if it is an top-level facet, add a sub aggregation on resourceId, to distinguish actual unique hits
				if(f['field'] != '_index' or f['field'] != 'body.type'):
					aggr['aggs'][f['field']]['aggs'] = {
						"resourceId": {
							"terms": {
								"field": "resourceId"
							}
						}
					}

				aggregationBlock[f['field']] = aggr

		query = {
			"query": {
				"bool": {
				#this part is generic for fragment based indices
					"should": namedQueries
				}
			},
			"_source": {
				"exclude": "body.value"
			},
			#this part should also be taken from the collection config
			"aggs": aggregationBlock,
			"from" : offset,
			"size": size
		}
		if selectedFacets:
			query['filter'] = filterBlock

		#then fire the actual search request
		return self.search(','.join(indices), query);

	def search(self, searchIndices, query):
		resp = self.es.search(index=searchIndices, body=query)
		return self.__formatSearchResults(resp)

	def __formatSearchResults(self, data):
		if not data or not 'hits' in data:
			return None

		aggregatedResults = {}
		for hit in data['hits']['hits']:
			result = {}
			if '_source' in hit:
				if hit['_type'] == 'media_fragment' and 'inner_hits' in hit:
					result['_id'] = hit['_source']['resourceId']
					result['_index'] = hit['_source']['collectionId']
					result['_type'] = hit['_type']

					fragLength = hit['inner_hits']['body.value']['hits']['total'];
					result['_source'] = {
						'title' : hit['_source']['title'],
						'date' :  hit['_source']['sortdate'],
						'posterURL' : hit['_source']['posterURL'],
						'docCount' : fragLength,
						'target' : hit['_source']['target']
					}
					if fragLength > 0:
						fragments = []
						for frag in hit['inner_hits']['body.value']['hits']['hits']:
							fragments.append(frag['_source'])
						result['fragments'] = fragments

				else: #the type should not matter, but the mapping should have the body.value... :s
					result['_id'] = hit['_source']['resourceId']
					result['_index'] = hit['_source']['collectionId']
					result['_type'] = hit['_type']
					result['_source'] = {}
					if 'title' in hit['_source']:
						result['_source']['title'] = hit['_source']['title']
					if 'sortdate' in hit['_source']:
						result['_source']['sortdate'] = hit['_source']['sortdate']
					if 'posterURL' in hit['_source']:
						result['_source']['posterURL'] = hit['_source']['posterURL']

			#then check if the result was already in the list
			if result['_id'] in aggregatedResults:
				temp = aggregatedResults[result['_id']];
				if 'fragments' in result and result['fragments']:
					if 'fragments' in temp:
						temp['fragments'].extend(result['fragments']);
						temp['_source']['docCount'] += result['_source']['docCount']
					else:
						temp['fragments'] = result['fragments']
						temp['_source']['docCount'] = result['_source']['docCount']

			else:
				aggregatedResults[result['_id']] = result

		#put the facets in a more friendly format
		facets = {}
		for key in data['aggregations']:
			options = []
			for facet in data['aggregations'][key][key]['buckets']:
				if key != '_index' and key != 'body.type':
					#this is utilizes the sub aggregations defined for top-level facets (see self.fragmentSearch
					options.append({'key' : facet['key'], 'doc_count' : len(facet['resourceId']['buckets'])})
				else:
					options.append(facet)

			facets[key] = options

		#return everything as a list
		resultList = []
		for key in aggregatedResults:
			resultList.append(aggregatedResults[key])
		return {
			'results': resultList,
			'facets' : facets
		}

	def getFacets(self):
		return [
			{
				'field': 'body.type',
				'title' : 'Fragment type'
			},
			{
				'field' : '_index',
				'title' : 'Index'
			},
			{
				'field' : 'topics',
				'title' : 'Topics'
			},
			{
				'field' : 'title_raw',
				'title' : 'Researchers'
			},
			{
				'field' : 'tags',
				'title' : 'Tags'
			},
			{
				'field' : 'location',
				'title' : 'Filming location'
			}
		]


if __name__ == '__main__':
	se = SearchEngine({}) #TODO maybe define a config
	"""
	print se.fragmentSearch(
		'motu',
		'humans',
		{'motu' : True, 'motu__srt' : True, 'motu__topics' : True},
		None, #selected facets
		0, #offset
		10, #size
		0, #inner offset
		3 #inner size
	)
	"""
	print se.getResource('George_Church', 'motu')