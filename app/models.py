from app import db
from flask import json

class Project(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(48), index=True, unique=True)
	controller = db.relationship('Controller', backref='controlelr', lazy='dynamic')
	event = db.relationship('Event', backref='event', lazy='dynamic')

	def get_id(self):
		try:
			return unicode(self.id)	 # python 2
		except NameError:
			return str(self.id)	 # python 3

	@property
	def serialize(self):
		return{
			'id': self.id,
			'name': self.name
		}

	def __repr__(self):
		return '<Project %r>' % (self.name)

class Color(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(8), index=True)
	hex = db.Column(db.String(8))

	@property
	def serialize(self):
		return{
			'id': self.id,
			'name': self.name,
			'hex': self.hex
		}

class Triggertype(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(24), index=True)
	virtual = db.Column(db.Boolean)
	
	inputs = db.relationship('Input', backref='triggertype')

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'name': self.name,
			'virtual': self.virtual
		}

class Actiontype(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(24), index=True)

	@property
	def serialize(self):
		return{
			'id': self.id,
			'name': self.name
		}

class Controller(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
	color_id = db.Column(db.Integer, db.ForeignKey('color.id'))
	name = db.Column(db.String(25), index=True, unique=True)
	
	inputs = db.relationship('Input', backref='controller')
	outputs = db.relationship('Output', backref='controller')

	def get_id(self):
		try:
			return unicode(self.id)  # python 2
		except NameError:
			return str(self.id)  # python 3

	@staticmethod
	def make_unique_name(tempname):
		if Controller.query.filter_by(name=tempname).first() is None:
			return tempname
		version = 2
		while True:
			new_name = tempname + str(version)
			if Controller.query.filter_by(name=new_name).first() is None:
				break
			version += 1
		return new_name

	def get_input(self, num):
		try:
			for i in self.inputs:
				if i.port == num:
					return i
		except:
			return 0

	def get_output(self, let):
		try:
			for o in self.outputs:
				if o.port == let:
					return o
		except:
			return 0

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'controller_id': self.id,
			'project_id': self.project_id,
			'controllername': self.name,
			'controllercolor': self.color_id,
			'input1_id': self.get_input(1).id,
			'input1name': self.get_input(1).name,
			'input1state': self.get_input(1).state,
			'input1type_id': self.get_input(1).triggertype.id,
			'input1typename': self.get_input(1).triggertype.name,
			'input1param1': self.get_input(1).param1,
			'input1param2': self.get_input(1).param2,
			'input2_id': self.get_input(2).id,
			'input2name': self.get_input(2).name,
			'input2state': self.get_input(2).state,
			'input2type_id': self.get_input(2).triggertype.id,
			'input2typename': self.get_input(2).triggertype.name,
			'input2param1': self.get_input(2).param1,
			'input2param2': self.get_input(2).param2,
			'outputA_id': self.get_output('A').id,
			'outputAname': self.get_output('A').name,
			'outputAstate': self.get_output('A').state,
			'outputB_id': self.get_output('B').id,
			'outputBname': self.get_output('B').name,
			'outputBstate': self.get_output('B').state,
			'outputC_id': self.get_output('C').id,
			'outputCname': self.get_output('C').name,
			'outputCstate': self.get_output('C').state,
			'outputD_id': self.get_output('D').id,
			'outputDname': self.get_output('D').name,
			'outputDstate': self.get_output('D').state,
		}

event_triggers = db.Table('event_triggers',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('input_id', db.Integer, db.ForeignKey('input.id'))
)

event_sounds = db.Table('event_sounds',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('sound_id', db.Integer, db.ForeignKey('sound.id'))
)

event_actions = db.Table('event_actions',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('action_id', db.Integer, db.ForeignKey('action.id'))
)

class Event(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
	name = db.Column(db.String(24), index=True, unique=True)
	inputs = db.relationship(
		'Input',
		secondary = event_triggers,
		primaryjoin = (event_triggers.c.event_id == id),
		secondaryjoin = (event_triggers.c.input_id == id),
		backref = db.backref('events', lazy='dynamic'),
		lazy = 'dynamic')
	actions = db.relationship(
		'Action',
		secondary = event_actions,
		primaryjoin = (event_actions.c.event_id == id),
		secondaryjoin = (event_actions.c.action_id == id),
		backref = db.backref('events', lazy='dynamic'),
		lazy = 'dynamic')
	sounds = db.relationship(
		'Sound',
		secondary = event_sounds,
		primaryjoin = (event_sounds.c.event_id == id),
		secondaryjoin = (event_sounds.c.sound_id == id),
		backref = db.backref('events', lazy='dynamic'),
		lazy = 'dynamic')

	def add_trigger(self, input):
		if not self.has_trigger(input):
			self.inputs.append(input)
			return self

	def rem_trigger(self, input):
		if self.has_trigger(input):
			self.inputs.remove(input)
			return self

	def has_trigger(self, input):
		return self.inputs.filter(event_triggers.c.input_id == input.id).count() > 0

	def add_action(self, action):
		if not self.has_action(action):
			self.actions.append(action)
			return self

	def rem_action(self, action):
		if self.has_action(action):
			self.actions.remove(action)
			return self

	def has_action(self, action):
		return self.actions.filter(event_actions.c.action_id == action.id).count() > 0

	def add_sound(self, sound):
		if not self.has_sound(sound):
			self.sounds.append(sound)
			return self

	def rem_sound(self, sound):
		if self.has_sound(sound):
			self.sounds.remove(sound)
			return self

	def has_sound(self, sound):
		return self.sounds.filter(event_sounds.c.sound_id == sound.id).count() > 0

	@staticmethod
	def make_unique_name(tempname):
		if Event.query.filter_by(name=tempname).first() is None:
			return tempname
		version = 2
		while True:
			new_name = tempname + str(version)
			if Event.query.filter_by(name=new_name).first() is None:
				break
			version += 1
		return new_name

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'project_id': self.project_id,
			'name': self.name
		}

class Input(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	triggertype_id = db.Column(db.Integer, db.ForeignKey('triggertype.id'))
	port = db.Column(db.Integer)
	name = db.Column(db.String(25))
	state = db.Column(db.String(10), default='PULLUP')
	param1 = db.Column(db.String(8), default='')
	param2 = db.Column(db.String(8), default='')

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'cid': self.controller_id,
			'type_id': self.triggertype.id,
			'type_name': self.triggertype.name,
			'port': self.port,
			'name': self.name,
			'state': self.state,
			'param1': self.param1,
			'param2': self.param2,
			'color_id': self.controller.color_id
		}

class Output(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	port = db.Column(db.String(2))
	name = db.Column(db.String(25))
	state = db.Column(db.String(10), default='OFF')

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'cid': self.controller_id,
			'port': self.port,
			'name': self.name,
			'state': self.state,
			'color_id': self.controller.color_id
		}

class Action(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
	actiontype_id = db.Column(db.Integer, db.ForeignKey('actiontype.id'))
	outputport = db.Column(db.String(2))
	param1 = db.Column(db.String(8))
	param2 = db.Column(db.String(8))

	@property
	def serialize(self):
		return{
			'id': self.id,
			'event_id': self.event_id,
			'actiontype_id': self.actiontype_id,
			'outputport': self.outputport,
			'param1': self.param1,
			'param2': self.param2
		}

class Sound(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	name = db.Column(db.String(48))
