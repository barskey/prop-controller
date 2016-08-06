from app import db
from flask import json
from collections import namedtuple

class Project(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(49), unique=True)
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
	name = db.Column(db.String(8))
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
	type = db.Column(db.String(10))
	name = db.Column(db.String(25))
	
	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'name': self.name,
			'type': self.type
		}

class Actiontype(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	type = db.Column(db.String(10))
	name = db.Column(db.String(25))

	@property
	def serialize(self):
		return{
			'id': self.id,
			'name': self.name,
			'type': self.type
		}

class Controller(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
	color_id = db.Column(db.Integer, db.ForeignKey('color.id'))
	name = db.Column(db.String(25), unique=True)
	
	ports = db.relationship('Port', backref='controller')

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

	def get_port(self, port):
		try:
			for p in self.ports:
				if p.port == port:
					return p
			NotFound = namedtuple('NotFound', 'id name state')
			p = NotFound(id='<NOT_FOUND>', name='<NOT_FOUND>', state='<NOT_FOUND>')
			return p
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
			'input1_id': self.get_port('1').id,
			'input1name': self.get_port('1').name,
			'input1state': self.get_port('1').state,
			'input2_id': self.get_port('2').id,
			'input2name': self.get_port('2').name,
			'input2state': self.get_port('2').state,
			'outputA_id': self.get_port('A').id,
			'outputAname': self.get_port('A').name,
			'outputAstate': self.get_port('A').state,
			'outputB_id': self.get_port('B').id,
			'outputBname': self.get_port('B').name,
			'outputBstate': self.get_port('B').state,
			'outputC_id': self.get_port('C').id,
			'outputCname': self.get_port('C').name,
			'outputCstate': self.get_port('C').state,
			'outputD_id': self.get_port('D').id,
			'outputDname': self.get_port('D').name,
			'outputDstate': self.get_port('D').state,
		}

event_triggers = db.Table('event_triggers',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('trigger_id', db.Integer, db.ForeignKey('trigger.id'))
)

event_actions = db.Table('event_actions',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('action_id', db.Integer, db.ForeignKey('action.id'))
)

class Event(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
	name = db.Column(db.String(24), unique=True)
	loop = db.Column(db.Integer, default=1)
	triggers = db.relationship(
		'Trigger',
		secondary = event_triggers,
		primaryjoin = (event_triggers.c.event_id == id),
		secondaryjoin = (event_triggers.c.trigger_id == id),
		backref = db.backref('events', lazy='dynamic'),
		lazy = 'dynamic')
	actions = db.relationship(
		'Action',
		secondary = event_actions,
		primaryjoin = (event_actions.c.event_id == id),
		secondaryjoin = (event_actions.c.action_id == id),
		backref = db.backref('events', lazy='dynamic'),
		lazy = 'dynamic')

	def add_trigger(self, trigger):
		if not self.has_trigger(trigger):
			self.triggers.append(trigger)
			return self

	def rem_trigger(self, trigger):
		if self.has_trigger(trigger):
			self.triggers.remove(trigger)
			return self

	def has_trigger(self, trigger):
		return self.triggers.filter(event_triggers.c.trigger_id == trigger.id).count() > 0

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
			'name': self.name,
			'loop': self.loop
		}

class Port(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	port = db.Column(db.String(2))
	name = db.Column(db.String(25))
	state = db.Column(db.String(10))
	type = db.Column(db.String(8))

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'cid': self.controller_id,
			'port': self.port,
			'name': self.name,
			'state': self.state,
			'type': self.type,
			'color_id': self.controller.color_id
		}

class Trigger(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	input_id = db.Column(db.Integer, db.ForeignKey('port.id'))
	triggertype_id = db.Column(db.Integer, db.ForeignKey('triggertype.id'))
	param1 = db.Column(db.String(8))
	param2 = db.Column(db.String(8))

	@property
	def serialize(self):
		return{
			'id': self.id,
			'input_id': self.input_id,
			'tt_id': self.triggertype_id,
			'param1': self.param1,
			'param2': self.param2
		}

class Action(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	output_id = db.Column(db.Integer, db.ForeignKey('port.id'))
	sound_id = db.Column(db.Integer, db.ForeignKey('sound.id'))
	actiontype_id = db.Column(db.Integer, db.ForeignKey('actiontype.id'))
	delay = db.Column(db.Integer)
	param1 = db.Column(db.String(8))

	@property
	def serialize(self):
		aid = ''
		if self.actiontype_id == 4:
			aid = self.sound_id
		else:
			aid = self.output_id
		return{
			'id': self.id,
			'output_sound_id': aid,
			'actiontype_id': self.actiontype_id,
			'delay': self.delay,
			'param1': self.param1
		}

class Sound(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	name = db.Column(db.String(49))
