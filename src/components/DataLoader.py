import requests
import random
import json
from datetime import datetime
import os
import codecs
from itertools import groupby
from collections import namedtuple
from markdown import markdown
import wikipedia

class DataLoader():

	def __init__(self, config):
		self.config = config
		self.TERM_EXTRACTION_API = 'http://termextract.fivefilters.org/extract.php'
		self.WIKI_MAPPING = {
			'George_Church' : 'George_M_Church',
			'Sara_Seager' : 'Sara_Seager',
			'Erik_Demaine' : 'Erik_Demaine',
			'Donald_Hoffman' : None,
			'Guy_Consolmagno' : 'Guy_Consolmagno',
			'Jean-Jacques_Hublin' : 'Jean_Jacques_Hublin',
			'Trond_Helge_Torsvik' : None,
			'Michael_Poulin' : None,
			'Lee_Cronin' : 'Leroy_Cronin',
			'Susant_Patnaik' : None
		}

	def loadMarkdownFile(self, fn):
		text = None
		f = open('%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], fn), 'r')
		text = f.read()
		f.close()
		return markdown(text)

	#TODO load random video from a static list
	def loadRandomVideo(self):
		r = random.choice(self.WIKI_MAPPING.keys())
		randomVideo = 'http://rdbg.tuxic.nl/mindoftheuniverse/%s/mp4/%s.mp4' % (r, r)
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
						'bio' : self.__loadWikipediaBio(hit['_id']),
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
					scientist['name'] = data['_source']['name']
				if 'posterURL' in data['_source']:
					scientist['poster'] = data['_source']['posterURL']
				if 'playableContent' in data['_source']:
					scientist['videos'] = data['_source']['playableContent']
				scientist['transcript'] = self.__loadTranscript(scientistId)
				scientist['bio'] = self.__loadWikipediaBio(scientistId)
				tc = self.__loadTermCloud(scientistId)
				if tc:
					scientist['termCloud'] = json.loads(tc)
				return scientist
		return None

	def __loadTranscript(self, scientistId):
		subs = []
		for root, dirs, files in os.walk('%s/transcripts/%s' % (self.config['TEXTUAL_CONTENT_DIR'], scientistId)):
			for f in files:
				if f.find('.srt') != -1:
					subs.extend(self.__parseSRT(os.path.join(root, f)))
		return subs

	def __parseSRT(self, fn):
		subs = []
		with codecs.open(fn, 'r', 'utf-8') as f:
			res = [list(g) for b,g in groupby(f, lambda x: bool(x.strip())) if b]

			Subtitle = namedtuple('Subtitle', 'number start end content prettystart')
			for sub in res:
				if len(sub) >= 3: # not strictly necessary, but better safe than sorry
					sub = [x.strip() for x in sub]
					number, start_end, content = sub
					start, end = start_end.split(' --> ')
					subs.append(Subtitle(
						number,
						self.__SRTTimetoMillis(start),
						self.__SRTTimetoMillis(end),
						content,
						self.__SRTTimetoPrettyTime(start)
					))
		return subs

	def __SRTTimetoPrettyTime(self, t):
		x = datetime.strptime(t, '%H:%M:%S,%f')
		return x.strftime('%H:%M:%S')

	def __SRTTimetoMillis(self, t):
		x = datetime.strptime(t, '%H:%M:%S,%f')
		return ((x.hour * 3600 + x.minute * 60 + x.second) * 1000) + int(str(x.microsecond)[0:3])

	#TODO load the tags from elasticsearch
	def loadTagCloud(self):
		tagCloud = {'Astrophysics' : 12, 'Biology' : 13, 'DNA' : 15, 'Humanity' : 19, 'Acceptance' : 12, 'Economics' : 17}
		return tagCloud

	def __loadWikipediaBio(self, scientistId):
		bio = 'No Wikipedia article available'
		wikiId = None
		#fetch the wikipedia ID from the mapping
		try:
			wikiId = self.WIKI_MAPPING[scientistId]
		except KeyError, e:
			print 'incorrect wiki mapping'
			return bio

		#if there is no proper wikipedia ID return nothing
		if wikiId == None:
			return bio

		#try to fetch it from the cache
		cachedData = self.__readFromCache(scientistId, 'wikipedia-cache')
		if cachedData:
			#print 'found %s  in cache' % scientistId
			return cachedData

		#try to fetch it from wikipedia (and subsequently cache it)
		print 'trying to fetch %s from wikipedia' % wikiId
		try:
			bio = wikipedia.summary(wikiId)
			if bio:
				self.__writeToCache(scientistId, 'wikipedia-cache', bio)
		except wikipedia.PageError, e:
			pass
		except wikipedia.exceptions.DisambiguationError, e:
			bio = 'Ambiguous article'
			pass
		except KeyError, e:
			bio = 'Incorrect id %s' % wikiId
			pass
		return bio

	def __loadTermCloud(self, scientistId):
		cachedData = self.__readFromCache(scientistId, 'termcloud-cache')
		if cachedData:
			return cachedData

		#otherwise run the transcript through the term extractor and get the term cloud
		transcript = None
		subs = self.__loadTranscript(scientistId)
		if subs:
			transcript = ''
			for s in subs:
				transcript += s.content
		if transcript:
			url = self.TERM_EXTRACTION_API
			params = {
				'text_or_url': transcript,
				'output' : 'json'
			}
			resp = requests.post(url, data=params)
			if resp.status_code == 200:
				tc = '{ "terms" : %s}' % resp.text
				self.__writeToCache(scientistId, 'termcloud-cache', tc)
				return tc
		return None

	#cacheType = wikipedia-cache OR termcloud-cache
	def __writeToCache(self, scientistId, cacheType, data):
		cacheFile = '%s/%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], cacheType, scientistId)
		f = open(cacheFile, 'w+')
		f.write(data)
		f.close()

	def __readFromCache(self, scientistId, cacheType):
		data = None
		cacheFile = '%s/%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], cacheType, scientistId)
		if os.path.exists(cacheFile):
			f = open(cacheFile, 'r')
			data = f.read()
			f.close()
		return data


