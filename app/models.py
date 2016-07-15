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

	def __repr__(self):
		return '<Project %r>' % (self.name)

class Color(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(8), index=True)
	hex = db.Column(db.String(8))

class Triggertype(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(24), index=True)
	virtual = db.Column(db.Boolean)

class Actiontype(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(24), index=True)

class Controller(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
	color_id = db.Column(db.Integer, db.ForeignKey('color.id'))
	sounds= db.relationship('Sound', backref='sound', lazy='dynamic')
	trigger = db.relationship('Trigger', backref='controller', lazy='dynamic')
	name = db.Column(db.String(24), index=True, unique=True)
	input1 = db.Column(db.String(10), default='ACTIVE')
	input2 = db.Column(db.String(10), default='ACTIVE')
	outputa = db.Column(db.String(10), default='OFF')
	outputb = db.Column(db.String(10), default='OFF')
	outputc = db.Column(db.String(10), default='OFF')
	outputd = db.Column(db.String(10), default='OFF')

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
	
	@property
	def get_triggerid(self, triggernum):
		try:
			return self.trigger.filter(Trigger.num == triggernum).first().id
		except:
			return ""

	@property
	def get_triggername(self, triggernum):
		try:
			return self.trigger.filter(Trigger.num == triggernum).first().name
		except:
			return ""

	@property
	def serialize(self):
		#Return object data in easily serializable format
		return {
			'controllerid': self.id,
			'controllername': self.name,
			'controllercolor': self.color_id,
			'trigger1': self.get_triggerid(1),
			'trigger1name': self.get_triggername(1),
			'trigger2': self.get_triggerid(2),
			'trigger2name': self.get_triggername(2),
			'input1': self.input1,
			'input2': self.input2,
			'outputa': self.outputa,
			'outputb': self.outputb,
			'outputc': self.outputc,
			'outputd': self.outputd
		}

event_triggers = db.Table('event_triggers',
	db.Column('event_id', db.Integer, db.ForeignKey('event.id')),
	db.Column('trigger_id', db.Integer, db.ForeignKey('trigger.id'))
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
	sounds = db.relationship(
		'Sound',
		secondary = event_sounds,
		primaryjoin = (event_sounds.c.event_id == id),
		secondaryjoin = (event_sounds.c.sound_id == id),
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

class Trigger(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	triggertype_id = db.Column(db.Integer, db.ForeignKey('triggertype.id'))
	num = db.Column(db.Integer)
	name = db.Column(db.String(24), index=True)
	param1 = db.Column(db.String(8))
	param2 = db.Column(db.String(8))

	@property
	def serialize(self):
		tt = Triggertype.query.get(self.triggertype_id)
		#Return object data in easily serializable format
		return {
			'id': self.id,
			'cid': self.controller_id,
			'type_id': tt.id,
			'type_name': tt.name,
			'inputnum': self.num,
			'name': self.name,
			'param1': self.param1,
			'param2': self.param2
		}

class Action(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
	actiontype_id = db.Column(db.Integer, db.ForeignKey('actiontype.id'))
	outputport = db.Column(db.String(2))
	param1 = db.Column(db.String(8))
	param2 = db.Column(db.String(8))

class Sound(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	controller_id = db.Column(db.Integer, db.ForeignKey('controller.id'))
	name = db.Column(db.String(48))
