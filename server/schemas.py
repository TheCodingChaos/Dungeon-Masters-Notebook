from config import ma, db
from marshmallow import fields, validate, pre_load
from models import User, Game, Player, Session, Character

class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    username = ma.auto_field(required=True)
    games = fields.List(fields.Nested('GameSchema'), dump_only=True)

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
    players = fields.List(fields.Nested('PlayerSchema'), dump_only=True)
    sessions = fields.List(fields.Nested('SessionSchema'), dump_only=True)

class PlayerSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Player
        sqla_session = db.session
        include_relationships = True
        include_fk = True
    id = ma.auto_field(dump_only=True)
    name = ma.auto_field(required=True)
    summary = ma.auto_field()
    user_id = ma.auto_field()
    games = fields.List(fields.Nested('GameSchema'), dump_only=True)
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