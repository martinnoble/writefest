# manage.py

from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from project import app, db
from project.models import User, UserType, Question, Season, ScriptStatus, Script, File, Rating, Comments
import datetime
import time
import random
from loremipsum import get_sentences


migrate = Migrate(app, db)
manager = Manager(app)

# migrations
manager.add_command('db', MigrateCommand)


@manager.command
def create_db():
    """Creates the db tables."""
    db.create_all()
    db.session.add(User(name='Admin', email='admin@writefest.com', password='admin', user_type=4))
    db.session.add(UserType(type='author'))
    db.session.add(UserType(type='user'))
    db.session.add(UserType(type='producer'))
    db.session.add(UserType(type='admin'))
    db.session.add(ScriptStatus(status='Submitted', description='Script has been submitted'))
    db.session.add(ScriptStatus(status='Under Consideration', description='Script has been included for consideration by the judges', ratable=True))
    db.session.add(ScriptStatus(status='Selected', description='Script has been short listed for inclusion'))
    db.session.add(ScriptStatus(status='Not Selected', description='Script has been selected for inclusion in this season'))
    db.session.add(ScriptStatus(status='Disqualified', description='Script has been disqualified - see notes for details'))
    db.session.commit()


@manager.command
def drop_db():
    """Drops the db tables."""
    db.drop_all()


@manager.command
def create_users():
    """Creates test users."""
    db.session.add(User(name='First Author', email='author1@writefest.com', password='author', user_type=1))
    db.session.add(User(name='Second Author', email='author2@writefest.com', password='author', user_type=1))
    db.session.add(User(name='Third Author', email='author3@writefest.com', password='author', user_type=1))
    db.session.add(User(name='First User', email='user1@writefest.com', password='user', user_type=2, can_rate=True))
    db.session.add(User(name='Second User', email='user2@writefest.com', password='user', user_type=2, can_rate=True))
    db.session.add(User(name='Third User', email='user3@writefest.com', password='user', user_type=2, can_rate=True))
    db.session.add(User(name='Fourth User', email='user4@writefest.com', password='user', user_type=2, can_rate=True))
    db.session.add(User(name='Fifth User', email='user5@writefest.com', password='user', user_type=2, can_rate=True))
    db.session.add(User(name='Producer', email='producer@writefest.com', password='producer', user_type=3, can_rate=True))
    db.session.commit()


@manager.command
def create_data():
    """Creates sample data."""
    db.session.add(Season(year=2017, start_date=datetime.date(2016, 11, 1), end_date=datetime.date(2017, 5, 1)))
    db.session.add(Question(question='Should we perform it?', type=2))
    db.session.add(Question(question='Opening'))
    db.session.add(Question(question='Standard of Dialogue'))
    db.session.add(Question(question='Characters'))
    db.session.add(Question(question='Storyline'))
    db.session.add(Question(question='How well does it fulfil its intended style?', description='(eg Comedy, Drama etc)'))
    db.session.add(Question(question='How well did it engage you?'))
    db.session.add(Question(question='Originality'))
    db.session.add(Question(question='Ending'))
    db.session.add(Question(question='Suitability for WriteFest', description='(i.e. can it be performed with little or no set)'))

    sentences = get_sentences(200)
    users = [5,6,7,8,9,10]
    
    scriptCount = 4

    for script in range(1,scriptCount + 1):
        if random.randint(0, 100) > 90:
            status = 1
        else:
            status = 2
            
        db.session.add(Script(name=random.choice(sentences), author=random.randint(1, 3), season=1, status=status, pageCount=random.randint(1, 10)))
        db.session.add(File(filename='1/test.pdf', script=script))
        
        for user in users:
            if random.randint(0, 100) < 95:        
                db.session.add(Rating(question=1, user=user, script=script, rating=random.randint(0, 3)))
                db.session.add(Comments(user=user, script=script, duration=random.randint(2, 20), notes=random.choice(sentences), feedback=random.choice(sentences) ))    
                for question in range(2,15):
                    db.session.add(Rating(question=question, user=user, script=script, rating=random.randint(0, 4)))
    
    db.session.commit()


if __name__ == '__main__':
    manager.run()
