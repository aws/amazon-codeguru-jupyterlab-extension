def __CELL_EDGE__(x):
	pass
__CELL_EDGE__(2)
app.run(debug=True, host='127.0.1.1', port=5000, extra_files='csp.txt')

app = Flask('vulpy')
app.config['SECRET_KEY'] = 'aaaaaaa'


@app.route('/')
def do_home():
    return redirect('/posts')

@app.before_request
def before_request():
    g.session = libsession.load(request)

app.run(debug=True, host='127.0.1.1', ssl_context=('/tmp/acme.cert', '/tmp/acme.key'))
print('hello')
__CELL_EDGE__(0)
import json
import base64

from pathlib import Path

from flask import Flask, g, redirect, request

import libsession


def create(response, username):
    session = base64.b64encode(json.dumps({'username': username}).encode())
    response.set_cookie('vulpy_session', session)
    return response


def load(request):

    session = {}
    cookie = request.cookies.get('vulpy_session')

    try:
        if cookie:
            decoded = base64.b64decode(cookie.encode())
            if decoded:
                session = json.loads(base64.b64decode(cookie))
    except Exception:
        pass

    return session


def destroy(response):
    response.set_cookie('vulpy_session', '', expires=0)
    return response
__CELL_EDGE__(1)
app = Flask('vulpy')
app.config['SECRET_KEY'] = 'aaaaaaa'

csp_file = Path('csp.txt')
csp = ''

if csp_file.is_file():
    with csp_file.open() as f:
        for line in f.readlines():
            if line.startswith('#'):
                continue
            line = line.replace('\n', '')
            if line:
                csp += line
if csp:
    print('CSP:', csp)


@app.route('/')
def do_home():
    return redirect('/posts')

@app.before_request
def before_request():
    g.session = libsession.load(request)

@app.after_request
def add_csp_headers(response):
    if csp:
        response.headers['Content-Security-Policy'] = csp
    return response
__CELL_EDGE__(3)

