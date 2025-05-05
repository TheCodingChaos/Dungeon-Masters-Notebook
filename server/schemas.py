#from models import 
from config import ma
from marshmallow import Schema, fields, validate

class UserSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3))
