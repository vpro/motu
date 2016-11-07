from flask import Flask
from flask import render_template, abort
from flask import request, Response, send_from_directory

from jinja2.exceptions import TemplateNotFound

from functools import wraps

from components.SearchEngine import SearchEngine

import simplejson
import os

app = Flask(__name__)
app.debug = True

import settings

_config = settings.config
_searchEngine = SearchEngine(_config)

"""
Think about using this to load the pages faster:
	https://react-server.io/docs/guides/writing-pages
	http://stackoverflow.com/questions/34408059/rendering-react-on-server
"""

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
	s = request.args.get('s', -1)
	e = request.args.get('e', -1)
	if rid and cid:
		metadata = _searchEngine.getResource(rid, cid)
	return render_template('play.html',
		metadata=metadata,
		start=s,
		end=e
	)

@app.route('/search')
def search():
	return render_template('search.html')

@app.route('/robots.txt')
@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])

@app.route('/s', methods=['post'])
def s():
	params = request.get_json(force=True)
	resp = _searchEngine.fragmentSearch(params)
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
