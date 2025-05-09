from faker import Faker
from random import randint, choice as rc
from models import db, User, Game, Player, Session, Character
from app import app

if __name__ == '__main__':
    fake = Faker()
    with app.app_context():
        print("Resetting database schema...")
        db.drop_all()
        db.create_all()

        print("Creating users...")
        users = []
        for _ in range(5):
            username = fake.user_name()
            user = User(username=username)
            user.password_hash = "password123"
            users.append(user)

        db.session.add_all(users)
        db.session.commit()
        print(f"Seeded {len(users)} users!")

        print("Creating games...")
        systems = [
            "D&D 5e", "Pathfinder 2e", "Pathfinder 1e",
            "Call of Cthulhu 7th Edition", "Shadowrun 6th Edition",
            "Starfinder", "World of Darkness"
        ]
        titles = [
            "Curse of the Crimson Throne", "Rise of the Runelords",
            "Wrath of the Righteous", "Curse of Strahd",
            "Tomb of Annihilation", "Lost Mines of Phandelver",
            "The Haunting of Harrowstone", "Masks of Nyarlathotep",
            "Edge of the Earth"
        ]
        statuses = ["planned", "ongoing", "completed"]
        games = []
        for user in users:
            num_games = randint(1, 3)
            for _ in range(num_games):
                title = rc(titles)
                game = Game(
                    title=title,
                    description=fake.text(max_nb_chars=200),
                    system=rc(systems),
                    start_date=fake.date_between(start_date="-1y", end_date="today"),
                    setting=fake.sentence(nb_words=5),
                    status=rc(statuses),
                    user_id=user.id
                )
                games.append(game)
        db.session.add_all(games)
        db.session.commit()
        print(f"Seeded {len(games)} games!")

        print("Creating players...")
        players = []
        game_players_map = {}
        for game in games:
            num_players = randint(1, 4)
            for _ in range(num_players):
                player = Player(
                    name=fake.name(),
                    summary=fake.sentence(nb_words=12)
                )
                players.append(player)
                game_players_map.setdefault(game.id, []).append(player)
        db.session.add_all(players)
        db.session.commit()
        print(f"Seeded {len(players)} players!")

        print("Creating sessions...")
        sessions = []
        for game in games:
            num_sessions = randint(1, 5)
            for _ in range(num_sessions):
                # Use the game’s start_date as the earliest, or default to one year ago
                start = game.start_date or "-1y"
                session_date = fake.date_between(start_date=start, end_date="today")
                session_obj = Session(
                    date=session_date,
                    summary=fake.text(max_nb_chars=100),
                    game_id=game.id
                )
                sessions.append(session_obj)
        db.session.add_all(sessions)
        db.session.commit()
        print(f"Seeded {len(sessions)} sessions!")

        print("Creating characters...")
        characters = []
        for game_id, plist in game_players_map.items():
            num_chars_total = randint(1, len(plist) * 2)
            for _ in range(num_chars_total):
                player = rc(plist)
                char = Character(
                    name=fake.name(),
                    character_class=rc([
                        "Fighter", "Wizard", "Rogue", "Cleric",
                        "Druid", "Paladin", "Ranger", "Bard", "Monk"
                    ]),
                    level=randint(1, 20),
                    icon=fake.image_url(),
                    is_active=rc([True, False]),
                    player_id=player.id,
                    game_id=game_id
                )
                characters.append(char)
        db.session.add_all(characters)
        db.session.commit()
        print(f"Seeded {len(characters)} characters!")