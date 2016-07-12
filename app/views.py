from app import app, db
from flask import render_template, request, jsonify, json
from .models import Controller

#Dummy data for testing
projectname = "Halloween 2016"
projectid = 1
colors = [
	{'colorid': '5', 'colorname': 'red', 'colorhex': '#DD5F32'},
	{'colorid': '6', 'colorname': 'orange', 'colorhex': '#FFA200'},
	{'colorid': '9', 'colorname': 'yellow', 'colorhex': '#e6e600'},
	{'colorid': '7', 'colorname': 'green', 'colorhex': '#00A03E'},
	{'colorid': '1', 'colorname': 'blue', 'colorhex': '#4298B5'},
	{'colorid': '4', 'colorname': 'purple', 'colorhex': '#9900ff'},
	{'colorid': '3', 'colorname': 'olive', 'colorhex': '#92B06A'},
	{'colorid': '8', 'colorname': 'teal', 'colorhex': '#24A8AC'},
	{'colorid': '2', 'colorname': 'black', 'colorhex': '#273a3f'},
	{'colorid': '10', 'colorname': 'salmon', 'colorhex': '#fa8072'}
]
triggertypes = [
	{'triggerid': '1', 'triggername': 'Motion'},
	{'triggerid': '2', 'triggername': 'Pushbutton'},
	{'triggerid': '3', 'triggername': 'Switch'},
	{'triggerid': '5', 'triggername': 'Interval'},
	{'triggerid': '6', 'triggername': 'Random'}
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
	{'eventid': '1', 'eventname': 'Driveway Motion', 'triggers': [
		{'triggerid': '1', 'triggername': 'Motion', 'triggerparam': '30000', 'tiptitle':'Reset after: 30000ms<br />(click to edit)'}
	], 'actions': [
		{'actionid': '1', 'actionparam': '1000'},
		{'actionid': '2', 'actionparam': '3000'}
	]},
	{'eventid': '2', 'eventname': 'Sidewalk Motion', 'triggers':[
		{'triggerid': '1', 'triggername': 'Motion', 'triggerparam': '10000', 'tiptitle':'Reset after: 10000ms<br />(click to edit)'}
	], 'actions':[
		{'actionid': '4', 'actionparam': '2000'}
	]}
]
cntrlrs = [
	{'controllerid': '1', 'controllername': 'Controller 1', 'controllercolor': '5', 'input1': 'ACTIVE', 'input1trigger': '1', 'input2': 'DISABLED', 'input2trigger': '', 'outputa': 'ON', 'outputaaction': '', 'outputb': 'OFF', 'outputbaction': '2', 'outputc': 'OFF', 'outputcaction': '3', 'outputd': 'OFF',  'outputdaction': '', 'sounds': [
		{'soundid': '1', 'soundname': 'Scream'},
		{'soundid': '2', 'soundname': 'Zombie'},
		{'soundid': '3', 'soundname': 'Evil Laugh'},
		{'soundid': '4', 'soundname': 'Ghost'}
	]}
]
triggers = [
	{'triggerid': '1', 'controllerid': '1', 'triggername': 'Motion 1', 'triggertype': '1', 'param1': '10000', 'param2': ''}
]

@app.route('/')
@app.route('/dashboard')
def dashboard():
	project = projectname
	return render_template('dashboard.html', title='Dashboard', projectname=project, triggers=triggertypes, actions=actions, sounds=sounds, events=events)

@app.route('/add_trigger_to_event', methods=['POST'])
def add_trigger_to_event():
	param = ""
	tiptitle = ""
	a, eventid = request.form['triggerEventnameSelect'].split('-')
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
		tiptitle = "Default state: " + param + "<br />(click to edit)"
	elif triggerid == '3':
		tiptitle = "No parameters to config"
	elif triggerid == '4':
		param = request.form['eventTrigger']
		tiptitle = "Using event: " + param + "<br />(click to edit)"
	#Add to sql db and commit, return new list of actions
	for e in events:
		if e['eventid'] == eventid:
			e['triggers'].append({'triggerid': triggerid, 'triggername': triggername, 'triggerparam': param, 'tiptitle': tiptitle})
			return jsonify(triggers = e['triggers'])

@app.route('/controllers')
def controllers():
	project = projectname
	return render_template('controllers.html', title='Controllers', projectname=project, triggers=triggertypes, actions=actions, sounds=sounds, controllers=cntrlrs, colors=colors)

@app.route('/add_controller', methods=['POST'])
def add_controller():
	cid = request.form['cidform']
	cname = Controller.make_unique_name(request.form['name'])
	b, cc = request.form['color'].split('-')
	newcontroller = Controller(id=cid, project_id=projectid, color_id=cc, name=cname)
	#newcontroller = {'controllerid': cid, 'controllername': cname, 'controllercolor': cc, 'input1': '', 'input1trigger': '', 'input2': '', 'input2trigger': '', 'outputa': 'OFF', 'outputaaction': '', 'outputb': 'OFF', 'outputbaction': '', 'outputc': 'OFF', 'outputcaction': '', 'outputd': 'OFF',  'outputdaction': '', 'sounds': []}
	#cntrlrs.append(newcontroller)
	db.session.add(newcontroller)
	db.session.commit()
	r = {'status':'OK', 'clist': [c.serialize for c in Controller.query.all()], 'controller': [newcontroller.serialize]}
	return jsonify(data = r)

@app.route('/update_controller', methods=['POST'])
def update_controller():
	a, cid = request.form['controllerSelect'].split("-")
	test = []
	for c in cntrlrs:
		if c['controllerid'] == cid:
			c['controllername'] = request.form['name']
			a, c['controllercolor'] = request.form['color'].split('-')
			c['input1'] = request.form['input1']
			c['input2'] = request.form['input2']
			c['outputa'] = request.form['outputa']
			c['outputb'] = request.form['outputb']
			c['outputc'] = request.form['outputc']
			c['outputd'] = request.form['outputd']
			test.append(c)
	return jsonify(cn = test)

@app.route('/_get_controller')
def get_controller():
	cid = request.args.get('controllerid')
	test = []
	for c in cntrlrs:
		if c['controllerid'] == cid:
			test.append(c)
	return jsonify(controller = test)

@app.route('/add_trigger', methods=['POST'])
def add_trigger():
	cid = request.form['cid']
	triggernum = "input" + request.form['triggernum'] + "trigger"
	triggername = request.form['triggerName']
	triggertype = request.form['triggerType']
	param1 = request.form['']
	for c in cntrlrs:
		if c['controllerid'] == cid:
			c[triggernum] = request.form['triggerType']
			newtrigger = {'triggerid': '1', 'controllerid': cid, 'triggername': triggername, 'triggertype': triggertype, 'param1': '10000', 'param2': ''}
			triggers.append()
			r = {'status':'OK', 'tlist': triggers}
			return jsonify(data = r)
	return jsonify(data = {'status': 'FAIL'})

@app.route('/_update_toggle', methods=['POST'])
def update_toggle():
	cid = request.form['cntid']
	output = request.form['output']
	for c in cntrlrs:
		if c['controllerid'] == cid:
			c[output] = request.form['val']
			return jsonify(response = 'OK')
	return jsonify(response = 'FAIL')

@app.route('/_update_toggle_input', methods=['POST'])
def update_toggle_input():
	cid = request.form['cntid']
	thisinput = request.form['thisinput']
	for c in cntrlrs:
		if c['controllerid'] == cid:
			c[thisinput] = request.form['val']
			return jsonify(response = 'OK')
	return jsonify(response = 'FAIL')

@app.route('/testpost', methods=['POST'])
def testpost():
	items = request.form
	return render_template('testpost.html', items=items)
