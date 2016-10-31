from app import app, db
from flask import render_template, redirect, request, jsonify, json, session
from .models import Project, Color, Triggertype, Actiontype, Controller, Port, Event, Trigger, Action, Sound
import serial, time, threading
from serial import SerialException

#queue = Queue.Queue()
ser_port = '/dev/cu.usbserial-FTALLYWT'
#ser_port = 'COM1'
ser_baudrate = 9600

serial_port = None

try:
	serial_port = serial.Serial(ser_port, ser_baudrate, timeout=1)
except SerialException:
	print 'Could not connect to serial'

def handle_data(data):
	print('From serial:' + data)
	nodeID, cmd = data.rstring().split(':')
	if cmd == 'C':
		session[nodeID] = True

def read_from_port(ser):
	while serial_port is not None:

		while True:
			serdata = ser.readline().decode('ascii')
			if len(serdata) > 0:
				handle_data(serdata)
			#if ser.in_waiting > 0:
				#print('Reading serial data')
				#serdata = ser.read(ser.in_waiting).decode('ascii')
				#put it in the queue here?
				#handle_data(serdata)
				#time.sleep(1)

if serial_port is not None:
	thread  = threading.Thread(target=read_from_port, args=(serial_port))
	thread.daemon = True
	thread.start()
#print('Hello')

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
	if controllers.count() == 0:
		return redirect("/controllers")
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
	return render_template('index.html', title='Dashboard', projectname=projectname, triggers=triggers, outputs=outputs, triggertypes=[tt.serialize for tt in Triggertype.query.all()], actions=[a.serialize for a in Action.query.all()], sounds=sounds, controllers=[c.serialize for c in controllers], colors=colors)

@app.route('/controllers')
def controllers():
	controllers = Controller.query.filter(Controller.project_id==projectid)
	for c in controllers:
		session[c.id] = False
	colors = Color.query.all()
	return render_template('controllers.html', title='Controllers', projectname=projectname, controllers=[c.serialize for c in controllers], colors=[color.serialize for color in colors])

@app.route('/_get_connected', methods=['GET'])
def get_conneted():
	return jsonify(data={'connected': session})
	
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
	m = Port(controller_id=cid, port='1', name='Motion', type='input', state='ENABLED')
	db.session.add(m)
	i = Port(controller_id=cid, port='2', name='Input', type='input', state='ENABLED')
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

@app.route('/_update_controller', methods=['POST'])
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

@app.route('/_update_portname', methods=['POST'])
def update_portname():
	cid = request.form['controller_id']
	name = request.form['name']
	port = request.form['portnum']
	p = Port.query.filter_by(controller_id=cid, port=port).first()
	p.name = name
	db.session.commit()
	newport = p.serialize
	r = {'status': 'OK', 'port': newport}
	return jsonify(data = r)

@app.route('/_update_toggle', methods=['POST'])
def update_toggle():
	state = None

	cid = request.form['cntid']
	port = request.form['port']
	p = Port.query.filter_by(controller_id=cid, port=port).first()
	val = request.form['val']
	p.state = val
	db.session.commit()

	# CMD string format #|S1N
	#                   0|123
	# 0: # Controller ID
	# 1: S for Setup
	# 2: 1,2,A,B,C,D for port number
	# 3: N for On, F for Off, X for Disabled

	if val == 'ON':
		state = 'N'
	elif val == 'OFF':
		state = 'F'
	elif val == 'DISABLED':
		state = 'X'
	elif val == 'ENABLED':
		state = 'N'

	cmd = cid + ':S' + port + state + '\n'
	print(cmd)
	ser = serial.Serial(ser_port, ser_baudrate, timeout=0)
	ser.write(cmd.encode('ascii'))
	ser.close

	return jsonify(response = 'OK')

@app.route('/dashboard')
def dashboard():
	project = projectname

	controllers = Controller.query.filter(Controller.project_id==projectid)
	if controllers.count() == 0:
		return redirect("/controllers")

	return render_template('dashboard.html',
		title='Dashboard',
		projectname=project,
		inputs=[i.serialize for i in Port.query.filter(Port.type == 'input', Port.state != 'DISABLED')],
		triggertypes=[tt.serialize for tt in Triggertype.query.all()],
		actiontypes=[at.serialize for at in Actiontype.query.all()],
		outputs=[o.serialize for o in Port.query.filter(Port.type == 'output', Port.state != 'DISABLED')],
		sounds=sounds,
		events=[e.serialize for e in Event.query.all()]
	)

@app.route('/_add_event', methods=['GET'])
def add_event():
	newevent = Event(project_id=projectid)
	db.session.add(newevent)
	db.session.commit()

	newevent.name = 'Event' + str(newevent.id)

	p = Port.query.filter_by(type='input').first()
	t = Trigger(input_id=p.id)
	db.session.add(t)

	p = Port.query.filter_by(type='output').first()
	a = Action(output_id=p.id, order=1)
	db.session.add(a)
	db.session.commit()

	nt = newevent.add_trigger(t)
	db.session.add(nt)
	na = newevent.add_action(a)
	db.session.add(na)
	db.session.commit()

	r = {'status':'OK', 'elist': [e.serialize for e in Event.query.all()], 'newevent': newevent.serialize}
	return jsonify(data = r)

@app.route('/_update_event', methods=['POST'])
def update_event():
	a, eid = request.form['event-id'].split("-")
	ename = request.form['eventname']
	e = Event.query.get(eid)
	e.name = ename
	db.session.commit()

	a, tid = request.form['trigger-id'].split("-")
	param1 = 0
	ttid = request.form['triggertype_id']
	pid = request.form['port_id']

	tt = Triggertype.query.get(ttid)
	if tt.type == 'interval':
		param1 = request.form['every-param1']
	elif tt.type == 'random':
		param1 = request.form['random-param1']
	elif tt.type == 'input':
		param1 = request.form['input-param1']
	param2 = request.form['random-param2']

	for t in e.triggers:
		t.input_id = pid
		t.triggertype_id = ttid
		t.param1 = param1
		t.param2 = param2
		db.session.commit()

	for a in e.actions:
		thisaction = 'action-' + str(a.id)
		a.delay = request.form[thisaction + '-delay']
		atid = request.form[thisaction + '-actiontype_id']
		a.actiontype_id = atid
		at = Actiontype.query.get(atid)
		if at.type == 'on':
			a.output_id = request.form[thisaction + '-output_id']
		elif at.type == 'off':
			a.output_id = request.form[thisaction + '-output_id']
		elif at.type == 'toggle':
			a.output_id = request.form[thisaction + '-output_id']
		elif at.type == 'blink':
			a.output_id = request.form[thisaction + '-output_id']
			a.param1 = request.form[thisaction + '-param1']
		elif at.type == 'sound':
			a.sound_id = request.form[thisaction + '-sound_id']
		db.session.commit()

	event = e.serialize
	r = {'status': 'OK', 'eventlist': [e.serialize for e in Event.query.all()], 'event': event}
	return jsonify(data = r)

@app.route('/_add_action', methods=['POST'])
def add_action():
	x, eid = request.form['eid'].split("-")
	event = Event.query.get(eid)
	next_order = event.actions.count() + 1
	a = Action(order=next_order)
	db.session.add(a)
	db.session.commit()
	na = event.add_action(a)
	db.session.add(na)
	db.session.commit()
	r = {'status':'OK', 'action': a.serialize}
	return jsonify(response = r)

@app.route('/_delete_action', methods=['POST'])
def delete_action():
	x, eid = request.form['event_id'].split("-")
	e = Event.query.get(eid)
	x, aid = request.form['action_id'].split("-")
	a = Action.query.get(aid)
	da = e.rem_action(a)
	db.session.add(da)
	db.session.commit()
	db.session.delete(a)
	db.session.commit()
	r = {'status':'OK'}
	return jsonify(data = r)

@app.route('/_update_action_order', methods=['POST'])
def update_action_order():
	actionlist = request.form['actionlist'].split("&")
	i = 1
	for a in actionlist:
		x, aid = a.split("=")
		a = Action.query.get(aid)
		a.order = i
		db.session.commit()
		i += 1
	r = {'status':'OK'}
	return jsonify(data = r)

@app.route('/_delete_event', methods=['POST'])
def delete_event():
	x, eid = request.form['event_id'].split("-")
	e = Event.query.get(eid)
	for t in e.triggers:
		dt = e.rem_trigger(t)
		db.session.add(dt)
		db.session.delete(t)
		db.session.commit()
	for a in e.actions:
		da = e.rem_action(a)
		db.session.add(da)
		db.session.delete(a)
		db.session.commit()
	db.session.delete(e)
	db.session.commit()
	r = {'status':'OK', 'eventlist': [e.serialize for e in Event.query.all()]}
	return jsonify(data = r)

@app.route('/_get_triggers', methods=['GET'])
def get_triggers():
	return jsonify(response = {'inputs': [i.serialize for i in Port.query.filter(Port.type == 'input', Port.state != 'DISABLED')], 'triggertypes': [tt.serialize for tt in Triggertype.query.all()]})

@app.route('/testpost', methods=['POST'])
def testpost():
	items = request.form
	return render_template('testpost.html', items=items)

@app.route('/admin')
def admin():
	return render_template('admin.html',
		title='Admin',
		projects=[p.serialize for p in Project.query.all()],
		ports=[p.serialize for p in Port.query.all()],
		triggertypes=[tt.serialize for tt in Triggertype.query.all()],
		actiontypes=[at.serialize for at in Actiontype.query.all()],
		actions=[a.serialize for a in Action.query.all()],
		triggers=[t.serialize for t in Trigger.query.all()],
		controllers=[c.serialize for c in Controller.query.all()],
		events=[e.serialize for e in Event.query.all()],
		colors=[c.serialize for c in Color.query.all()]
	)

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

@app.route('/_empty_table', methods=['POST'])
def empty_table():
	empty = []
	table = request.form['tablename']
	if table == 'project':
		empty = Project.query.all()
	elif table == 'color':
		empty = Color.query.all()
	elif table == 'triggertype':
		empty = Triggertype.query.all()
	elif table == 'actiontype':
		empty = Actiontype.query.all()
	elif table == 'controller':
		empty = Controller.query.all()
	elif table == 'port':
		empty = Port.query.all()
	elif table == 'event':
		empty = Event.query.all()
	elif table == 'trigger':
		empty = Trigger.query.all()
	elif table == 'action':
		empty = Action.query.all()

	for d in empty:
		db.session.delete(d)
	db.session.commit()

	return redirect('/admin')
