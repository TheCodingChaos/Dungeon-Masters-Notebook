from flask import request, session
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from config import app, db, api
from models import User, Game, Player, Session
from schemas import UserSchema, GameSchema, PlayerSchema
from schemas import SessionSchema
from marshmallow import ValidationError

game_schema = GameSchema()
games_schema = GameSchema(many=True)
player_schema = PlayerSchema()
session_schema = SessionSchema()



@app.before_request
def login_check():
    if request.method == 'OPTIONS':
        return
    open_paths = ['/signup', '/login', '/check_session', '/logout']
    if request.path in open_paths:
        return
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

class NewGame(Resource):
    def get(self):
        user_id = session.get('user_id')
        games = Game.query.filter_by(user_id=user_id).all()
        return games_schema.dump(games), 200

    def post(self):
        data = request.get_json()
        data['user_id'] = session.get('user_id')
        try:
            loaded = game_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_game = Game(**loaded)
        db.session.add(new_game)
        db.session.commit()
        return game_schema.dump(new_game), 201

class EditGame(Resource):
    def patch(self, game_id):
        game = Game.query.get_or_404(game_id)
        updates = request.get_json()
        try:
            loaded_updates = game_schema.load(updates, partial=True)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        for key, value in loaded_updates.items():
            setattr(game, key, value)
        db.session.commit()
        return game_schema.dump(game), 200

    def delete(self, game_id):
        game = Game.query.get_or_404(game_id)
        db.session.delete(game)
        db.session.commit()
        return '', 204

class NewPlayer(Resource):
    def post(self, game_id):
        game = Game.query.get_or_404(game_id)
        if game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        data = request.get_json()
        data['game_id'] = game_id
        data['user_id'] = session.get('user_id')
        try:
            loaded = player_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_player = Player(**loaded)
        db.session.add(new_player)
        db.session.commit()
        return player_schema.dump(new_player), 201

class EditPlayer(Resource):
    def patch(self, player_id):
        player = Player.query.get_or_404(player_id)
        if player.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        updates = request.get_json()
        try:
            loaded_updates = player_schema.load(updates, partial=True)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        for key, value in loaded_updates.items():
            setattr(player, key, value)
        db.session.commit()
        return player_schema.dump(player), 200

    def delete(self, player_id):
        player = Player.query.get_or_404(player_id)
        if player.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        db.session.delete(player)
        db.session.commit()
        return '', 204

class NewSession(Resource):
    def post(self, game_id):
        game = Game.query.get_or_404(game_id)
        if game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        data = request.get_json()
        data['game_id'] = game_id
        try:
            loaded = session_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_session = Session(**loaded)
        db.session.add(new_session)
        db.session.commit()
        return session_schema.dump(new_session), 201

class EditSession(Resource):
    def patch(self, session_id):
        sess = Session.query.get_or_404(session_id)
        if sess.game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        updates = request.get_json()
        try:
            loaded = session_schema.load(updates, partial=True)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        for key, value in loaded.items():
            setattr(sess, key, value)
        db.session.commit()
        return session_schema.dump(sess), 200

    def delete(self, session_id):
        sess = Session.query.get_or_404(session_id)
        if sess.game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        db.session.delete(sess)
        db.session.commit()
        return '', 204


# Register RESTful resources
api.add_resource(Signup, '/signup')
api.add_resource(Login, '/login')
api.add_resource(CheckSession, '/check_session')
api.add_resource(Logout, '/logout')
api.add_resource(NewGame, '/games')
api.add_resource(EditGame, '/games/<int:game_id>')
api.add_resource(NewPlayer, '/games/<int:game_id>/players')
api.add_resource(EditPlayer, '/players/<int:player_id>')
api.add_resource(NewSession, '/games/<int:game_id>/sessions')
api.add_resource(EditSession, '/sessions/<int:session_id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)