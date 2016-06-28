from app import db
from flask import json

class Img(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	imgname = db.Column(db.String(64), index=True, unique=True)
	animated = db.Column(db.Boolean)
	fps = db.Column(db.Integer)
	pixels = db.relationship('Pixel', backref='pic', lazy='dynamic')
	
	def get_id(self):
		try:
			return unicode(self.id)	 # python 2
		except NameError:
			return str(self.id)	 # python 3
	
	@staticmethod
	def make_unique_imgname(tempname):
		if Img.query.filter_by(imgname=tempname).first() is None:
			return tempname
		version = 2
		while True:
			new_imgname = tempname + str(version)
			if Img.query.filter_by(imgname=new_imgname).first() is None:
				break
			version += 1
		return new_imgname
	
	def __repr__(self):
		return '<Image %r>' % (self.imgname)

class Pixel(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	img_id = db.Column(db.Integer, db.ForeignKey('img.id'))
	frame = db.Column(db.Integer)
	row = db.Column(db.Integer)
	col= db.Column(db.Integer)
	hexvalue = db.Column(db.String(6))
	
	@staticmethod
	def modelToArray(imgid, frame):
		pixels = Pixel.query.filter_by(img_id = int(imgid), frame = int(frame)).order_by(Pixel.row).order_by(Pixel.col)
		pixelarray = [[0 for r in range(16)] for y in range(16)]
		for pixel in pixels:
			pixelarray[pixel.row][pixel.col] = pixel.hexvalue
		return pixelarray
