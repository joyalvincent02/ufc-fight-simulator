import sys
from ufc_scraper import get_fight_card
from fight_model import calculate_exchange_probabilities
from simulate_fight import simulate_fight
from src.db import SessionLocal, Fighter

def simulate_event(event_url):
    print(f"\nSimulating fights for event: {event_url}\n")
    card = get_fight_card(event_url)
    db = SessionLocal()

    for fight in card:
        name_a = fight['fighter_a']
        name_b = fight['fighter_b']

        fighter_a = db.query(Fighter).filter(Fighter.name == name_a).first()
        fighter_b = db.query(Fighter).filter(Fighter.name == name_b).first()

        if not fighter_a or not fighter_b:
            print(f"Missing stats for {name_a} or {name_b}, skipping...\n")
            continue

        P_A, P_B, P_neutral = calculate_exchange_probabilities(fighter_a, fighter_b)

        print(f"{name_a} vs {name_b}")
        print(f"→ Exchange Probabilities:\n  {name_a}: {P_A:.3f}, {name_b}: {P_B:.3f}, Neutral: {P_neutral:.3f}")
        
        # Print image URLs
        print(f"{name_a} Image: {fighter_a.image_url or 'No image'}")
        print(f"{name_b} Image: {fighter_b.image_url or 'No image'}")

        results = simulate_fight(P_A, P_B, P_neutral, num_rounds=5, name_A=name_a, name_B=name_b)
        print(f"{name_a} win rate: {results[name_a]:.1f}%")
        print(f"{name_b} win rate: {results[name_b]:.1f}%")
        print(f"Draw rate: {results['Draw']:.1f}%")
        print("-" * 50)

    db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        event_url = sys.argv[1]
    else:
        event_url = "http://ufcstats.com/event-details/7b03d9df5910917d"
        print(f"ℹ️ No event URL provided. Using default:\n{event_url}\n")

    simulate_event(event_url)
