# project/models.py


import datetime
import time
import calendar
from project import db, bcrypt
from flask import jsonify
import uuid

class Comments(db.Model):

    __tablename__ = "comments"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    script_id = db.Column(db.Integer, db.ForeignKey('script.id'), nullable=False)
    notes = db.Column(db.String(1024))
    feedback = db.Column(db.String(1024))
    duration = db.Column(db.Integer)
    
    users = db.relationship("User")
    scripts = db.relationship("Script")
    
    def __init__(self, user, script, duration, notes = '', feedback = ''):
        self.user_id = user
        self.script_id = script
        self.notes = notes
        self.feedback = feedback
        self.duration = duration

    def dump(self):
        return {'id': self.id, 
                'user_id': self.user_id,
                'script_id': self.script_id,
                'notes': self.notes,
                'feedback': self.feedback,
                'duration': self.duration
                }
    
    def dump_comment(self):
        return {'id': self.id,
                'script_id': self.script_id,
                'feedback': self.feedback,
                'duration': self.duration
                }
    
    def __repr__(self):
        return u'<Comments {0}: User:{1} Script:{2} Notes:{3}, Feedback:{4}, Duration:{5}>'.format(self.id, self.user_id, self.script_id, self.notes, self.feedback, self.duration)


class Rating(db.Model):

    __tablename__ = "rating"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, )
    script_id = db.Column(db.Integer, db.ForeignKey('script.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    rating = db.Column(db.Integer)
    
    users = db.relationship("User")
    questions = db.relationship("Question")
    scripts = db.relationship("Script")

    def __init__(self, user, script, question, rating):
        self.user_id = user
        self.script_id = script
        self.question_id = question
        self.rating = rating
    
    def dump(self):
        return {'id': self.id, 
                'user_id': self.user_id,
                'script_id': self.script_id,
                'question_id': self.question_id,
                'rating': self.rating
                }
    
    def __repr__(self):
        return u'<Rating {0}: User:{1} Script:{2} Question:{3} = Rating:{4}>'.format(self.id, self.user_id, self.script_id, self.question_id, self.rating)

class ScriptStatus(db.Model):

    __tablename__ = "status"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(db.String(10), unique=True, nullable=False)
    description = db.Column(db.String(255))
    ratable = db.Column(db.Boolean, nullable=False)

    def __init__(self, status, description="", ratable=False):
        self.status = status
        self.description = description
        self.ratable = ratable
    
    def dump(self):
        return {'id': self.id, 
                'status': self.status,
                'description': self.description
                }
    
    def __repr__(self):
        return u'<ScriptStatus {0}: {1}>'.format(self.status, self.description)

class Script(db.Model):

    __tablename__ = "script"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Integer, nullable=False)
    season = db.Column(db.Integer, nullable=False)
    author = db.Column(db.Integer, nullable=False)
    pageCount = db.Column(db.Integer, nullable=False)
    submission_date = db.Column(db.DateTime, nullable=False)
    
    
    def __init__(self, name, status, season, author, pageCount):
        self.name = name
        self.status = status
        self.season = season
        self.author = author
        self.pageCount = pageCount
        self.submission_date = datetime.datetime.now()

    def dump(self):
        return {'id': self.id, 
                'name': self.name,
                'status': self.status,
                'season': self.season,
                'author': self.author,
                'pageCount': self.pageCount,
                'submission_date': self.submission_date,
                'submission_javascript' : calendar.timegm(self.submission_date.timetuple()) * 1000,
                }
                
    def dumpNames(self):
        return {'id': self.id, 
                'name': self.name,
                'pageCount': self.pageCount
                }
                
    def __repr__(self):
        return u"<Script {0}: {1}>".format(self.id, self.name)

class File(db.Model):

    __tablename__ = "file"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    filename = db.Column(db.String(255), nullable=False)
    script = db.Column(db.Integer, nullable=False)
    upload_date = db.Column(db.DateTime, nullable=False)
    
    def __init__(self, filename, script):
        self.filename = filename
        self.script = script
        self.upload_date = datetime.datetime.now()
    
    def dump(self):
        return {'id': self.id, 
                'filename': self.filename,
                'script': self.script,
                'upload_date': self.upload_date 
                }
                
    def __repr__(self):
        return u"<File {0}: {1} -> {2}>".format(self.id, self.filename, self.script)

class UserType(db.Model):

    __tablename__ = "usertypes"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type = db.Column(db.String(10), unique=True, nullable=False)

    def __init__(self, type):
        self.type = type
    
    def dump(self):
        return {'id': self.id, 
                'type': self.type, 
                }
    
    def __repr__(self):
        return u"<UserType {0}>".format(self.type)

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=False, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    registered_on = db.Column(db.DateTime, nullable=False)
    user_type = db.Column(db.Integer, nullable=False, default=1)
    can_rate = db.Column(db.Boolean, default=False)
    activated = db.Column(db.Boolean, default=False)
    activation_key = db.Column(db.String(32))
    

    def __init__(self, name, email, activation_key = "notset", password=str(uuid.uuid4()), user_type=1, can_rate = False, activated = True):
        self.name = name
        self.email = email
        self.password = bcrypt.generate_password_hash(password)
        self.registered_on = datetime.datetime.now()
        self.user_type = user_type
        self.can_rate = can_rate
        self.activation_key = activation_key
        self.activated = activated

    def is_authenticated(self):
        return True

    def is_active(self):
        return self.activated

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.id

    def dump(self):
        return {'id': self.id, 
                'name': self.name, 
                'email' : self.email, 
                'registered_on': self.registered_on,
                'user_type': self.user_type,
                'user_type_name': UserType.query.filter_by(id=self.user_type).first().type,
                'password' : 'not-changed',
                'can_rate' : self.can_rate,
                'activated' : self.activated,
                }

    def __repr__(self):
        return u"<User {0}: {1} | {2} - Rate:{3}>".format(self.id, self.name, self.email, self.can_rate)

class Question(db.Model):

    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    #type 1 = personal rating, 2 = final vote
    type = db.Column(db.Integer, nullable = False)
    
    def __init__(self, question, description = '', type = 1):
        self.question = question
        self.description = description
        self.type = type
    	
    def get_id(self):
        return self.id
        
    def dump(self):
        return {'id': self.id, 
                'question': self.question, 
                'description' : self.description,
                'type' : self.type
                }
    
    def __repr__(self):
        return u'<Question {0}:{1}:{2}:{3}>'.format(self.id, self.question, self.description, self.type)
        
class Season(db.Model):

    __tablename__ = "seasons"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    year = db.Column(db.Integer, unique=True, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
        
    def __init__(self, year, start_date, end_date):
        self.year = year
        self.start_date = start_date
        self.end_date = end_date
    
    def get_id(self):
        return self.id

    def dump(self):


        return {'id': self.id, 
                'year': self.year, 
                'start_date' : self.start_date.strftime("%b %d, %Y"), 
                'start_javascript' : calendar.timegm(self.start_date.timetuple()) * 1000,
                'end_date': self.end_date.strftime("%b %d, %Y"),
                'end_javascript' : calendar.timegm(self.end_date.timetuple()) * 1000,
                }

    def __repr__(self):
        return u'<Season {0}:{1} -> {2}>'.format(self.id, self.start_date, self.end_date)

class PageContent(db.Model):

    __tablename__ = "pagecontent"
    
    page = db.Column(db.String(32), primary_key=True, unique=True)
    htmlcontent = db.Column(db.String)

    def __init__(self, page, htmlcontent):
        self.page = page
        self.htmlcontent = htmlcontent
    
    def dump(self):
        return {
                'page': self.page, 
                'htmlcontent': self.htmlcontent, 
                }
    
    def __repr__(self):
        return u"<PageContente {0}>".format(self.page)

