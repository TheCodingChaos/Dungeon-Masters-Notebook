from flask import Flask, render_template
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from sqlalchemy import MetaData
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__,
            static_url_path='',
            static_folder='../client/build',
            template_folder='../client/build'
            )
app.config['SECRET_KEY'] = os.getenv["Secret_Key"]
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.compact = False

metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})
db = SQLAlchemy(metadata=metadata)
migrate = Migrate(app=app, db=db)
db.init_app(app)

bcrypt = Bcrypt(app)

api = Api(app)

CORS(app, supports_credentials=True)

ma = Marshmallow(app)

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")