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


def get_fight_card(event_url):
    response = requests.get(event_url)
    soup = BeautifulSoup(response.text, "html.parser")

    fights = []

    for row in soup.select("tr.b-fight-details__table-row.b-fight-details__table-row__hover.js-fight-details-click"):
        cols = row.find_all("td")

        if len(cols) >= 2:
            fighter_a = cols[1].select_one("p:nth-of-type(1)").get_text(strip=True)
            fighter_b = cols[1].select_one("p:nth-of-type(2)").get_text(strip=True)
            fights.append((fighter_a, fighter_b))

    return fights

