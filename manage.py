# manage.py

from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from project import app, db
from project.models import User, UserType, Question, Season, ScriptStatus, Script, File
import datetime
import time


migrate = Migrate(app, db)
manager = Manager(app)

# migrations
manager.add_command('db', MigrateCommand)


@manager.command
def create_db():
    """Creates the db tables."""
    db.create_all()
    db.session.add(UserType(type='author'))
    db.session.add(UserType(type='user'))
    db.session.add(UserType(type='producer'))
    db.session.add(UserType(type='admin'))
    db.session.add(ScriptStatus(status='Submitted', description='Script has been submitted'))
    db.session.add(ScriptStatus(status='Long List', description='Script has been included on the Long List for consideration by the judges', ratable=True))
    db.session.add(ScriptStatus(status='Short List', description='Script has been short listed for inclusion', ratable=True))
    db.session.add(ScriptStatus(status='Included', description='Script has been selected for inclusion in this season', ratable=True))
    db.session.add(ScriptStatus(status='Disqualified', description='Script has been disqualified - see notes for details'))
    db.session.commit()


@manager.command
def drop_db():
    """Drops the db tables."""
    db.drop_all()


@manager.command
def create_users():
    """Creates test users."""
    db.session.add(User(name='Test Author', email='author@writefest.com', password='author', user_type=1))
    db.session.add(User(name='Test User', email='user@writefest.com', password='user', user_type=2))
    db.session.add(User(name='Test Producer', email='producer@writefest.com', password='producer', user_type=3))
    db.session.add(User(name='Test Admin', email='admin@writefest.com', password='admin', user_type=4))
    db.session.commit()


@manager.command
def create_data():
    """Creates sample data."""
    db.session.add(Season(year=2017, start_date=datetime.date(2016, 11, 1), end_date=datetime.date(2017, 5, 1)))
    db.session.add(Question(question='Should we perform it?', type=2))
    db.session.add(Question(question='Opening'))
    db.session.add(Question(question='Dialogue'))
    db.session.add(Question(question='Characters'))
    db.session.add(Question(question='Humour'))
    db.session.add(Question(question='Conflict'))
    db.session.add(Question(question='Dramatic content'))
    db.session.add(Question(question='Storyline'))
    db.session.add(Question(question='Standard of writing', description='(not spelling and grammar)'))
    db.session.add(Question(question='How well does it fulfil its intended style?'))
    db.session.add(Question(question='How well did it engage you?'))
    db.session.add(Question(question='Originality'))
    db.session.add(Question(question='Ending'))
    db.session.add(Question(question='Suitability for WriteFest', description='(i.e. can it be performed with little or no set)'))
    
    db.session.add(Script(name='Test Script', author=1, season=1, status=1,))
    db.session.add(Script(name='Another Script', author=1, season=1, status=2,))
    db.session.add(File(filename='1/test.pdf', script=1))
    time.sleep(2)
    db.session.add(File(filename='1/test_v2.pdf', script=1))
    time.sleep(1)
    db.session.add(File(filename='1/test2.pdf', script=2))
    db.session.commit()


if __name__ == '__main__':
    manager.run()
