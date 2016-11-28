import requests
import json


class DataLoader():

	def __init__(self, config):
		self.config = config

	#TODO load the text from a file
	def loadIntroText(self):
		introText = "Mind of the Universe is a place of learning, a place where normal things are scrutinised in such ways that they won't appear normal very often anymore"
		return introText

	#TODO load random video from a static list
	def loadRandomVideo(self):
		randomVideo = 'http://rdbg.tuxic.nl/mindoftheuniverse/Erik_Demaine/mp4/ED_INTERVIEW_1_H264_AVC_8mb_BenG_169.1.mp4'
		return randomVideo

	def loadScientists(self):
		scientists = []
		url = '%s/search/motu' % self.config['SEARCH_API']
		query = {"query":{"bool":{"must":[{"match_all":{}}],"must_not":[],"should":[]}},"from":0,"size":50,"sort":[],"aggs":{}}
		resp = requests.post(url, data=json.dumps(query))
		if resp.status_code == 200:
			data = json.loads(resp.text)
			if 'hits' in data and 'total' in data['hits']:
				for hit in data['hits']['hits']:
					scientists.append({
						'id' : hit['_id'],
						'name' : hit['_source']['title_raw'],
						'poster' : hit['_source']['posterURL']
					})
		return scientists

	def loadScientist(self, scientistId):
		url = '%s/document/get_doc/motu/%s' % (self.config['SEARCH_API'], scientistId)
		resp = requests.get(url)
		if resp.status_code == 200:
			data = json.loads(resp.text)
			if '_source' in data:
				scientist = {}
				if 'title_raw' in data['_source']:
					scientist['name'] = data['_source']['title_raw']
				if 'posterURL' in data['_source']:
					scientist['poster'] = data['_source']['posterURL']
				if 'playableContent' in data['_source']:
					scientist['videos'] = data['_source']['playableContent']
				return scientist
		return None


	#TODO load the tags from elasticsearch
	def loadTagCloud(self):
		tagCloud = {'Astrophysics' : 12, 'Biology' : 13, 'DNA' : 15, 'Humanity' : 19, 'Acceptance' : 12, 'Economics' : 17}
		return tagCloud