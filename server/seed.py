from random import randint, choice as rc
from faker import Faker
from app import app
from models import db, User

if __name__ == '__main__':
    fake = Faker()
    with app.app_context():
        print("Deleting old data...")
        User.query.delete()
        db.session.commit()

        print("Creating users...")
        users = []
        for _ in range(5):
            username = fake.user_name()
            user = User(username=username)
            user.password_hash = "password123"
            users.append(user)

        db.session.add_all(users)
        db.session.commit()
        print("Seeded users!")