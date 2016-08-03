from app import app, db
from flask import render_template, redirect, request, jsonify, json
from .models import Project, Color, Triggertype, Actiontype, Controller, Port, Event, Trigger, Action, Sound

#Dummy data for testing
projectname = "Halloween 2016"
projectid = 1
projects = [
	{'id': 1, 'name': 'Halloween 2016'}
]
colors = [
	{'id': '5', 'name': 'red', 'hex': '#DD5F32'},
	{'id': '6', 'name': 'orange', 'hex': '#FFA200'},
	{'id': '9', 'name': 'yellow', 'hex': '#e6e600'},
	{'id': '7', 'name': 'green', 'hex': '#00A03E'},
	{'id': '1', 'name': 'blue', 'hex': '#4298B5'},
	{'id': '4', 'name': 'purple', 'hex': '#9900ff'},
	{'id': '3', 'name': 'olive', 'hex': '#92B06A'},
	{'id': '8', 'name': 'teal', 'hex': '#24A8AC'},
	{'id': '2', 'name': 'black', 'hex': '#273a3f'},
	{'id': '10', 'name': 'salmon', 'hex': '#fa8072'}
]
triggertypes = [
	{'id': '0', 'type': 'input', 'name': 'Input'},
	{'id': '1', 'type': 'interval', 'name': 'Every'},
	{'id': '2', 'type': 'random', 'name': 'Randomly'},
	{'id': '3', 'type': 'event', 'name': 'Event'}
]
actiontypes = [
	{'id': '0', 'type': 'on', 'name': 'Turn On'},
	{'id': '1', 'type': 'off', 'name': 'Turn Off'},
	{'id': '2', 'type': 'toggle', 'name': 'Toggle'},
	{'id': '3', 'type': 'blink', 'name': 'Blink'},
	{'id': '4', 'type': 'sound', 'name': 'Play Sound'}
]
sounds = [
	{'id': '1', 'name': 'Scream'},
	{'id': '2', 'name': 'Zombie'},
	{'id': '3', 'name': 'Evil Laugh'},
	{'id': '4', 'name': 'Ghost'}
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

@app.route('/controllers')
def controllers():
	controllers = Controller.query.filter(Controller.project_id==projectid)
	colors = Color.query.all()
	return render_template('controllers.html', title='Controllers', projectname=projectname, controllers=[c.serialize for c in controllers], colors=[color.serialize for color in colors])

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
		i = Port(controller_id=cid, port=n, name=str(n), type='input', state='PULLDOWN')
		db.session.add(i)
	for let in {'A', 'B', 'C', 'D'}:
		o = Port(controller_id=cid, port=let, name=let, type='output', state='OFF')
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
	for p in c.ports:
		db.session.delete(p)
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

@app.route('/_update_toggle', methods=['POST'])
def update_toggle():
	cid = request.form['cntid']
	port = request.form['port']
	p = Port.query.filter_by(controller_id=cid, port=port).first()
	p.state = request.form['val']
	print p.serialize
	db.session.commit()
	return jsonify(response = "OK")

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
	return render_template('admin.html', title='Admin', projects=[p.serialize for p in Project.query.all()], ports=[p.serialize for p in Port.query.all()], triggertypes=[tt.serialize for tt in Triggertype.query.all()], actiontypes=[at.serialize for at in Actiontype.query.all()], actions=[a.serialize for a in Action.query.all()], controllers=[c.serialize for c in Controller.query.all()], events=[e.serialize for e in Event.query.all()], colors=[c.serialize for c in Color.query.all()])

@app.route('/init_setup')
def init_setup():
	#Empty Project table and add new entries
	proj = Project.query.all()
	for p in proj:
		db.session.delete(p)
	db.session.commit()
	
	for p in projects:
		project = Project(id=p['id'], name=p['name'])
		db.session.add(project)
	db.session.commit()
	
	#Empty Actiontype table and add new entries
	at = Actiontype.query.all()
	for a in at:
		db.session.delete(a)
	db.session.commit()
	
	for a in actiontypes:
		actiontype = Actiontype(id=a['id'], name=a['name'], type=a['type'])
		db.session.add(actiontype)
	db.session.commit()
	
	#Empty Triggertype table and add new entries
	tt = Triggertype.query.all()
	for t in tt:
		db.session.delete(t)
	db.session.commit()
	
	for t in triggertypes:
		triggertype = Triggertype(id=t['id'], name=t['name'], type=t['type'])
		db.session.add(triggertype)
	db.session.commit()

	#Empty Color table and add new entries
	col = Color.query.all()
	for c in col:
		db.session.delete(c)
	db.session.commit()
	
	for c in colors:
		color = Color(id=c['id'], name=c['name'], hex=c['hex'])
		db.session.add(color)
	db.session.commit()
	
	#Empty Sound table and add new entries
	snd = Sound.query.all()
	for s in snd:
		db.session.delete(s)
	db.session.commit()
	
	for s in sounds:
		sound = Sound(id=s['id'], name=s['name'])
		db.session.add(sound)
	db.session.commit()
	
	return redirect('/admin')