from config import ma, db
from marshmallow import fields, validate, pre_load
from models import User, Game, Player, Session, Character
from collections import defaultdict

class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    username = ma.auto_field(required=True)
    # Use a method to get unique players across all games
    players = fields.Method('get_unique_players', dump_only=True)
    # Include full game details, with nested players->characters and sessions
    games = fields.List(fields.Nested('GameSchema'), dump_only=True)

    def get_unique_players(self, obj):
        seen = set()
        unique_players = []
        for game in getattr(obj, 'games', []) or []:
            for player in getattr(game, 'players', []) or []:
                if player and player.id not in seen:
                    seen.add(player.id)
                    unique_players.append(player)
        from schemas import PlayerSchema
        return PlayerSchema(exclude=('characters',), many=True).dump(unique_players)

class GameSchema(ma.SQLAlchemySchema):
    @pre_load
    def fix_empty_date(self, data, **kwargs):
        if data.get("start_date", None) == "":
            data["start_date"] = None
        return data

    class Meta:
        model = Game
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    title = ma.auto_field(required=True)
    description = ma.auto_field()
    system = ma.auto_field(required=True)
    start_date = ma.auto_field()
    setting = ma.auto_field()
    status = ma.auto_field(required=True)
    user_id = ma.auto_field()
    players = fields.Method('get_game_players', dump_only=True)
    sessions = fields.List(fields.Nested('SessionSchema'), dump_only=True)

    def get_game_players(self, obj):
        grouped = defaultdict(list)
        for char in getattr(obj, 'characters', []) or []:
            if char.player:
                grouped[char.player].append(char)
        # Serialize each player's characters
        from schemas import CharacterSchema
        return [
            {
                'id': player.id,
                'name': player.name,
                'summary': player.summary,
                'characters': CharacterSchema(many=True).dump(chars)
            }
            for player, chars in grouped.items()
        ]

class PlayerSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Player
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    name = ma.auto_field(required=True)
    summary = ma.auto_field()
    # Removed games field to prevent recursion
    characters = fields.List(fields.Nested('CharacterSchema'), dump_only=True)

class SessionSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Session
        sqla_session = db.session
        include_relationships = False
        include_fk = True
    id = ma.auto_field(dump_only=True)
    date = ma.auto_field(required=True)
    summary = ma.auto_field()
    game_id = ma.auto_field()

class CharacterSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Character
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    name = ma.auto_field(required=True)
    character_class = ma.auto_field(required=True)
    level = ma.auto_field(required=True)
    icon = ma.auto_field()
    is_active = ma.auto_field()
    player_id = ma.auto_field()
    game_id = ma.auto_field()