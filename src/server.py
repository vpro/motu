from flask import Flask
from flask import make_response, render_template, abort
from flask import request, Response, send_from_directory

from jinja2.exceptions import TemplateNotFound

from functools import wraps

from components.SearchEngine import SearchEngine
from components.DataLoader import DataLoader

import simplejson
import os


def score_to_fontsize(size):
	if size > 40:
		size = 40 + ((size - 40) / 3)
		if size > 50:
			return 50
		return size
	elif size < 12 and size > 6:
		return 12 + (size / 2)
	elif size <= 6:
		return 12 + size
	return size

app = Flask(__name__)
app.jinja_env.globals.update(score_to_fontsize=score_to_fontsize)
app.debug = True

import settings

_config = settings.config
_config['APP_ROOT'] = app.root_path
_searchEngine = SearchEngine(_config)
_dataLoader = DataLoader(_config)

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
AUTHENTICATION
------------------------------------------------------------------------------"""

def check_auth(username, password):
	return username == 'admin' and password == '1234__it-will-spin'

def authenticate():
	return Response(
	'Could not verify your access level for that URL.\n'
	'You have to login with proper credentials', 401,
	{'WWW-Authenticate': 'Basic realm="Login Required"'})

def isLoggedIn(request):
	if request.authorization:
		return True
	return False

def requires_auth(f):
	@wraps(f)
	def decorated(*args, **kwargs):
		auth = request.authorization
		if not auth or not check_auth(auth.username, auth.password):
			return authenticate()
		return f(*args, **kwargs)
	return decorated

def add_response_headers(headers={}):
	"""This decorator adds the headers passed in to the response"""
	def decorator(f):
		@wraps(f)
		def decorated_function(*args, **kwargs):
			resp = make_response(f(*args, **kwargs))
			h = resp.headers
			for header, value in headers.items():
				h[header] = value
			return resp
		return decorated_function
	return decorator

def nocache(f):
	"""This decorator passes X-Robots-Tag: noindex"""
	@wraps(f)
	@add_response_headers({
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma' : 'no-cache',
		'Expires' : '0'
	})
	def decorated_function(*args, **kwargs):
		return f(*args, **kwargs)
	return decorated_function

"""------------------------------------------------------------------------------
STATIC PAGES THAT DO NOT USE THE COMPONENT LIBRARY
------------------------------------------------------------------------------"""

@app.route('/')
@nocache
def home():
	randomVideo = _dataLoader.loadRandomVideo()
	introText = _dataLoader.loadMarkdownFile('introtext.md')
	scientists = _dataLoader.loadScientists()
	tagCloud = _dataLoader.loadKeywordTagCloud()
	return render_template('index.html',
		randomVideo=randomVideo,
		introText=introText,
		scientists=scientists,
		tagCloud=tagCloud
	)

@app.route('/about')
@nocache
def about():
	return render_template('about.html',
		about=_dataLoader.loadMarkdownFile('about.md'),
		faq=_dataLoader.loadMarkdownFile('faq.md'),
		colofon=_dataLoader.loadMarkdownFile('colofon.md')
	)

@app.route('/scientist')
@nocache
def scientist():
	sid = request.args.get('id', None)
	if sid:
		scientist = _dataLoader.loadScientist(sid)
		if scientist:
			return render_template('scientist.html', scientist=scientist)
	return render_template('404.html'), 404

@app.route('/search')
@nocache
def search():
	searchTerm = request.args.get('st', None)
	sf = request.args.get('sf', None)
	fr = request.args.get('fr', 0)
	size = request.args.get('sz', 10)
	facets = {}
	if sf:
		tmp = sf.split(',')
		for f in tmp:
			facets[f] = True
	params = {
		'term' : searchTerm,
		'facets' : facets,
		'from' : fr,
		'size' : size
	}
	return render_template('search.html',
		searchParams=params
	)

@app.route('/play')
@requires_auth
@nocache
def play():
	iid = request.args.get('id', None)
	searchTerm = request.args.get('st', None)
	s = request.args.get('s', -1)
	e = request.args.get('e', -1)
	if iid:
		scientist = _dataLoader.loadInterview(iid)
	return render_template('play.html',
		scientist=scientist,
		start=s,
		end=e
	)

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
