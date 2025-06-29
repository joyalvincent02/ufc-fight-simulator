import requests
from bs4 import BeautifulSoup

BASE_URL = "http://ufcstats.com"

def get_upcoming_event_links():
    url = f"{BASE_URL}/statistics/events/upcoming"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    event_links = []

    for row in soup.select("tr.b-statistics__table-row"):
        a_tag = row.find("a")
        if a_tag and "href" in a_tag.attrs:
            event_links.append(a_tag["href"])

    return event_links


def get_fight_card(event_url: str):
    response = requests.get(event_url)
    soup = BeautifulSoup(response.text, "html.parser")

    fight_rows = soup.select("tbody.b-fight-details__table-body tr")
    fights = []

    for row in fight_rows:
        fighters = row.select("td.b-fight-details__table-col.l-page_align_left a.b-link")
        if len(fighters) >= 2:
            fighter_a = fighters[0].get_text(strip=True)
            url_a = fighters[0]['href']
            fighter_b = fighters[1].get_text(strip=True)
            url_b = fighters[1]['href']

            fights.append({
                "fighter_a": fighter_a,
                "url_a": url_a,
                "fighter_b": fighter_b,
                "url_b": url_b
            })

    return fights
