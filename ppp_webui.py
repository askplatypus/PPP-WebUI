import os
import json
import flask

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')

with open(CONFIG_FILE) as fd:
    config = json.load(fd)

app = flask.Flask(__name__)

@app.route('/favicon.ico')
def favicon():
    return flask.redirect(flask.url_for('static', filename='favicon.ico'))


@app.route('/')
def index():
    return flask.render_template('index.html', config=config)

if __name__ == '__main__':
    app.run(debug=True)
