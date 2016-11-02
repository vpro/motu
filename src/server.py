from flask import Flask
from flask import render_template, abort
from flask import request, Response, send_from_directory

from jinja2.exceptions import TemplateNotFound

from functools import wraps

from components.openskos.OpenSKOS import OpenSKOS
from components.dbpedia.DBpedia import DBpedia
from components.wikidata.WikiData import WikiData
from components.europeana.Europeana import Europeana

from components.SearchEngine import SearchEngine

import simplejson
import os

app = Flask(__name__)
app.debug = True

import settings

_config = settings.config
_searchEngine = SearchEngine({})

"""------------------------------------------------------------------------------
GLOBAL FUNCTIONS
------------------------------------------------------------------------------"""

def getErrorMessage(msg):
	return simplejson.dumps({'error' : msg})

def getSuccessMessage(msg, data):
	return simplejson.dumps({'success' : msg, 'data' : data})

"""------------------------------------------------------------------------------
STATIC PAGES THAT DO NOT USE THE COMPONENT LIBRARY
------------------------------------------------------------------------------"""

@app.route('/')
def home():
	return render_template('index.html')

@app.route('/about')
def about():
	return render_template('about.html')

@app.route('/scientist')
def scientist():
	return render_template('scientist.html')

@app.route('/play')
def play():
	rid = request.args.get('id', None)
	cid = request.args.get('cid', None)
	if rid and cid:
		metadata = _searchEngine.getResource(rid, cid)
	return render_template('play.html', metadata=metadata)

@app.route('/search')
def search():
	return render_template('search.html')

@app.route('/robots.txt')
@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

"""------------------------------------------------------------------------------
TEMPORARY VOCABULARY 'API'
------------------------------------------------------------------------------"""

@app.route('/autocomplete')
def autocomplete():
	term = request.args.get('term', None)
	vocab = request.args.get('vocab', 'DBpedia')
	conceptScheme = request.args.get('cs', None) #only for GTAA (not used yet!!)
	if term:
		options = None
		if vocab == 'GTAA':
			handler = OpenSKOS()
			options = handler.autoCompleteTable(term.lower(), conceptScheme)
		elif vocab == 'DBpedia':
			dac = DBpedia()
			options = dac.autoComplete(term)#dbpedia lookup seems down...
		if options:
			return Response(simplejson.dumps(options), mimetype='application/json')
		else:
			return Response(getErrorMessage('Nothing found'), mimetype='application/json')
	return Response(getErrorMessage('Please specify a search term'), mimetype='application/json')

@app.route('/link/<api>/<command>')
def link(api, command):
	resp = None
	apiHandler = None
	params = request.args
	if api == 'wikidata':
		apiHandler = WikiData()
		if command == 'get_entity':
			params = {
				'ids' : [request.args.get('id')],
				'get_references' : True,
				'props' : ("labels", "descriptions", "sitelinks"),
				'languages' : ['nl']
			}
	elif api == 'europeana':
		apiHandler = Europeana()
	if apiHandler:
		resp = resp = getattr(apiHandler, "%s" % command)(params)
	if resp:
		return Response(simplejson.dumps(resp), mimetype='application/json')
	return Response(getErrorMessage('Nothing found'), mimetype='application/json')

@app.route('/s', methods=['post'])
def s():
	params = request.get_json(force=True)
	resp = _searchEngine.fragmentSearch(
		'motu',
		params['term'],
		{'motu' : True, 'motu__srt' : True, 'motu__topics' : True},
		params['selectedFacets'],
		params['offset'],
		params['size'],
		0, #inner offset
		3 #inner size
	)
	if resp:
		return Response(simplejson.dumps(resp), mimetype='application/json')
	return Response(getErrorMessage('Nothing found'), mimetype='application/json')


"""------------------------------------------------------------------------------
ERROR HANDLERS
------------------------------------------------------------------------------"""

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def page_not_found(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
	app.run(port=_config['APP_PORT'], host=_config['APP_HOST'])
