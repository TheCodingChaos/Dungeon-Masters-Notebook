from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import validates

# Ensure necessary imports
from config import db, bcrypt
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey

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
    sessions = db.relationship(
        "Session",
        back_populates="game",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    # Characters belonging to this game
    characters = db.relationship(
        "Character",
        back_populates="game",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    # Players participating in this game via characters
    players = association_proxy('characters', 'player')

    def __repr__(self):
        return f'<Game id={self.id} title={self.title}>'

##needs to be fixed when character is created
class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship(
        "User",
        back_populates="players",
        lazy="selectin"
    )
    # Characters associated with this player
    characters = db.relationship(
        "Character",
        back_populates="player",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    # Games this player is involved in via characters
    games = association_proxy('characters', 'game')

    def __repr__(self):
        return f'<Player id={self.id} name={self.name}>'

class Session(db.Model):
    __tablename__ = 'sessions'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)

    game = db.relationship(
        "Game",
        back_populates="sessions",
        lazy="selectin"
    )

    def __repr__(self):
        return f'<Session id={self.id} date={self.date}>'


# Character model
class Character(db.Model):
    __tablename__ = 'characters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    character_class = db.Column(db.String(50), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    icon = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)

    player = db.relationship(
        "Player",
        back_populates="characters",
        lazy="selectin"
    )
    game = db.relationship(
        "Game",
        back_populates="characters",
        lazy="selectin"
    )

    def __repr__(self):
        return f'<Character id={self.id} name={self.name}>'