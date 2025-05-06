from config import ma
from marshmallow import Schema, fields, validate

class UserSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3))
    games = fields.List(fields.Nested('GameSchema'), dump_only=True)

class GameSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1))
    description = fields.Str()
    system = fields.Str(required=True, validate=validate.Length(min=1))
    start_date = fields.Date(allow_none=True)
    setting = fields.Str(allow_none=True)
    status = fields.Str(required=True)
    user_id = fields.Int(required=True)
