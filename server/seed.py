from datetime import date, timedelta
from random import randint
from models import db, User, Game, Player, Session, Character
from app import app

# Additional imports for random seeding
from faker import Faker
from random import choice as rc
fake = Faker()

if __name__ == '__main__':
    with app.app_context():
        # Reset schema
        print("Resetting database schema...")
        db.drop_all()
        db.create_all()

        # Create demo user
        print("Creating demo user...")
        demo = User(username="demo")
        demo.password_hash = "demo"
        db.session.add(demo)
        db.session.commit()
        print("Created demo user!")

        # Create 8 demo players with fixed summaries
        print("Creating demo players...")
        demo_players = []
        player_data = [
            ("Evelyn Drake", "Evenings (Mon/Wed/Fri) UTC-5; enjoys deep-dive investigations and creative problem-solving."),
            ("Marcus Liu", "Weekends UTC-8; prefers role-play and atmospheric tension."),
            ("Aisha Khan", "Evenings UTC+1; loves puzzle-heavy scenarios and lore-deep dives."),
            ("Diego Castillo", "Afternoons UTC-6; focuses on gritty combat and moral choices."),
            ("Penelope Byrne", "Evenings UTC+0; excels in diplomatic challenges and social encounters."),
            ("Samuel Ortiz", "Weekends UTC-5; enjoys mechanical puzzles and gadget-based tactics."),
            ("Li Wei", "Mornings UTC+8; loves stealth and espionage missions."),
            ("Hanna Müller", "Afternoons UTC+1; focuses on strategic warfare and battle magic."),
        ]
        for name, summary in player_data:
            p = Player(name=name, summary=summary)
            p.user_id = demo.id
            db.session.add(p)
            db.session.flush()
            demo_players.append(p)
        db.session.commit()
        print("Demo players created!")

        # Create 5 games with realistic attributes
        print("Creating demo games...")
        demo_games = []
        game_definitions = [
            {
                "title": "Shadows Over Velethia",
                "description": "A chilling investigation into the disappearance of nobles in Velethia's fog-shrouded streets, uncovering cults and eldritch secrets.",
                "setting": "Gothic steampunk city",
                "system": "Call of Cthulhu",
                "start_date": date(2025,6,1),
                "status": "active"
            },
            {
                "title": "Rise of the Iron Court",
                "description": "Noble families vie for power in a land of clockwork citadels and political intrigue before all-out war erupts.",
                "setting": "Victorian technomagical empire",
                "system": "Clockwork & Sorcery",
                "start_date": date(2025,6,15),
                "status": "active"
            },
            {
                "title": "Echoes of the Ancients",
                "description": "Explorers delve into alien ruins on a remote moon, uncovering ancient tech and cosmic mysteries.",
                "setting": "Far-future sci-fi frontier",
                "system": "Starfinder",
                "start_date": date(2025,7,1),
                "status": "active"
            },
            {
                "title": "Tales from the Hollow Vale",
                "description": "In a realm of enchanted forests and faerie courts, heroes broker peace and face consequences of old bargains.",
                "setting": "High fantasy woodland realm",
                "system": "D&D 5e",
                "start_date": date(2025,7,15),
                "status": "active"
            },
            {
                "title": "Cyberpunk Redemption",
                "description": "In neon-soaked New Neo Tokyo, hackers and outcasts fight corporate overlords to uncover a city-wide conspiracy.",
                "setting": "Dystopian cyberpunk megacity",
                "system": "Cyberpunk RED",
                "start_date": date(2025,8,1),
                "status": "active"
            },
        ]
        for gdef in game_definitions:
            g = Game(
                title=gdef["title"],
                description=gdef["description"],
                setting=gdef["setting"],
                system=gdef["system"],
                start_date=gdef["start_date"],
                status=gdef["status"],
                user_id=demo.id
            )
            db.session.add(g)
            db.session.flush()
            demo_games.append(g)
        db.session.commit()
        print("Demo games created!")

        # Assign characters to demo players per your mapping:
        print("Assigning demo characters...")
        # Pre-generated cool names for demo characters
        cool_names = [
            "Draven Nightshade", "Artemis Vengeance", "Valeria Stormborn",
            "Kael Ironheart", "Lyra Shadowstrike", "Thorn Bloodraven",
            "Seraphina Frostbane", "Ezren Blackwood", "Ronan Silverfang",
            "Isolde Firebrand", "Lucien Darkwater", "Nyx Ravenshadow",
            "Orion Starfall", "Morgana Duskwhisper", "Dorian Ashwalker",
            "Selene Moonshadow", "Gideon Stormshield", "Elara Windrunner",
            "Caspian Seafoam", "Elysia Dawnbringer", "Talon Grimblade",
            "Astrid Flameheart", "Zephyr Nightwind", "Evander Stonefist",
            "Rhea Emberflame", "Fenris Wolfbane", "Amara Silverlight",
            "Vesper Blackthorn", "Jaxon Stormrider", "Kiera Shadowdancer",
            "Lysander Windblade", "Selene Frostwhisper", "Dante Darkflame",
            "Rowan Starbreeze", "Elowen Wildheart", "Thalia Brightsong",
            "Caelan Moonfire", "Nerissa Tidecaller", "Tristan Ironwood",
            "Yara Nightbloom", "Zara Stormchaser", "Kai Emberstorm",
            "Mila Ravencrest", "Xander Firestorm", "Aria Stormseer",
            "Bastian Darkthorn", "Celine Frostwind", "Darius Blacksky"
        ]
        name_idx = 0
        # mapping: list of tuples (player_index, list of (game_index, count))
        char_map = {
            0: [(0,1),(2,2),(3,1)],
            1: [(0,3),(1,1),(3,1)],
            2: [(0,1),(1,2),(2,2),(4,3)],
            3: [(2,1),(4,1)],
            4: [(4,3)],
            5: [(1,1),(3,3)],
            6: [(0,2),(1,2),(2,3)],
            7: [(0,1),(1,1),(2,1),(3,1),(4,1)],
        }
        for pidx, assignments in char_map.items():
            player = demo_players[pidx]
            for game_idx, cnt in assignments:
                for i in range(cnt):
                    # Assign a “cool” name from our pregenerated list
                    demo_name = cool_names[name_idx % len(cool_names)]
                    name_idx += 1
                    ch = Character(
                        name=demo_name,
                        character_class="Adventurer",
                        level=randint(1,5),
                        icon="",
                        is_active=True,
                        player_id=player.id,
                        game_id=demo_games[game_idx].id
                    )
                    db.session.add(ch)
        db.session.commit()
        print("Demo characters assigned!")

        # Create 3 unattached demo players
        print("Creating unattached players...")
        for name, summary in [
            ("Lone Wanderer", "A mysterious figure roaming alone with no game ties."),
            ("Mystery Guest", "Appears at random sessions without warning."),
            ("Wandering Bard", "Travels from town to town, singing songs of heroes.")
        ]:
            p = Player(name=name, summary=summary)
            p.user_id = demo.id
            db.session.add(p)
        db.session.commit()
        print("Unattached players created!")

        # Create 1–5 sessions per game with realistic dates and summaries
        print("Creating demo sessions...")
        for g in demo_games:
            sess_count = randint(1,5)
            for n in range(sess_count):
                sess_date = g.start_date + timedelta(days=7*n)
                s = Session(
                    date=sess_date,
                    summary=f"Session {n+1} of {g.title}: The party delves deeper into the plot, facing new challenges and forging alliances.",
                    game_id=g.id
                )
                db.session.add(s)
        db.session.commit()
        print("Demo sessions created!")

        # (Optional) leave random seeding below unchanged for broader testing...
        # Begin random data seeding for broader testing
        print("Creating random users...")
        users = []
        for _ in range(5):
            username = fake.user_name()
            user = User(username=username)
            user.password_hash = "password123"
            users.append(user)
        db.session.add_all(users)
        db.session.commit()
        print(f"Seeded {len(users)} users!")

        print("Creating random games...")
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
        random_games = []
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
                random_games.append(game)
        db.session.add_all(random_games)
        db.session.commit()
        print(f"Seeded {len(random_games)} random games!")

        print("Creating random players and characters...")
        game_players_map = {g.id: [] for g in random_games}
        random_players = []
        for game in random_games:
            num_players = randint(1, 4)
            for _ in range(num_players):
                player = Player(
                    name=fake.name(),
                    summary=fake.sentence(nb_words=12)
                )
                db.session.add(player)
                db.session.flush()
                random_players.append(player)
                game_players_map[game.id].append(player)
        db.session.commit()
        print(f"Seeded {len(random_players)} random players!")

        print("Creating random sessions...")
        random_sessions = []
        for game in random_games:
            num_sessions = randint(1, 5)
            for n in range(num_sessions):
                start = game.start_date or date.today()
                session_date = fake.date_between(start_date=start, end_date="today")
                session_obj = Session(
                    date=session_date,
                    summary=fake.text(max_nb_chars=100),
                    game_id=game.id
                )
                random_sessions.append(session_obj)
        db.session.add_all(random_sessions)
        db.session.commit()
        print(f"Seeded {len(random_sessions)} random sessions!")

        print("Creating random characters...")
        random_characters = []
        for game_id, plist in game_players_map.items():
            num_chars_total = randint(1, len(plist) * 2)
            for _ in range(num_chars_total):
                player = rc(plist)
                char = Character(
                    name=fake.first_name() + " " + fake.last_name(),
                    character_class=rc([
                        "Fighter", "Wizard", "Rogue", "Cleric",
                        "Druid", "Paladin", "Ranger", "Bard", "Monk"
                    ]),
                    level=randint(1, 20),
                    icon="",
                    is_active=rc([True, False]),
                    player_id=player.id,
                    game_id=game_id
                )
                random_characters.append(char)
        db.session.add_all(random_characters)
        db.session.commit()
        print(f"Seeded {len(random_characters)} random characters!")