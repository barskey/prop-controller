from app import app
from flask import render_template, request, jsonify

#Dummy data for testing
triggers = [
    {'triggerid': '1', 'triggername': 'Motion'},
    {'triggerid': '2', 'triggername': 'Pushbutton'},
    {'triggerid': '3', 'triggername': 'Switch'},
    {'triggerid': '4', 'triggername': 'Event'}
]
actions = [
    {'actionid': '1', 'actionname': 'Turn On'},
    {'actionid': '2', 'actionname': 'Turn Off'},
    {'actionid': '3', 'actionname': 'Toggle'},
    {'actionid': '4', 'actionname': 'Blink'},
    {'actionid': '5', 'actionname': 'Play Sound'}
]
sounds = [
    {'soundid': '1', 'soundname': 'Scream'},
    {'soundid': '2', 'soundname': 'Zombie'},
    {'soundid': '3', 'soundname': 'Evil Laugh'},
    {'soundid': '4', 'soundname': 'Ghost'}
]
events = [
    {'eventid': '1', 'eventname': 'Driveway Motion', 'triggers':[
        {'triggerid': '1', 'triggername': 'Motion', 'triggerparam': '30000', 'tiptitle':'Reset after: 30000ms<br />(click to edit)'}
    ], 'actions':[
        {'actionid': '1', 'actionparam': '1000'},
        {'actionid': '2', 'actionparam': '3000'}
    ]},
    {'eventid': '2', 'eventname': 'Sidewalk Motion', 'triggers':[
        {'triggerid': '1', 'triggername': 'Motion', 'triggerparam': '10000', 'tiptitle':'Reset after: 10000ms<br />(click to edit)'}
    ], 'actions':[
        {'actionid': '4', 'actionparam': '2000'}
    ]}
]

@app.route('/')
@app.route('/dashboard')
def dashboard():
    projectname = "Halloween 2016"
    return render_template('dashboard.html', title='Dashboard', projectname=projectname, triggers=triggers, actions=actions, sounds=sounds, events=events)

@app.route('/add_trigger_to_event', methods=['POST'])
def add_trigger_to_event():
    param = ""
    tiptitle = ""
    a, eventid = request.form['triggerEventnameSelect'].split("-")
    triggerid = request.form['triggerType']
    triggername = ""
    for t in triggers:
        if t['triggerid'] == triggerid:
            triggername = t['triggername']
    if triggerid == '1':
        param = request.form['resetTime']
        tiptitle = "Reset after: " + param + "ms<br />(click to edit)"
    elif triggerid == '2':
        param = request.form['defaultState']
    elif triggerid == '3':
        tiptitle = "No parameters to config"
        tiptitle = "Default state: " + param + "<br />(click to edit)"
    elif triggerid == '4':
        param = request.form['eventTrigger']
        tiptitle = "Using event: " + param + "<br />(click to edit)"
    #Add to sql db and commit, return new list of actions
    for e in events:
        if e['eventid'] == eventid:
            e['triggers'].append({'triggerid': triggerid, 'triggername': triggername, 'triggerparam': param, 'tiptitle': tiptitle})
            return jsonify(triggers = e['triggers'])

@app.route('/testpost', methods=['POST'])
def testpost():
	items = request.form
	return render_template('testpost.html', items=items)
