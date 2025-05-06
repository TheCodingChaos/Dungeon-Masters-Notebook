from flask import request, session, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from config import app, db, api
from models import User
from schemas import UserSchema


@app.before_request
def login_check():
    # Allow CORS preflight through
    if request.method == 'OPTIONS':
        return
    # Public endpoints that don't require authentication
    open_paths = ['/signup', '/login', '/check_session', '/logout']
    if request.path in open_paths:
        return
    # Block all others without a valid session
    if not session.get('user_id'):
        return {'error': '401 unauthorized'}, 401

class Signup(Resource):
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return {'error': 'Username and password required'}, 400

        user = User(username=username)
        user.password_hash = password
        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {'error': 'Username already exists'}, 409

        session['user_id'] = user.id
        return UserSchema().dump(user), 201

class Login(Resource):
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if user and user.authenticate(password):
            session['user_id'] = user.id
            return UserSchema().dump(user), 200
        return {'error': 'Invalid username or password'}, 401

class CheckSession(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': '401 unauthorized'}, 401
        user = User.query.get(user_id)
        return UserSchema().dump(user), 200

class Logout(Resource):
    def delete(self):
        session['user_id'] = None
        return {}, 204

api.add_resource(Signup, '/signup')
api.add_resource(Login, '/login')
api.add_resource(CheckSession, '/check_session')
api.add_resource(Logout, '/logout')

if __name__ == '__main__':
    app.run(port=5555, debug=True)