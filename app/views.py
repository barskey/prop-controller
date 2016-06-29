from app import app
from flask import render_template

@app.route('/')
@app.route('/dashboard')
def dashboard():
    projectname = "Halloween 2016"
    return render_template('dashboard.html', title='Dashboard', projectname=projectname)
