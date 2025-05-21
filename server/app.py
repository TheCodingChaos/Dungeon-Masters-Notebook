from flask import request, session
from flask_restful import Resource, abort
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from config import app, db, api
from models import User, Game, Player, Session, Character
from schemas import UserSchema, GameSchema, PlayerSchema, SessionSchema, CharacterSchema
from marshmallow import ValidationError

game_schema = GameSchema()
games_schema = GameSchema(many=True)
player_schema = PlayerSchema()
session_schema = SessionSchema()
character_schema = CharacterSchema()
characters_schema = CharacterSchema(many=True)



@app.before_request
def login_check():
    if request.method == 'OPTIONS':
        return
    open_paths = ['/signup', '/login', '/check_session', '/logout']
    
    if request.path == '/favicon.ico' or request.endpoint == 'static':
        return

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
        user = db.session.get(User, user_id)
        if not user:
            abort(404, message=f"User with id {user_id} not found")
        return UserSchema().dump(user), 200

class Logout(Resource):
    def delete(self):
        session['user_id'] = None
        return {}, 204

class NewGame(Resource):
    def get(self):
        user_id = session.get('user_id')
        stmt = select(Game).filter_by(user_id=user_id)
        result = db.session.execute(stmt)  # execute SQL statement
        games = result.scalars().all()     # load ORM objects
        return games_schema.dump(games), 200

    def post(self):
        data = request.get_json() or {}
        # Extract nested assignments if provided
        assignments = data.pop('assignments', [])
        data['user_id'] = session.get('user_id')
        try:
            loaded = game_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_game = Game(**loaded)
        db.session.add(new_game)
        # If assignments exist, flush game then handle nested creates
        if assignments:
            db.session.flush()
            db.session.refresh(new_game)
            for assign in assignments:
                # existing player case
                if 'player_id' in assign:
                    char_info = assign.get('character', {})
                    char_info['player_id'] = assign['player_id']
                    char_info['game_id'] = new_game.id
                    try:
                        loaded_char = character_schema.load(char_info)
                    except ValidationError as err:
                        db.session.rollback()
                        return {'errors': err.messages}, 400
                    db.session.add(Character(**loaded_char))
                # new player + character case
                elif 'player' in assign:
                    player_info = assign['player'] or {}
                    try:
                        loaded_player = player_schema.load(player_info)
                    except ValidationError as err:
                        db.session.rollback()
                        return {'errors': err.messages}, 400
                    new_player = Player(**loaded_player)
                    db.session.add(new_player)
                    db.session.flush()
                    db.session.refresh(new_player)
                    char_info = assign.get('character', {})
                    char_info['player_id'] = new_player.id
                    char_info['game_id'] = new_game.id
                    try:
                        loaded_char = character_schema.load(char_info)
                    except ValidationError as err:
                        db.session.rollback()
                        return {'errors': err.messages}, 400
                    db.session.add(Character(**loaded_char))
                # otherwise skip
        # finalize transaction
        db.session.commit()
        return game_schema.dump(new_game), 201

class EditGame(Resource):
    def patch(self, game_id):
        game = db.session.get(Game, game_id)
        if not game:
            abort(404, message=f"Game with id {game_id} not found")
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
        game = db.session.get(Game, game_id)
        if not game:
            abort(404, message=f"Game with id {game_id} not found")
        db.session.delete(game)
        db.session.commit()
        return '', 204

class NewPlayer(Resource):
    def post(self, game_id):
        game = db.session.get(Game, game_id)
        if not game:
            abort(404, message=f"Game with id {game_id} not found")
        if game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        data = request.get_json()
        try:
            loaded = player_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_player = Player(**loaded)
        db.session.add(new_player)
        db.session.commit()
        return player_schema.dump(new_player), 201

class NewPlayer(Resource):
    """
    Resource for creating and listing players independently of games.
    POST /players  -> create a new unattached player.
    GET /players   -> list all players for the current user.
    """
    def get(self):
        # Optionally implement listing if desired
        user_id = session.get('user_id')
        players = db.session.query(Player).filter_by(user_id=user_id).all()
        return PlayerSchema.dump(players), 200

    def post(self):
        # Create a new Player alone (no game assignment)
        data = request.get_json() or {}
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
        player = db.session.get(Player, player_id)
        if not player:
            abort(404, message=f"Player with id {player_id} not found")
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
        player = db.session.get(Player, player_id)
        if not player:
            abort(404, message=f"Player with id {player_id} not found")
        db.session.delete(player)
        db.session.commit()
        return '', 204

class NewSession(Resource):
    def post(self, game_id):
        game = db.session.get(Game, game_id)
        if not game:
            abort(404, message=f"Game with id {game_id} not found")
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
        sess = db.session.get(Session, session_id)
        if not sess:
            abort(404, message=f"Session with id {session_id} not found")
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
        sess = db.session.get(Session, session_id)
        if not sess:
            abort(404, message=f"Session with id {session_id} not found")
        if sess.game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401
        db.session.delete(sess)
        db.session.commit()
        return '', 204

class NewCharacter(Resource):
    def post(self, player_id):
        player = db.session.get(Player, player_id)
        if not player:
            abort(404, message=f"Player with id {player_id} not found")
        data = request.get_json()
        data['player_id'] = player_id
        try:
            loaded = character_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_char = Character(**loaded)
        db.session.add(new_char)
        db.session.commit()
        return character_schema.dump(new_char), 201
        
class EditCharacter(Resource):
    def patch(self, character_id):
        char = db.session.get(Character, character_id)
        if not char:
            abort(404, message=f"Character with id {character_id} not found")
        updates = request.get_json()
        try:
            loaded = character_schema.load(updates, partial=True)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        for key, value in loaded.items():
            setattr(char, key, value)
        db.session.commit()
        return character_schema.dump(char), 200
    
    def delete(self, character_id):
        char = db.session.get(Character, character_id)
        if not char:
            abort(404, message=f"Character with id {character_id} not found")
        db.session.delete(char)
        db.session.commit()
        return '', 204
    
class NewPlayerAndCharacter(Resource):
    def post(self, game_id):
        # Use SQLAlchemy 2.0 session.get and abort on missing game
        game = db.session.get(Game, game_id)
        if not game:
            abort(404, message=f"Game with id {game_id} not found")
        if game.user_id != session.get('user_id'):
            return {'error': '401 unauthorized'}, 401

        # 2) Pull JSON and separate player vs. character data
        data = request.get_json()
        char_data = data.pop('character', None)

        # 3) Validate & create the player
        try:
            player_loaded = player_schema.load(data)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        new_player = Player(**player_loaded)
        db.session.add(new_player)
        db.session.flush()
        # Ensure new_player.id is fully loaded
        db.session.refresh(new_player)

        # 4) If nested char_data was provided, validate & create the character
        new_char = None
        if char_data:
            # Inject foreign keys
            char_data['player_id'] = new_player.id
            char_data['game_id']   = game_id
            try:
                char_loaded = character_schema.load(char_data)
            except ValidationError as err:
                db.session.rollback()               # undo player insert
                return {'errors': err.messages}, 400
            new_char = Character(**char_loaded)
            db.session.add(new_char)

        # 5) Commit both creations atomically
        db.session.commit()

        # 6) Build the response
        result = player_schema.dump(new_player)
        # Remove the full characters list so we only return the new character
        result.pop('characters', None)
        if new_char:
            result['character'] = character_schema.dump(new_char)
        return result, 201


# Register RESTful resources
api.add_resource(Signup, '/signup')
api.add_resource(Login, '/login')
api.add_resource(CheckSession, '/check_session')
api.add_resource(Logout, '/logout')
api.add_resource(NewGame, '/games')
api.add_resource(EditGame, '/games/<int:game_id>')
api.add_resource(NewPlayer, '/players')
api.add_resource(EditPlayer, '/players/<int:player_id>')
api.add_resource(NewSession, '/games/<int:game_id>/sessions')
api.add_resource(EditSession, '/sessions/<int:session_id>')
api.add_resource(NewCharacter, '/players/<int:player_id>/characters')
api.add_resource(EditCharacter, '/characters/<int:character_id>')
api.add_resource(NewPlayerAndCharacter, '/games/<int:game_id>/players')
# Removed RPC-style assignments endpoint; use POST /games instead

if __name__ == '__main__':
    app.run(port=5555, debug=True)