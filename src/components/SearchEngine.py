import requests
import json

class SearchEngine():

	def __init__(self, config):
		self.config = config

	def getResource(self, resourceId, collectionId):
		url = '%s/document/get_doc/%s/%s' % (self.config['SEARCH_API'], collectionId, resourceId)
		resp = requests.get(url)
		if resp.status_code == 200:
			return json.loads(resp.text)
		return None

	def fragmentSearch(self, params):
		url = '%s/layered_search/motu' % self.config['SEARCH_API']
		params['desiredFacets'] = self.getDesiredFacets()
		resp = requests.post(url, data=json.dumps(params))
		if resp.status_code == 200:
			return json.loads(resp.text)
		return None

	def getDesiredFacets(self):
		return [
			{
				'field' : 'tags_raw',
				'title' : 'Interview tags'
			},
			{
				'field' : 'title_raw',
				'title' : 'Researchers'
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