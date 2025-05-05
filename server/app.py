from flask import request, session, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from config import app, db, api
#from models import
#from schemas import

@app.before_request
def login_check():
    if request.method == 'OPTIONS':
        return
    open_access_list = []

    if (request.endpoint) not in open_access_list and (not session.get('user_id')):
        return {'error': '401 unauthorized'}, 401