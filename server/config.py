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

# Load environment variables
load_dotenv()

# Environment setup
is_prod = os.getenv('FLASK_ENV') == 'production'

# Create Flask app with correct static file setup for SPA
app = Flask(__name__,
            static_folder='../client/build',
            static_url_path='',  # Empty string works better than None for SPA
            template_folder='../client/build'
            )

# App configuration
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY", "dev_secret_key"),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True,
)

# JSON configuration
app.json.compact = False

# Database configuration - simplified
if is_prod:
    db_uri = os.getenv('DATABASE_URI')
    if not db_uri:
        raise ValueError("No DATABASE_URI set for Production environment")
else:
    db_uri = os.getenv('DATABASE_URI', 'sqlite:///app.db')

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri

# Database setup
metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})
db = SQLAlchemy(metadata=metadata)
migrate = Migrate(app, db)
db.init_app(app)

# Additional extensions
bcrypt = Bcrypt(app)
api = Api(app)
ma = Marshmallow(app)

# CORS configuration - simplified
origins = ["https://dungeon-masters-notebook.onrender.com"]
if not is_prod:
    origins += ["http://localhost:3000", "http://localhost:5555"]

CORS(app, 
     supports_credentials=True, 
     origins=origins,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])

# SPA routing support - handle 404s for frontend routes
@app.errorhandler(404)
def not_found(e):
    if 'text/html' in request.accept_mimetypes:
        # Return index.html for frontend routes
        return render_template("index.html"), 200
    # Return JSON error for API routes
    return {'error': 'Not found.'}, 404