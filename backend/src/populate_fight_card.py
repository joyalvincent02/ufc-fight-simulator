import sys
from ufc_scraper import get_fight_card
from fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.db import SessionLocal, Fighter


def populate_fighters_from_event(event_url):
    print(f"\n📦 Populating fighter stats for event: {event_url}\n")
    card = get_fight_card(event_url)
    db = SessionLocal()

    for fight in card:
        for name, url in [(fight['fighter_a'], fight['url_a']), (fight['fighter_b'], fight['url_b'])]:
            existing = db.query(Fighter).filter(Fighter.name == name).first()

            if existing:
                print(f"✅ {name} already in DB")
            else:
                print(f"🔍 Scraping {name}...")
                stats = scrape_fighter_stats(name, url)
                if stats:
                    save_fighter_to_db(stats)
                else:
                    print(f"⚠️ Failed to scrape stats for {name}")

    db.close()
    print("\n🎉 DB population complete.\n")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        event_url = sys.argv[1]
    else:
        event_url = "http://ufcstats.com/event-details/7b03d9df5910917d"  # fallback default
        print(f"ℹ️ No event URL provided. Using default:\n{event_url}\n")

    populate_fighters_from_event(event_url)
