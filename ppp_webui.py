import os
import json
import uuid
import collections

import pyld
import flask
import requests
import ppp_datamodel

import ui_helpers



CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')

with open(CONFIG_FILE) as fd:
    config = json.load(fd)

app = flask.Flask(__name__)
app.jinja_env.globals.update(config=config)
app.jinja_env.globals.update(ui_helpers=ui_helpers)
app.jinja_env.globals.update(SO='http://schema.org/')

@app.route('/favicon.ico')
def favicon():
    return flask.redirect(flask.url_for('static', filename='favicon.ico'))


@app.route('/')
def index():
    return flask.render_template('index.html')

def query_api(q, lang):
    r = ppp_datamodel.Request(id='webui-%s' % uuid.uuid4().hex,
            language=lang,
            tree=ppp_datamodel.Sentence(value=q))
    responses = requests.post(config['pppCoreUrl'],
            data=r.as_json()).json()
    return map(ppp_datamodel.Response.from_dict, responses)

RichResponse = collections.namedtuple('RichResponse',
        'title description image actions tree graph language response '
        'view_actions')
def enrich_response(response):
    if isinstance(response.tree, ppp_datamodel.nodes.Resource):
        title = response.tree.value
        graph = pyld.jsonld.expand(response.tree.graph)[0]
        actions = graph.get('http://schema.org/potentialAction', [])
        view_actions = [action for action in actions
                if any(ui_helpers.schema_dot_org.is_superclass(
                    'http://schema.org/ViewAction', type_)
                    for type_ in action['@type'])]
        image = graph.get('http://schema.org/image', [])
        print(image)
    else:
        title = response.tree
        graph = None
        actions = None
        view_actions = []
        image = None
    return RichResponse(
            title=title,
            description=None, # TODO
            image=image,
            actions=actions,
            tree=response.tree,
            graph=graph,
            view_actions=view_actions,
            language=response.language,
            response=response,
            )

@app.route('/results_only/')
def results_only():
    q = flask.request.args.get('q', None)
    lang = flask.request.args.get('lang', 'en')
    if not q:
        flask.abort(400, 'Empty request not acceptable.')
    responses = query_api(q, lang)
    rich_responses = map(enrich_response, responses)
    return flask.render_template('results.html', rich_responses=rich_responses)


if __name__ == '__main__':
    app.run(debug=True)
