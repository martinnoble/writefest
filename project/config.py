# project/config.py

import os
basedir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig(object):
    SECRET_KEY = 'my_precious'
    DEBUG = True
    BCRYPT_LOG_ROUNDS = 13
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'dev.sqlite')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads'
    UPLOAD_PATH = os.path.join(basedir, 'uploads')
    LOG_PATH = os.path.join(basedir, '../logs')
    ACCESS_LOG = os.path.join(LOG_PATH, 'access.log')
    WRITEFEST_LOG = os.path.join(LOG_PATH, 'writefest.log')

    LOGGING_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

