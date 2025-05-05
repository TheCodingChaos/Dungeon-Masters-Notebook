from random import randint, choice as rc
from faker import Faker
from app import app
from models import db

if __name__ =='__main__':
    fake = Faker()
    with app.app_context():
        pass