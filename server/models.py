from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import validates

from config import db, bcrypt, ma

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128), nullable=False)

    games = db.relationship(
        "Game",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    players = db.relationship(
        "Player",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes may not be viewed')

    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.generate_password_hash(password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))


# --- Game model ---
class Game(db.Model):
    __tablename__ = 'games'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    system = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    setting = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship(
        "User",
        back_populates="games",
        lazy="selectin"
    )
    players = db.relationship(
        "Player",
        back_populates="game",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self):
        return f'<Game id={self.id} title={self.title}>'

##needs to be fixed when character is created
class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    game = db.relationship(
        "Game",
        back_populates="players",
        lazy="selectin"
    )
    user = db.relationship(
        "User",
        back_populates="players",
        lazy="selectin"
    )

    def __repr__(self):
        return f'<Player id={self.id} name={self.name}>'