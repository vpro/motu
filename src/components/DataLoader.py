# -*- coding:utf-8 -*-
import requests
import random
import json
import os
import codecs
from random import shuffle
from itertools import groupby
from collections import namedtuple
import operator
from markdown import markdown
import wikipedia
from TimeUtil import TimeUtil
from requests.exceptions import ConnectionError

#NOTE: the term extraction service is not up and running!

class DataLoader():

	def __init__(self, config):
		self.config = config

		#load all the stopwords
		self.stopWords = []
		f = open('%s/stopwords-en.txt' % config['TEXTUAL_CONTENT_DIR'], 'r')
		for line in f:
			self.stopWords.append(line.replace('\n', ''))

		self.TERM_EXTRACTION_API = 'http://termextract.fivefilters.org/extract.php'
		self.TERM_CLOUD_LIMIT = 50
		self.WIKI_MAPPING = {
			'Artur_Avila' : (None, None),#TODO
			'Carolina_Cruz' : (None, None),
			'Charles_Spence' : ('Charles_Spence', 'Charles_Spence'),
			'Donald_Hoffman' : (None, None),
			'Erik_Demaine' : ('Erik_Demaine', 'Erik_Demaine'),
			'George_Church' : ('George_M_Church', 'George_M._Church'),
			'George_Whitesides' : (None, None),#TODO
			'Guy_Consolmagno' : ('Guy_Consolmagno', 'Guy_Consolmagno'),
			'Hani_Hayajneh' : (None, None),#TODO
			'Hans_Clevers' : ('Hans_Clevers', 'Hans_Clevers'),
			'Jean-Jacques_Hublin' : ('Jean_Jacques_Hublin', 'Jean_Jacques_Hublin'),
			'Jennifer_Chayes' : (None, None),#TODO
			'Jian-Wei_Pan' : ('Pan_Jianwei', 'Pan_Jianwei'),
			'Joanna_Aizenberg' : ('Joanna_Aizenberg', 'Joanna_Aizenberg'),
			'John_List' : (None, None),#TODO
			'Juan_Maldacena' : ('Juan_Mart%C3%ADn_Maldacena', 'Juan_Mart%C3%ADn_Maldacena'),
			'Lee_Cronin' : ('Leroy_Cronin', 'Leroy_Cronin'),
			'Martin_Rees' : (None, None),#TODO
			'Michel_Poulin' : (None, None),
			'Miguel_Nicolelis' : ('Miguel_Nicolelis', 'Miguel_Nicolelis'),
			'Nicky_Clayton' : ('Nicola_Clayton', 'Nicola_Clayton'),
			'Pascale_Fung' : (None, None),#TODO
			'Rick_Tumlinson' : (None, None),#TODO
			'Ron_Fouchier' : (None, None),
			'Sara_Seager' : ('Sara_Seager', 'Sara_Seager'),
			'Segenet_Kelemu' : ('Segenet_Kelemu', 'Segenet_Kelemu'),
			'Susant_Patnaik' : (None, None),
			'Trond_Helge_Torsvik' : ('Trond_Helge_Torsvik', 'Trond_Helge_Torsvik'),
			'Yoshua_Bengio' : ('Yoshua_Bengio', 'Yoshua_Bengio'),
			'Yuri_Oganessian' : ('Yuri_Oganessian', 'Yuri_Oganessian')
		}

	"""-----------------------------------------------------------------------------------
	----------------------------------- BASIC / HELPERS ----------------------------------
	-----------------------------------------------------------------------------------"""

	def __getPosterURL(self, scientistId):
		fn = '%s/static/images/scientists/%s.jpg' % (self.config['APP_ROOT'], scientistId)
		if os.path.exists(fn):
			return '/static/images/scientists/%s.jpg' % scientistId
		return '/static/images/scientist.gif'

	def loadMarkdownFile(self, fn, formatHTML = True):
		mdFile = '%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], fn)
		if os.path.exists(mdFile):
			f = open(mdFile, 'r')
			text = f.read()
			f.close()
			try:
				if formatHTML:
					return markdown(text)
				else:
					return text
			except UnicodeDecodeError, e:
				print e
		return ''

	#shown on the home page
	#TODO not all videos exist, make sure they do (e.g. Segenet_Kelemu.mp4 does not exist)
	def loadRandomVideo(self):
		r = random.choice(self.WIKI_MAPPING.keys())
		randomVideo = 'http://rdbg.tuxic.nl/mindoftheuniverse/%s/mp4/%s.mp4' % (r, r)
		return randomVideo

	"""-----------------------------------------------------------------------------------
	----------------------------------- SITEMAP ------------------------------------------
	-----------------------------------------------------------------------------------"""

	def generateSiteMap(self, rootUrl, sitemapFile):
		xml = None
		if os.path.exists(sitemapFile):
			#just read the generated file from disk
			f = open(sitemapFile, 'r')
			xml = f.read()
			f.close()
		else:
			#generate the sitemap.xml based on the person and interview pages
			f = open(sitemapFile, 'w+')
			l = ['<?xml version="1.0" encoding="UTF-8"?>']
			l.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
			l.extend(self.__addSiteMapURL('%sabout' % rootUrl))
			for root, dirs, files in os.walk('%s/bios' % self.config['TEXTUAL_CONTENT_DIR']):
				for fn in files:
					scientistId = fn[0:fn.rfind('.md')]
					#add URL to scientist page
					l.extend(self.__addSiteMapURL('%sscientist?id=%s' % (rootUrl, scientistId)))

					#then add URLs for each interview of this scientist
					scientist = self.loadScientist(scientistId)
					for i in scientist['interviews']:
						l.extend(self.__addSiteMapURL('%splay?id=%s' % (rootUrl, i['id'])))
			l.append('</urlset>')
			xml = ''.join(l)

			#write the xml to file
			f.write(xml)
			f.close()
		return xml

	def __addSiteMapURL(self, url):
		return ['<url><loc>%s</loc></url>' % url]

	"""-----------------------------------------------------------------------------------
	----------------------------------- EXPLORE PAGE -------------------------------------
	-----------------------------------------------------------------------------------"""

		#used on the explore page
	def loadExplorePage(self):
		tagCloud = {}
		scientists = []

		cachedData = self.__readFromCache('explore-page', 'termcloud-cache')
		if cachedData:
			cache = json.loads(cachedData)
			tagCloud = cache['tagCloud']
			scientists = cache['scientists']
		else:
			scientists = self.loadScientists()
			#generate the overall tag cloud
			for s in scientists:
				s.pop('bio')
				#s.pop('shortBio')
				interviewTags = {}
				interviews = self.__getInterviewsOfScientist(s['id'])
				for i in interviews:
					for cl in i['annotations']['classifications']:
						#first add to the overall tag cloud
						if cl['label'] in tagCloud:
							tagCloud[cl['label']] += 1
						else:
							tagCloud[cl['label']] = 1

						#then to the scientist tag cloud
						if cl['label'] in interviewTags:
							interviewTags[cl['label']] += 1
						else:
							interviewTags[cl['label']] = 1

				s['interviewTags'] = interviewTags
			self.__writeToCache('explore-page', 'termcloud-cache', json.dumps({
				'tagCloud' : tagCloud,
				'scientists' : scientists
			}))

		#sorting and pruning of the tag cloud
		sortedTags = sorted(tagCloud.iteritems(), key=operator.itemgetter(1), reverse=True)
		if len(sortedTags) > self.TERM_CLOUD_LIMIT:
			sortedTags = sortedTags[0:self.TERM_CLOUD_LIMIT]
		shuffle(sortedTags)
		return scientists, sortedTags

	"""-----------------------------------------------------------------------------------
	----------------------------------- SCIENTISTS ---------------------------------------
	-----------------------------------------------------------------------------------"""

	#shown on the home page: loads the list of scientists by scanning the markdown files available in /bios
	def loadScientists(self):
		scientists = []
		for root, dirs, files in os.walk('%s/bios' % self.config['TEXTUAL_CONTENT_DIR']):
			for fn in files:
				scientistId = fn[0:fn.rfind('.md')]
				scientists.append({
					'id' : scientistId,
					'name' : scientistId.replace('_', ' '),
					'bio' : self.__loadWikipediaBio(scientistId),
					'shortBio' : self.loadMarkdownFile('bios/%s.md' % scientistId),
					'poster' : self.__getPosterURL(scientistId)
				})
		#sort by last name
		scientists.sort(key = lambda x: x['name'][x['name'].rfind(' ')+1:])
		return scientists

	#called from the person page
	def loadScientist(self, scientistId):
		scientist = {
			'id' : scientistId,
			'name' : scientistId.replace('_', ' ')
		}
		interviews = self.__getInterviewsOfScientist(scientistId)

		#add up all of the links and tags (on the video level) for quick access
		links = []
		interviewTags = []
		for i in interviews:
			for l in i['annotations']['links']:
				links.append(l)
			for cl in i['annotations']['classifications']:
				interviewTags.append(cl['label'])
		if len(interviewTags) > 10:
			interviewTags = interviewTags[0:9]

		scientist['bio'] = self.__loadWikipediaBio(scientistId)
		scientist['wikiURL'] = self.__getWikipediaUrl(scientistId)
		scientist['poster'] = self.__getPosterURL(scientistId)
		scientist['interviews'] = interviews
		scientist['termCloud'] = self.__loadTermCloud(scientistId)
		scientist['links'] = links
		scientist['interviewTags'] = interviewTags
		return scientist

	"""-----------------------------------------------------------------------------------
	----------------------------------- INTERVIEWS ---------------------------------------
	-----------------------------------------------------------------------------------"""

	#used for the play-out page
	def loadInterview(self, interviewId):
		print 'loading the %s for play-out' % interviewId
		url = '%s/document/get_doc/motu/%s' % (self.config['SEARCH_API'], interviewId)
		resp = requests.get(url)
		if resp.status_code == 200:
			return self.__formatInterview(json.loads(resp.text))
		return None

	#used on the scientist page
	def __getInterviewsOfScientist(self, scientistId):
		print 'getting the interviews of %s' % scientistId
		interviews = []
		query = {
			"query":{
				"bool":{
					"must":[{"term":{"name": scientistId.replace('_', ' ')}}],
					"must_not":[],
					"should":[]}
				}, "from":0,"size":10,"sort":[],"aggs":{}
		}
		url = '%s/search/motu' % self.config['SEARCH_API']
		resp = requests.post(url, data=json.dumps(query))
		if resp and resp.status_code == 200:
			result = json.loads(resp.text)
			for hit in result['hits']['hits']:
				interview = self.__formatInterview(hit, False, False)
				if interview:
					interviews.append(interview)
		return interviews

	def __formatInterview(self, data, includeTranscript=True, includeSegmentAnnotations=True):
		interviewId = scientistId = data['_id']
		transcript = None
		if interviewId.find('__') != -1:
			scientistId = interviewId[0:interviewId.rfind('__')]
		if includeTranscript:
			transcript = self.__loadTranscript(scientistId, interviewId)
		interview = {
			'id' : interviewId,
			'name' : data['_source']['name'],
			'title' : '',
			'description' : '',
			'date' : None,
			'poster' : data['_source']['posterURL'],
			'video' : data['_source']['playableContent'][0], #there is always one
			'transcript' : transcript,
			'annotations' : self.__loadInterviewAnnotations(scientistId, interviewId, includeSegmentAnnotations)
		}

		#add the basic metadata
		if 'title_raw' in data['_source']:
			interview['title'] = data['_source']['title_raw']
		if 'description' in data['_source']:
			interview['description'] = data['_source']['description']
		if 'date' in data['_source']:
			interview['date'] = data['_source']['date']

		#add the interview tags
		interviewTags = []
		for cl in interview['annotations']['classifications']:
			interviewTags.append(cl['label'])
		interview['interviewTags'] = interviewTags

		return interview

	def __loadInterviewAnnotations(self, scientistId, interviewId, includeSegmentAnnotations):
		links = []
		classifications = []
		segments = []
		keyMoments = []
		targetUrl = '%s/%s/mp4/%s.mp4' % (self.config['BASE_MEDIA_URL'], scientistId, interviewId)
		url = '%s/annotations/filter?target.source=%s&user=motu' % (
			self.config['ANNOTATION_API'],
			targetUrl
		)
		resp = requests.get(url)
		if resp.status_code == 200:
			data = json.loads(resp.text)
			if data and 'annotations' in data:
				number = 1
				for a in data['annotations']:
					if 'body' in a and a['body']:
						#these are the media object annotations
						if not ('selector' in a['target'] and a['target']['selector']):
							for annotation in a['body']:
								if annotation['annotationType'] == 'link':
									links.append(annotation)
								elif annotation['annotationType'] == 'classification':
									classifications.append(annotation)
						elif includeSegmentAnnotations:#these are the segment annotations
							for annotation in a['body']:
								segmentTitle = None
								keyMoment = None
								start = -1
								if annotation['annotationType'] == 'metadata' and 'properties' in annotation:
									for prop in annotation['properties']:
										if prop['key'] == 'key moments' and prop['value'] and prop['value'] != '':
											keyMoment = prop['value']
										elif prop['key'] == 'title':
											segmentTitle = prop['value']
									if segmentTitle:
										posterStart = int(a['target']['selector']['start']) #in secs
										videoStart = posterStart * 1000 #in ms
										if posterStart == 0:
											posterStart = 1
										segments.append({
											'title' : segmentTitle,
											'number' : number,
											'keyMoment' : keyMoment,
											'start' : videoStart,
											'end' : a['target']['selector']['end'] * 1000,
											'prettyStart' : TimeUtil.millisToPrettyTime(videoStart),
											'poster' : '%s/%s/thumbnails/%s/%s_%04d.jpg' % (
												self.config['BASE_MEDIA_URL'],
												scientistId,
												scientistId,
												scientistId,
												posterStart
											)
										})
										#add the keymoment to the list of keymoments
										if keyMoment:
											keyMoments.append({
												'title' : segmentTitle,
												'category' : keyMoment
											})
										number += 1
		return {
			'links' : links,
			'classifications' : classifications,
			'segments' : segments,
			'keyMoments' : keyMoments
		}

	"""-----------------------------------------------------------------------------------
	----------------------------------- TRANSCRIPTS --------------------------------------
	-----------------------------------------------------------------------------------"""

	def __loadTranscript(self, scientistId, interviewId):
		srtFile = '%s/transcripts/%s/%s.srt' % (
			self.config['TEXTUAL_CONTENT_DIR'],
			scientistId,
			interviewId
		)
		if os.path.exists(srtFile):
			return self.__parseSRT(srtFile)
		return None

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
						TimeUtil.SRTTimetoMillis(start),
						TimeUtil.SRTTimetoMillis(end),
						content,
						TimeUtil.SRTTimetoPrettyTime(start)
					))
		return subs

	"""-----------------------------------------------------------------------------------
	----------------------------------- TAG/KEYWORD CLOUDS -------------------------------
	-----------------------------------------------------------------------------------"""

	#load the terms from the annotation tags (for the home page)
	#TODO when the annotations are all done, simply cache it
	def loadKeywordTagCloud(self):
		tagCloud = {}
		url = '%s/annotations/filter?user=motu' % (self.config['ANNOTATION_API'])
		resp = requests.get(url)
		if resp.status_code == 200:
			data = json.loads(resp.text)
			if data and 'annotations' in data:
				for a in data['annotations']:
					if 'body' in a and a['body']:
						for annotation in a['body']:
							if annotation['annotationType'] == 'classification':
								if annotation['label'] in tagCloud:
									tagCloud[annotation['label']] += 1
								else:
									tagCloud[annotation['label']] = 1
		sortedTags = sorted(tagCloud.iteritems(), key=operator.itemgetter(1), reverse=True)
		if len(sortedTags) > self.TERM_CLOUD_LIMIT:
			sortedTags = sortedTags[0:self.TERM_CLOUD_LIMIT]
		shuffle(sortedTags)
		return sortedTags

	#load the term cloud from the transcript related to the main interview (for the person page)
	def __loadTermCloud(self, scientistId):
		cachedData = self.__readFromCache(scientistId, 'termcloud-cache')
		if cachedData:
			return json.loads(cachedData)

		#otherwise run the transcript through the term extractor and get the term cloud
		transcript = None
		subs = self.__loadTranscript(scientistId, scientistId)#always load the main interview file
		if subs:
			transcript = ''
			for s in subs:
				transcript += ' %s' % s.content
		if transcript:
			url = self.TERM_EXTRACTION_API
			params = {
				'text_or_url': transcript,
				'output' : 'json'
			}
			resp = None

			try:
				resp = requests.post(url, data=params)
			except ConnectionError, e:
				print e

			if resp and resp.status_code == 200:
				tc = self.__filterStopWords(json.loads('{ "terms" : %s}' % resp.text))
				self.__writeToCache(scientistId, 'termcloud-cache', json.dumps(tc))
				return tc
		return None

	def __filterStopWords(self, terms):
		filteredTerms = []
		for t in terms['terms']:
			if t[0] in self.stopWords:
				continue
			filteredTerms.append(t)
		return {'terms' : filteredTerms}

	"""-----------------------------------------------------------------------------------
	----------------------------------- CACHING ------------------------------------------
	-----------------------------------------------------------------------------------"""

	#cacheType = wikipedia-cache OR termcloud-cache
	def __writeToCache(self, cacheId, cacheType, data):
		cacheFile = '%s/%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], cacheType, cacheId)
		f = codecs.open(cacheFile, 'w+', 'utf-8')
		try:
			f.write(data)
		except UnicodeEncodeError, e:
			print e
		f.close()

	def __readFromCache(self, cacheId, cacheType):
		data = None
		cacheFile = '%s/%s/%s' % (self.config['TEXTUAL_CONTENT_DIR'], cacheType, cacheId)
		if os.path.exists(cacheFile):
			f = codecs.open(cacheFile, 'r', 'utf-8')
			data = f.read()
			f.close()
		return data

	"""-----------------------------------------------------------------------------------
	----------------------------------- WIKIPEDIA ----------------------------------------
	-----------------------------------------------------------------------------------"""

	def __getWikipediaUrl(self, scientistId):
		if scientistId in self.WIKI_MAPPING:
			if self.WIKI_MAPPING[scientistId][1]:
				return 'http://wikipedia.org/wiki/%s' % self.WIKI_MAPPING[scientistId][1]
		return 'javascript:void(0)'

	def __loadWikipediaBio(self, scientistId):
		bio = 'No Wikipedia article available'
		wikiId = None
		#fetch the wikipedia ID from the mapping
		try:
			wikiId = self.WIKI_MAPPING[scientistId][0]
		except KeyError, e:
			print 'incorrect wiki mapping'
			return bio

		#if there is no proper wikipedia ID return nothing
		if wikiId == None:
			return bio

		#try to fetch it from the cache
		cachedData = self.__readFromCache(scientistId, 'wikipedia-cache')
		if cachedData:
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

	"""-----------------------------------------------------------------------------------
	----------------------------------- SOCIAL MEDIA / SEO METADATA ----------------------
	-----------------------------------------------------------------------------------"""

	#returs an object containing tags for Open Graph and Twitter Cards
	def getSocialMetaTags(self, url, rootUrl, data, dataType):
		tags = {}
		tags['keywords'] = 'interviews, scientists, science, open source content'
		tags['ogtype'] = 'website'
		tags['twittertype'] = 'summary'
		tags['pageUrl'] = url

		#defaults in case there is no config or data
		tags['title'] = 'Mind of the Universe'
		tags['description'] = 'Mind of the Universe'
		tags['image'] = 'http://motu.rdlabs.beeldengeluid.nl/static/images/og-image.png'
		if dataType:
			if dataType == 'interview':
				tags['ogtype'] = 'video.movie'
				tags['keywords'] = ','.join(data['interviewTags'])
				tags['title'] = data['title']
				tags['description'] = data['description']
				tags['image'] = data['poster']
				tags['pageUrl'] = '%splay?id=%s' % (rootUrl, data['id'])
				tags['videoUrl'] = data['video']['url']
			elif dataType == 'scientist':
				tags['keywords'] = ','.join(data['interviewTags'])
				tags['title'] = data['name']
				tags['image'] = data['poster']
				tags['description'] = self.loadMarkdownFile('bios/%s.md' % data['id'], False)
				tags['pageUrl'] = '%sscientist?id=%s' % (rootUrl, data['id'])
		else:
			if 'SOCIAL_MEDIA_DATA' in self.config:
				if 'TITLE' in self.config['SOCIAL_MEDIA_DATA']:
					tags['title'] = self.config['SOCIAL_MEDIA_DATA']['TITLE']
				if 'IMAGE' in self.config['SOCIAL_MEDIA_DATA']:
					tags['image'] = self.config['SOCIAL_MEDIA_DATA']['IMAGE']
				if 'DESCRIPTION' in self.config['SOCIAL_MEDIA_DATA']:
					tags['description'] = self.config['SOCIAL_MEDIA_DATA']['DESCRIPTION']
		return tags
