from flask import Flask, render_template, request
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

# Determine if we're in production
is_prod = os.getenv('FLASK_ENV') == 'production'

app = Flask(__name__,
            static_folder='../client/build',
            template_folder='../client/build'
            )

# Configuration
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev_secret_key")

# Database configuration
if is_prod:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    if not app.config['SQLALCHEMY_DATABASE_URI']:
        raise ValueError("No DATABASE_URI set for Production environment")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///app.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.json.compact = False

metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})
db = SQLAlchemy(metadata=metadata)
migrate = Migrate(app=app, db=db)
db.init_app(app)

bcrypt = Bcrypt(app)

api = Api(app)

# Configure CORS with environment-specific origins
allowed_origins = [
    "https://dungeon-masters-notebook.onrender.com",  # Production frontend
]

# Add development origins if not in production
if not is_prod:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:5555",
    ])

CORS(app, 
     supports_credentials=True, 
     origins=allowed_origins,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])

ma = Marshmallow(app)

@app.errorhandler(404)
def not_found(e):
    # If the request accepts HTML, assume it's a frontend route.
    # Serve index.html with a 200 OK status to let client-side router handle it.
    if 'text/html' in request.accept_mimetypes:
        return render_template("index.html"), 200
    # Otherwise, it's likely an API call that wasn't found.
    return {'error': 'Not found.'}, 404