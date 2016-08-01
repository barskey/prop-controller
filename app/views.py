from app import app, db
from flask import render_template, request, jsonify, json
from .models import Project, Color, Triggertype, Actiontype, Controller, Event, Input, Output, Action, Sound

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
def index():
	controllers = Controller.query.filter(Controller.project_id==projectid)
	triggers = []
	outputs = []
	for c in controllers:
		if c.serialize['input1state'] != "DISABLED":
			triggers.append({'ttid': '0', 'inputnum': '1', 'selecttext': c.name + '-Input 1'})
		if c.serialize['input2state'] != "DISABLED":
			triggers.append({'ttid': '0', 'inputnum': '2', 'selecttext': c.name + '-Input 2'})
		if c.serialize['outputAstate'] != "DISABLED":
			outputs.append({'outputnum': 'A'})
		if c.serialize['outputBstate'] != "DISABLED":
			outputs.append({'outputnum': 'B'})
		if c.serialize['outputCstate'] != "DISABLED":
			outputs.append({'outputnum': 'C'})
		if c.serialize['outputDstate'] != "DISABLED":
			outputs.append({'outputnum': 'D'})
	triggers.append({'ttid': '1', 'selecttext': 'Every'})
	triggers.append({'ttid': '2', 'selecttext': 'Randomly between'})
	return render_template('index.html', title='Dashboard', projectname=projectname, triggers=triggers, outputs=outputs, triggertypes=[tt.serialize for tt in Triggertype.query.all()], actions=actions, sounds=sounds, controllers=[c.serialize for c in controllers], colors=colors)

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
	controllers = Controller.query.filter(Controller.project_id==projectid)
	return render_template('controllers.html', title='Controllers', projectname=projectname, triggertypes=[tt.serialize for tt in Triggertype.query.all()], sounds=sounds, controllers=[c.serialize for c in controllers], colors=colors)

@app.route('/add_controller', methods=['POST'])
def add_controller():
	cid = request.form['cidform']
	cname = request.form['name']
	if Controller.query.filter(Controller.name == cname).count() > 0:
		newname = Controller.make_unique_name(cname)
		return jsonify(data={'status': 'NAME', 'newname': newname})
	b, cc = request.form['color'].split('-')
	newcontroller = Controller(id=cid, project_id=projectid, color_id=cc, name=cname)
	db.session.add(newcontroller)
	for n in range(1,3):
		i = Input(controller_id=cid, triggertype_id=0, port=n, name=str(n))
		db.session.add(i)
	for let in {'A', 'B', 'C', 'D'}:
		o = Output(controller_id=cid, port=let, name=let)
		db.session.add(o)
	db.session.commit()
	r = {'status':'OK', 'clist': [c.serialize for c in Controller.query.all()], 'controller': newcontroller.serialize}
	return jsonify(data = r)

@app.route('/rem_controller', methods=['POST'])
def rem_controller():
	a, cid = request.form['controller_id'].split("-")
	c = Controller.query.get(cid)
	status = ''
	if c:
		status = 'OK'
	else:
		status = 'FAIL'
		return jsonify(data = {'status': status})
	for i in c.inputs:
		db.session.delete(i)
	for o in c.outputs:
		db.session.delete(o)
	db.session.delete(c)
	db.session.commit()
	r = {'status': status, 'clist': [c.serialize for c in Controller.query.all()]}
	return jsonify(data = r)

@app.route('/update_controller', methods=['POST'])
def update_controller():
	a, cid = request.form['controller_id'].split("-")
	cname = request.form['name']
	b, cc = request.form['color'].split('-')
	c = Controller.query.get(cid)
	if Controller.query.filter(Controller.name == cname, Controller.id != cid).count() > 0:
		newname = Controller.make_unique_name(cname)
		return jsonify(data = {'status': 'NAME', 'newname': newname})
	c.name = cname
	c.color_id = cc
	db.session.commit()
	controller = c.serialize
	r = {'status': 'OK', 'clist': [c.serialize for c in Controller.query.all()], 'controller': controller}
	return jsonify(data = r)

@app.route('/_get_controller')
def get_controller():
	cid = request.args.get('controllerid')
	test = []
	for c in cntrlrs:
		if c['controllerid'] == cid:
			test.append(c)
	return jsonify(controller = test)

@app.route('/update_trigger', methods=['POST'])
def update_trigger():
	cid = request.form['controller_id']
	triggernum = request.form['triggernum']
	triggertype = request.form['triggerType']
	c = Controller.query.get(cid)
	t = c.get_trigger(int(triggernum))
	param1 = ''
	param2 = ''
	typename = ''
	if int(triggertype) == 0: #unassigned
		param1 = ''
		typename = "unassigned"
	if int(triggertype) == 1: #Motion
		param1 = request.form['resetTime']
		typename = "Motion"
	elif int(triggertype) == 2: #Pushbutton
		param1 = request.form['defaultState']
		typename = "Pushbutton"
	elif int(triggertype) == 3: #Switch
		typename = "Switch"
	t.triggertype_id = triggertype
	t.param1 = param1
	t.param2 = param2
	trigger = t.serialize
	db.session.commit()
	r = {'status': 'OK', 'tlist': [t.serialize for t in Trigger.query.all()], 'trigger': trigger}
	return jsonify(data = r)

@app.route('/_update_toggle', methods=['POST'])
def update_toggle():
	cid = request.form['cntid']
	output = request.form['output']
	c = Controller.query.get(cid)
	r = 'FAIL'
	if output == 'outputa':
		c.outputa = request.form['val']
		r = 'OK'
	elif output == 'outputb':
		c.outputb = request.form['val']
		r = 'OK'
	elif output == 'outputc':
		c.outputc = request.form['val']
		r = 'OK'
	elif output == 'outputd':
		c.outputd = request.form['val']
		r = 'OK'
	db.session.commit()
	return jsonify(response = r)

@app.route('/_update_toggle_input', methods=['POST'])
def update_toggle_input():
	cid = request.form['cntid']
	thisinput = request.form['thisinput']
	c = Controller.query.get(cid)
	r = 'FAIL'
	if thisinput == 'input1':
		c.input1 = request.form['val']
		r = 'OK'
	elif thisinput == 'input2':
		c.input2 = request.form['val']
		r = 'OK'
	db.session.commit()
	return jsonify(response = r)

@app.route('/testpost', methods=['POST'])
def testpost():
	items = request.form
	return render_template('testpost.html', items=items)

@app.route('/admin')
def admin():
	return render_template('admin.html', title='Admin', projects=[p.serialize for p in Project.query.all()], inputs=[i.serialize for i in Input.query.all()], outputs=[o.serialize for o in Output.query.all()], triggertypes=[tt.serialize for tt in Triggertype.query.all()], actions=[a.serialize for a in Action.query.all()], controllers=[c.serialize for c in Controller.query.all()], events=[e.serialize for e in Event.query.all()], colors=[c.serialize for c in Color.query.all()])
