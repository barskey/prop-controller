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
	sounds= db.relationship('sound', backref='sound', lazy='dynamic')
	triggers = db.relationship('trigger', backref='trigger', lazy='dynamic')
	actions = db.relationship('action', backref='action', lazy='dynamic')
	name = db.Column(db.String(24), index=True, unique=True)
	input1 = db.Column(db.String(10))
	input2 = db.Column(db.String(10))
	outputa = db.Column(db.String(10))
	outputb = db.Column(db.String(10))
	outputc = db.Column(db.String(10))
	outputd = db.Column(db.String(10))

	@staticmethod
	def make_unique_imgname(tempname):
		if Controller.query.filter_by(name=tempname).first() is None:
			return tempname
		version = 2
		while True:
			new_name = tempname + str(version)
			if Controller.query.filter_by(name=new_name).first() is None:
				break
			version += 1
		return new_name

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
		backref = db.backref('event_triggers', lazy='dynamic'),
		lazy = 'dynamic')
	actions = db.relationship(
		'Action',
		secondary = event_actions,
		primaryjoin = (event_actions.c.event_id == id),
		secondaryjoin = (event_actions.c.action_id == id),
		backref = db.backref('event_actions', lazy='dynamic'),
		lazy = 'dynamic')
	sounds = db.relationship(
		'Sound',
		secondary = event_sounds,
		primaryjoin = (event_sounds.c.event_id == id),
		secondaryjoin = (event_sounds.c.sound_id == id),
		backref = db.backref('event_sounds', lazy='dynamic'),
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
	def make_unique_imgname(tempname):
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
	name = db.Column(db.String(24), index=True, unique=True)
	param1 = db.Column(db.String(8))
	param2 = db.Column(db.String(8))

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
