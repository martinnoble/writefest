# project/__init__.py

import os
from flask import Flask, request, jsonify, session, send_from_directory, redirect
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from project.config import BaseConfig
import json
from werkzeug.utils import secure_filename
import uuid
from project.unique_filename import unique_file_name
import logging
from logging.handlers import RotatingFileHandler
import datetime
import smtplib
from email.mime.text import MIMEText
import uuid


# config

app = Flask(__name__)
app.config.from_object(BaseConfig)


handler = RotatingFileHandler(app.config['WRITEFEST_LOG'], maxBytes=10000, backupCount=5)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter(app.config['LOGGING_FORMAT'])
handler.setFormatter(formatter)

app.logger.addHandler(handler)

access_logger = logging.getLogger('werkzeug')
handler = logging.FileHandler(app.config['ACCESS_LOG'])
access_logger.addHandler(handler)


bcrypt = Bcrypt(app)
db = SQLAlchemy(app)

from project.models import User, UserType, Season, Question, Script, ScriptStatus, File, Rating, Comments, PageContent

mailhost = "localhost"
mailfrom = "writefest@martinnoble.com"


def send_email(to, subject, template, content):

    print("Sending email to: " + to)

    template_path = os.path.join(app.config['EMAIL_TEMPLATE_PATH'], template)


    print(template_path)

    html_content = open(template_path + ".html", 'rb').read()



    print("read email content");

    msg = MIMEText(html_content.format(**content), 'html')
    msg['Subject'] = subject
    msg['From'] = mailfrom
    msg['To'] = to

    print("performing smtp send")

    s = smtplib.SMTP(mailhost)
    s.sendmail(mailfrom, [to], msg.as_string())
    s.quit()

    print("email sending complete")

# routes

@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/script/download/<int:author>/<filename>')
def script_download(author, filename):
    
    folder = os.path.join(app.config['UPLOAD_PATH'], str(author))
    return send_from_directory(folder, filename, as_attachment=True)
    
@app.route('/script/<int:author>/<filename>')
def script_open(author, filename):
    
    folder = os.path.join(app.config['UPLOAD_PATH'], str(author))
    return send_from_directory(folder, filename)

@app.route('/api/content', methods=['POST'])
def content():
    json_data = request.json
    page = json_data['page'].lower()

    pageContent = PageContent.query.filter_by(page=page).first()
    print "From db: " + str(pageContent)

    if json_data.has_key("content"):
        
        if pageContent:
            print "Updating existing page"
            pageContent.htmlcontent = json_data["content"]
        else:
            print "Creating new page"
            pageContent = PageContent(page, json_data["content"])
            db.session.add(pageContent)

        
        db.session.commit()
    
    htmlcontent = "<p>No content found</p>"
    if pageContent:
        print "Reading content from page: " + str(pageContent)
        htmlcontent = pageContent.htmlcontent

    status = True

    return jsonify({'result': status, 'content': htmlcontent})

@app.route('/api/register', methods=['POST'])
def register():
    json_data = request.json
    email = json_data['email'].lower()
    activation_key = str(uuid.uuid4())

    user = User(
        name=json_data['name'],
        email=email,
        password=json_data['password'],
        activation_key=activation_key
    )

    status = False

    print("Registering user: " + email)

    db.session.add(user)
    db.session.commit()

    print("Sending email")
    activationurl = app.config['WEBSITE_HOST'] + "/activate/" + email + "/" + activation_key

    email_content = {'year': '2017', 'firstname': json_data['name'].split(" ")[0], 'activateurl': activationurl}
    print(email_content)
    send_email(email, "Welcome to Writefest", "welcome", email_content)

    print("done")
    status = True

    db.session.close()
    return jsonify({'result': status})


@app.route('/api/account', methods=['POST'])
def account():
    json_data = request.json

    user_data = json_data['data']


    name = user_data['name']
    email = user_data['email'].lower()
    password = user_data['password']

    newPass = None
    if 'newPass' in user_data:
        newPass = user_data['newPass']

    status = False

    user = User.query.filter_by(email=email).first()
    if user and user.email == session['email'] and bcrypt.check_password_hash(user.password, password):
        user.name = name

        if newPass is not None:
            user.password = bcrypt.generate_password_hash(newPass)

        db.session.commit()
        status = True

    db.session.close()
    return jsonify({'result': status})


@app.route('/api/login', methods=['POST'])
def login():
    app.logger.info("Login")

    json_data = request.json
    email = json_data['email'].lower()
    user = User.query.filter_by(email=email).first()
    status = False
    
    if user and bcrypt.check_password_hash(user.password, json_data['password']) and user.activated:
        print("Login success")
        session['userid'] = user.id
        session['logged_in'] = True
        session['name'] = user.name
        session['email'] = user.email
        usertype = UserType.query.filter_by(id=user.user_type).first().type;
        session['user_type'] = usertype;
        status = True
    	return jsonify({'result': status, 'name': user.name, 'user_type': usertype})
    else:
        print("ERROR: failed login")
        status = False

    return jsonify({'result': status})


@app.route('/api/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('name', None)
    session.pop('user_type', None)
    session.pop('userid', None)
    session.pop('email', None)
    return jsonify({'result': 'success'})


@app.route('/api/status')
def status():
    curSeason = Season.query.order_by('-id').first()
    year = curSeason.dump()['year']
    if session.get('logged_in'):
        return jsonify({'logged_in': session['logged_in'], 'name': session['name'], 'user_type': session['user_type'], 'email': session['email'], 'year': year})
    else:
        return jsonify({'logged_in': False, 'year': year})

@app.route('/api/admin/questions', methods=['POST'])
def questions():

    print("Processing Question update")
    result = True
    if session['user_type'] != 'admin':
        result = False
    else:
        json_data = request.json
        print(json_data)
        action = json_data['action']
        question_data = json_data['data']
    
        if action == 'update':
            print("Updating question")
            question = Question.query.filter_by(id=question_data['id']).first()
            question.question = question_data['question']
            question.description = question_data['description']
            question.type =  question_data['type']
        
        elif action == 'add':
            print("Adding question")
            db.session.add(Question(question=question_data['question'], description=question_data['description'], type=question_data['type']))
        
        elif action == 'delete':
            print("Deleting question")
            question = Question.query.filter_by(id=question_data['id']).first()
            print(question)
            db.session.delete(question)
            
        else:
            result = False
    
        if result:
            db.session.commit()    
    
    
    return jsonify({'result': result})

@app.route('/api/admin/users', methods=['POST'])
def users():

    print("Processing User update")
    result = True
    if session['user_type'] != 'admin':
        result = False
    else:
        json_data = request.json
        print(json_data)
        action = json_data['action']
        user_data = json_data['data']
    
        if action == 'update':
            print("Updating user")
            user = User.query.filter_by(id=user_data['id']).first()
            user.name = user_data['name']
            user.email = user_data['email']
            user.user_type = user_data['user_type']
            user.can_rate = user_data['can_rate']
            user.activated = user_data['activated']
            if user_data['password'] != "not-changed":
                user.password = bcrypt.generate_password_hash(user_data['password'])
            
        
        elif action == 'add':
            print("Adding user")
            db.session.add( User( name=user_data['name'], email=user_data['email'], user_type=user_data['user_type'], password=user_data['password'], can_rate=user_data['can_rate'], activated=user_data["activated"], activation_key=str(uuid.uuid4()) ) )
        
        elif action == 'delete':
            print("Deleting user")
            user = User.query.filter_by(id=user_data['id']).first()
            print(user)
            db.session.delete(user)
            
        else:
            result = False
    
        if result:
            db.session.commit()    
    
    
    return jsonify({'result': result})

@app.route('/api/reset', methods=['POST'])
def passwordreset():
    print "Password reset processing"

    email  = request.json['email']

    user = User.query.filter_by(email=email).first()

    result = False

    if user is not None:

        if request.json.has_key('key') and request.json.has_key('password'):
            key = request.json['key']
            password = request.json['password']
            
            if key == user.activation_key and password is not None:
                user.activation_key = "used"
                user.password = bcrypt.generate_password_hash(password)
                db.session.commit()
                result = True
                print "Password reset complete"
            else:
                print "Activation key for " + email + " does not match"

        else:

            print "Sending reset password email"

            actkey = str(uuid.uuid4())

            user.activation_key = actkey
            db.session.commit() 

            reseturl = app.config['WEBSITE_HOST'] + "/#/passwordreset/" + email + "/" + actkey

            email_content = {'firstname': user.name.split(" ")[0], 'reseturl': reseturl}
    
            send_email(email, "Writefest password reset", "passwordreset", email_content)

            result = True
    else:
        print("Email " + email + " not found on any account")

    return jsonify({'result': result})


@app.route('/activate/<email>/<key>', methods=['GET'])
def userconfirm(email, key):
    user = User.query.filter_by(email=email).first()

    result = False


    if user is not None and user.activation_key == key:
        print "Valid activation call"
        user.activation_key = "used"
        user.activated = True
        db.session.commit()
        result = True

    else:
        print "Invalid activation call"

    if result:
        return redirect(app.config['WEBSITE_HOST'] + "/#/login/activated", code=302)
    else:
        return redirect(app.config['WEBSITE_HOST'] + "/#/error/invalid-activation", code=302)



@app.route('/api/admin/seasons', methods=['POST'])
def seasons():

    print("Processing Season add")
    result = True
    if session['user_type'] != 'admin':
        result = False
    else:
        json_data = request.json
        print(json_data)
        action = json_data['action']
        season_data = json_data['data']
    
        if action == 'update':
            print("Updating season")
            season = Season.query.filter_by(id=season_data['id']).first()
            season.start_date = datetime.datetime.strptime(season_data['start_date'], '%b %d, %Y')
            season.end_date = datetime.datetime.strptime(season_data['end_date'], '%b %d, %Y')
            
        
        elif action == 'add':
            print("Adding season")
            
            startdate = datetime.datetime.strptime(season_data['start'], '%b %d, %Y')
            enddate = datetime.datetime.strptime(season_data['end'], '%b %d, %Y')
            print("Start: (" +  season_data['start'] + ") " + str(startdate) + " End: (" + season_data['end'] + ") " + str(enddate))

            db.session.add(Season(year=season_data['year'], start_date=startdate, end_date=enddate))
        
        elif action == 'delete':
            print("Deleting season")
            season = Season.query.filter_by(id=season_data['id']).first()
            print(season)
            db.session.delete(season)
            
        else:
            result = False
    
        if result:
            db.session.commit()    
    
    
    return jsonify({'result': result})



@app.route('/api/admin')
def admin():
    
    if session['user_type'] != 'admin':
        return jsonify({'result': False})

    seasons = Season.query.all()
    users = User.query.all()
    questions = Question.query.all()
    usertyes = UserType.query.all()

    result = {
                'result': True, 
                'users': [ob.dump() for ob in users],
                'usertypes': [ob.dump() for ob in usertyes],
                'seasons': [ob.dump() for ob in seasons],
                'questions': [ob.dump() for ob in questions]
            }
    
    return jsonify(result)
    
    
@app.route('/api/script', methods=['GET', 'POST'])
def script():
    
    
    if session['user_type'] not in ['admin', 'producer']:
        return jsonify({'result': False})

    if request.method == 'GET':
        files = File.query.all()
        scripts = Script.query.all()
        statuses = ScriptStatus.query.all()
        seasons = Season.query.all()
        
        author_id = UserType.query.filter_by(type='author').first().id
        
        author_users = User.query.filter_by(user_type=author_id)
        
        result = {
                'result': True, 
                'scripts': [ob.dump() for ob in scripts],
                'files': [ob.dump() for ob in files],
                'statuses': [ob.dump() for ob in statuses],
                'seasons': [ob.dump() for ob in seasons],
                'authors': [{'id': -1, 'name': 'New'}] + [ob.dump() for ob in author_users]
            }
        return jsonify(result)
    else:
        print("Handling script post")
        json_data = request.json
        action = json_data['action']
        scriptdata = json_data['data']
   
        print(action)
        print(scriptdata) 
        result = False
        
        dbfilename = None
        author = scriptdata['author']
        
        if author == -1:
            print("Creating new author")
            author_user = User(name=scriptdata['user_name'], email=scriptdata['user_email'])
            db.session.add(author_user)
            db.session.commit()
            print(author_user)
            author = author_user.id
            
        if scriptdata.has_key('tempfilename'):
            #move the file to its final name
            authorfolder = os.path.join(app.config['UPLOAD_PATH'], str(author))
            if not os.path.exists(authorfolder):
                os.mkdir(authorfolder)
            
            sourcefilename = os.path.join(app.config['UPLOAD_PATH'], scriptdata['tempfilename'])
            destfilename = os.path.join(authorfolder, scriptdata['filename'])
            
            if os.path.exists(destfilename):
                destfilename = unique_file_name(destfilename)
            
            print("Renaming '{0}' to '{1}'".format(sourcefilename, destfilename))
            os.rename(sourcefilename, destfilename)
            
            dbfilename = os.path.relpath(destfilename, app.config['UPLOAD_PATH'])
        
        
        if action == 'add':
            print("Adding new script")
        
            script = Script(author=author, season=scriptdata['season'], status=scriptdata['status'], name=scriptdata['name'], pageCount=scriptdata['pageCount'])
            db.session.add(script)
            db.session.commit()
            print(script)
            
            
            file = File(script=script.id, filename=dbfilename)
            db.session.add(file)
            print(file)
        
        
            result = True
            
        elif action == 'delete':
            print("Deleting script")
            script = Script.query.filter_by(id=scriptdata['id']).first()
            #TODO: delete any files for this script
            print(script)
            db.session.delete(script)
            result = True
        
        elif action == 'update':
            print("Updating script")
            script = Script.query.filter_by(id=scriptdata['id']).first()
            
            script.name = scriptdata['name']
            script.author = scriptdata['author']
            script.season = scriptdata['season']
            script.status = scriptdata['status']
            script.pageCount = scriptdata['pageCount']
            if dbfilename:
                file = File(script=script.id, filename=dbfilename)
                db.session.add(file)
            
            result = True
        
        if result:
            db.session.commit()
        
        return jsonify({'result': result})

@app.route('/api/file', methods=['POST'])
def file():
    print("File upload")            
    file = request.files['file']
    print(file)
    print(file.filename)
    filename = str(uuid.uuid4()) + ".tmp"
    file.save(os.path.join(app.config['UPLOAD_PATH'], filename))
    return jsonify({'result': True, 'filename': filename})  
    
@app.route('/api/rating', methods=['GET', 'POST'])
def rating():
    result = False

    if session['user_type'] not in ['admin', 'producer', 'user']:
        return jsonify({'result': False})

    if request.method == 'GET':
        
        curSeason = Season.query.order_by('-id').first()
        
        ratableStatuses = ScriptStatus.query.filter_by(ratable = True).all()

        statusList = []
        for status in ratableStatuses:
            statusList.append(status.id)
    
        scripts = Script.query.filter_by(season = curSeason.id).filter(Script.status.in_(statusList)).all()
        
        files = File.query.all()

        ratings = Rating.query.filter_by(user_id=session['userid']).all()
        
        comments = Comments.query.filter_by(user_id=session['userid']).all()
        
        questions = Question.query.all()
                
        result = {
                'result': True, 
                'scripts': [ob.dumpNames() for ob in scripts],
                'files': [ob.dump() for ob in files],
                'ratings': [ob.dump() for ob in ratings],
                'questions': [ob.dump() for ob in questions],
                'comments': [ob.dump() for ob in comments]
            }
        return jsonify(result)
    else:
        print("Handling rating post")
        json_data = request.json
        script = json_data['script']
        ratingdata = json_data['data']
   
        print(script)
        print(ratingdata)
        
        print("Saving comments")
        comment = Comments.query.filter_by(user_id=session['userid'], script_id=script).first()
        
        notes = ""
        feedback = ""
        duration = None

        if 'notes' in ratingdata:
            notes = ratingdata['notes']
        if 'feedback' in ratingdata:    
            feedback = ratingdata['feedback']
        if 'duration' in ratingdata:
            duration = ratingdata['duration']

        if comment:
            #print("old: " + unicode(comment))
            comment.notes = notes
            comment.feedback = feedback
            comment.duration = ratingdata['duration']
        else:
            comment = Comments(user=session['userid'], script=script, notes=notes, feedback=feedback, duration=duration)
            db.session.add(comment)
        #print("new: " + unicode(comment))
        
        for key in ratingdata:
            print("Question: " + key);
        
            if key in ['notes', 'feedback', 'duration']:
                #skip them - handled seperately
                pass
                
            else:
        
                rating = Rating.query.filter_by(user_id=session['userid'], script_id=script, question_id=key).first()
            
                if rating:
                    print("old: " + unicode(rating))
                
                    if (ratingdata[key] is None):
                        print("new: deleted")
                        db.session.delete(rating)
                        rating = None
                    else:
                        rating.rating = ratingdata[key]
                else:
                    if (ratingdata[key] is not None):
                        rating = Rating(user=session['userid'], script=script, question=key, rating=ratingdata[key])
                        db.session.add(rating)
            
            print("new: " + unicode(rating))
            
         
        result = True
        
        if result:
            db.session.commit()
        
        
        
    return jsonify({'result': result})


@app.route('/api/producer')
def producer():
    result = False

    if session['user_type'] not in ['admin', 'producer']:
        return jsonify({'result': False})

    users = User.query.filter_by(can_rate = True).all()
    
    authors = User.query.filter_by(user_type = 1).all()

    finalQId = Question.query.filter_by(type = 2).first().id

    ratings = Rating.query.all()

    curSeason = Season.query.order_by('-id').first()

    ratableStatuses = ScriptStatus.query.filter_by(ratable = True).all()
    
    comments = Comments.query.all();

    statusList = []
    for status in ratableStatuses:
        statusList.append(status.id)

    scripts = Script.query.filter_by(season = curSeason.id).filter(Script.status.in_(statusList)).all()


    result = {
                'result': True, 
                'users': [ob.dump() for ob in users],
                'ratings': [ob.dump() for ob in ratings],
                'scripts': [ob.dump() for ob in scripts],
                'comments': [ob.dump() for ob in comments],
                'finalQId': finalQId,
                'authors': [ob.dump() for ob in authors]
            }
    
    return jsonify(result)
