import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

BASE_URL = "http://ufcstats.com"

def _parse_event_date(date_text: str | None):
    if not date_text:
        return None
    # Normalize "Sept." to "Sep." but don't replace "Sept" in "September"
    normalized = date_text.replace("Sept.", "Sep.").replace("Sept ", "Sep ")
    for fmt in ["%B %d, %Y", "%b %d, %Y", "%b. %d, %Y", "%m/%d/%Y"]:
        try:
            return datetime.strptime(normalized, fmt)
        except ValueError:
            continue
    return None

def get_upcoming_event_links():
    url = f"{BASE_URL}/statistics/events/upcoming"
    response = requests.get(url, timeout=30)  # Only add timeout
    soup = BeautifulSoup(response.text, "html.parser")

    event_links = []

    for row in soup.select("tr.b-statistics__table-row"):
        a_tag = row.find("a")
        date_cell = row.find("span", class_="b-statistics__date")
        if a_tag and "href" in a_tag.attrs:
            event_url = a_tag["href"]
            event_title = a_tag.get_text(strip=True)
            date_text = date_cell.get_text(strip=True) if date_cell else None
            parsed_date = _parse_event_date(date_text)
            event_links.append({
                "url": event_url,
                "title": event_title,
                "date": parsed_date,
                "date_text": date_text or "Unknown"
            })

    return event_links

def get_completed_event_links(days_back=7):
    """
    Scrape completed events from the last X days
    UFCStats completed events page shows recent events first
    """
    try:
        url = f"{BASE_URL}/statistics/events/completed?page=all"
        logger.info(f"Fetching completed events from: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        event_links = []
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # Look for event rows in the table
        event_rows = soup.select("tr.b-statistics__table-row")
        logger.info(f"Found {len(event_rows)} event rows on completed events page")

        for i, row in enumerate(event_rows):
            try:
                a_tag = row.find("a")
                date_cell = row.find("span", class_="b-statistics__date")
                
                if not a_tag or "href" not in a_tag.attrs:
                    continue
                    
                event_url = a_tag["href"]
                event_title = a_tag.get_text(strip=True)
                
                # Try to parse the date using the same function as upcoming events
                event_date = None
                if date_cell:
                    date_text = date_cell.get_text(strip=True)
                    event_date = _parse_event_date(date_text)
                    if not event_date:
                        logger.warning(f"Could not parse date '{date_text}' for event '{event_title}'")
                
                # If we couldn't parse the date or it's within our timeframe, include it
                # Compare dates (not datetime) to avoid timezone issues
                event_date_only = event_date.date() if event_date else None
                cutoff_date_only = cutoff_date.date()
                if not event_date_only or event_date_only >= cutoff_date_only:
                    event_links.append({
                        "url": event_url,
                        "title": event_title,
                        "date": event_date,
                        "date_text": date_cell.get_text(strip=True) if date_cell else "Unknown"
                    })
                    logger.info(f"Added completed event: {event_title} ({event_date.strftime('%Y-%m-%d') if event_date else 'Unknown date'})")
                else:
                    # Events are typically in chronological order, but we'll continue
                    # checking a few more in case some are out of order
                    if i > 20:  # Stop after checking 20+ old events
                        break
                        
            except Exception as e:
                logger.warning(f"Error processing event row {i}: {e}")
                continue

        logger.info(f"Found {len(event_links)} completed events in the specified timeframe")
        return event_links
        
    except Exception as e:
        logger.error(f"Error fetching completed events: {e}")
        return []

def is_event_ongoing(event_url: str) -> bool:
    """
    Check if an event is ongoing or completed by looking for actual fight results
    Returns True only if the event has clear "W" (Win) indicators in the first cell
    This is the most reliable indicator that fights have completed
    """
    try:
        response = requests.get(event_url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        fight_rows = soup.select("tbody.b-fight-details__table-body tr")
        
        if not fight_rows:
            return False
        
        # Count how many fights have the "W" indicator in the first cell
        # This is the most reliable sign that a fight has completed
        fights_with_results = 0
        
        for row in fight_rows:
            cells = row.select("td")
            if len(cells) < 3:
                continue
            
            # Check the first cell for a "W" (Win) indicator
            # In UFCStats completed events, the first cell shows "W" for the winner
            # This is the most reliable indicator and avoids false positives
            first_cell = cells[0].get_text(strip=True).upper()
            if first_cell == 'W' or first_cell == 'WIN':
                fights_with_results += 1
        
        # Event is ongoing/completed if at least one fight has the "W" indicator
        # This is a strict check that prevents false positives from upcoming events
        return fights_with_results > 0
    except Exception as e:
        logger.warning(f"Error checking if event is ongoing: {e}")
        return False

def check_event_completion_status(event_url: str) -> tuple[bool, bool, int]:
    """
    Check event completion status by analyzing fight results
    Returns: (has_any_results, all_fights_complete, total_fights)
    - has_any_results: True if at least one fight has results
    - all_fights_complete: True if all fights have results
    - total_fights: Total number of fights on the card
    """
    try:
        response = requests.get(event_url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        fight_rows = soup.select("tbody.b-fight-details__table-body tr")
        
        if not fight_rows:
            return (False, False, 0)
        
        total_fights = 0
        fights_with_results = 0
        
        for row in fight_rows:
            cells = row.select("td")
            if len(cells) < 3:
                continue
            
            # Check if this row represents a valid fight (has fighter links)
            fighter_links = row.select("a.b-link")
            if len(fighter_links) < 2:
                # Skip rows that don't have two fighter links (might be header or separator)
                continue
            
            # Count this as a valid fight row
            total_fights += 1
            
            # Check the first cell for a "W" (Win) indicator
            first_cell = cells[0].get_text(strip=True).upper()
            if first_cell == 'W' or first_cell == 'WIN':
                fights_with_results += 1
            # Also check for result indicators in the row text (KO, Decision, Submission, etc.)
            elif total_fights > 0:  # Only check if we've already counted this as a fight
                row_text = row.get_text().upper()
                result_indicators = ['DECISION', 'UD', 'MD', 'SD', 'KO', 'TKO', 'SUBMISSION', 'SUB', 'DQ', 'NC', 'NO CONTEST']
                if any(indicator in row_text for indicator in result_indicators):
                    fights_with_results += 1
        
        has_any_results = fights_with_results > 0
        all_fights_complete = total_fights > 0 and fights_with_results == total_fights
        
        return (has_any_results, all_fights_complete, total_fights)
    except Exception as e:
        logger.warning(f"Error checking event completion status: {e}")
        return (False, False, 0)

def get_fight_card(event_url: str):
    response = requests.get(event_url, timeout=30)  # Only add timeout
    soup = BeautifulSoup(response.text, "html.parser")

    fight_rows = soup.select("tbody.b-fight-details__table-body tr")
    fights = []

    for row in fight_rows:
        fighter_links = row.select("td.l-page_align_left a.b-link")
        if len(fighter_links) >= 2:
            fighter_a = fighter_links[0].get_text(strip=True)
            url_a = fighter_links[0]["href"]
            fighter_b = fighter_links[1].get_text(strip=True)
            url_b = fighter_links[1]["href"]

            fights.append({
                "fighter_a": fighter_a,
                "url_a": url_a,
                "fighter_b": fighter_b,
                "url_b": url_b
            })

    return fights

def get_fight_results(event_url: str):
    """
    Scrape fight results from a completed event
    Returns list of fights with winners
    """
    try:
        logger.info(f"Scraping results from: {event_url}")
        response = requests.get(event_url)
        soup = BeautifulSoup(response.text, "html.parser")

        # UFCStats completed event pages have a different structure than upcoming ones
        # Look for the table that contains fight results
        fight_rows = soup.select("tbody.b-fight-details__table-body tr")
        
        if not fight_rows:
            logger.warning(f"No fight rows found at {event_url}")
            return []
            
        results = []
        logger.info(f"Found {len(fight_rows)} fight rows to process")

        for i, row in enumerate(fight_rows):
            try:
                # Get fighter name links
                fighter_links = row.select("a.b-link.b-link_style_black")
                if len(fighter_links) < 2:
                    logger.debug(f"Row {i}: Insufficient fighter links ({len(fighter_links)})")
                    continue
                    
                fighter_a = fighter_links[0].get_text(strip=True)
                fighter_b = fighter_links[1].get_text(strip=True)
                
                logger.debug(f"Row {i}: Processing {fighter_a} vs {fighter_b}")
                
                # Method 1: Look for result indicators in the row
                winner = None
                
                # First, check if this fight has actually occurred by looking for result indicators
                row_text = row.get_text().upper()
                result_indicators = [
                    'DECISION', 'UD', 'MD', 'SD', 'U-DEC', 'M-DEC', 'S-DEC',  # Decision types
                    'KO', 'TKO', 'KNOCKOUT', 'KO/TKO',       # Knockout types
                    'SUBMISSION', 'SUB',           # Submission types
                    'DQ', 'DISQUALIFICATION',      # Disqualification
                    'NC', 'NO CONTEST',           # No contest
                    'DRAW',                       # Draw
                    'WIN'                         # General win indicator
                ]
                
                has_result = any(indicator in row_text for indicator in result_indicators)
                
                if not has_result:
                    # No result indicators found - this is likely an upcoming fight
                    logger.debug(f"Row {i}: No result indicators found for {fighter_a} vs {fighter_b} - skipping upcoming fight")
                    continue
                
                # Now try to determine the winner since we know the fight happened
                # Method 1: Check for WIN indicator in the first cell and fighter order
                cells = row.select("td")
                if len(cells) > 0:
                    first_cell = cells[0].get_text(strip=True).upper()
                    if 'WIN' in first_cell or 'W' == first_cell:
                        # In UFC stats, the winner is typically listed first in the fighter names
                        # This is the most reliable method for this specific site structure
                        winner = fighter_a
                        logger.debug(f"Row {i}: Winner determined from WIN indicator: {winner}")
                
                # Method 2: Look for explicit win/loss patterns in cells
                if not winner:
                    for j, cell in enumerate(cells):
                        cell_text = cell.get_text(strip=True).upper()
                        
                        # Look for explicit win indicators
                        if 'W' == cell_text or 'WIN' in cell_text:
                            # Check if this cell is closer to fighter A or B
                            if j < len(cells) // 2:
                                winner = fighter_a
                            else:
                                winner = fighter_b
                            logger.debug(f"Row {i}: Winner determined from cell position: {winner}")
                            break
                
                # Method 3: Try to get result from fight details page (fallback)
                if not winner:
                    detail_links = row.select("a[href*='fight-details']")
                    if detail_links:
                        try:
                            detail_url = detail_links[0]['href']
                            winner = get_winner_from_fight_details(detail_url, fighter_a, fighter_b)
                            if winner:
                                logger.debug(f"Row {i}: Got winner from details page: {winner}")
                        except Exception as e:
                            logger.warning(f"Row {i}: Could not get details from fight page: {e}")
                
                # Only add to results if we found a winner (we already confirmed fight happened)
                if winner:
                    results.append({
                        "fighter_a": fighter_a,
                        "fighter_b": fighter_b,
                        "winner": winner,
                        "event_url": event_url
                    })
                    logger.info(f"Row {i}: Found result - {winner} defeated {fighter_b if winner == fighter_a else fighter_a}")
                else:
                    # Fight has result indicators but we couldn't determine winner
                    logger.warning(f"Row {i}: Fight appears completed but could not determine winner for {fighter_a} vs {fighter_b}")
                    
            except Exception as e:
                logger.error(f"Row {i}: Error parsing fight result: {e}")
                continue

        logger.info(f"Successfully extracted {len(results)} fight results from {event_url}")
        return results
        
    except Exception as e:
        logger.error(f"Error scraping results from {event_url}: {e}")
        return []

def get_winner_from_fight_details(fight_url: str, fighter_a: str, fighter_b: str):
    """
    Get winner from individual fight details page
    This page usually has clearer win/loss indicators
    """
    try:
        response = requests.get(fight_url)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Look for result section
        result_sections = soup.select(".b-fight-details__person")
        
        for section in result_sections:
            text = section.get_text()
            
            # Look for "W" (Win) indicator
            if " W " in text or text.strip().endswith(" W"):
                # Check which fighter this section belongs to
                fighter_name = section.select(".b-fight-details__person-name")
                if fighter_name:
                    name = fighter_name[0].get_text(strip=True)
                    name_norm = normalize_fighter_name(name)
                    
                    if normalize_fighter_name(fighter_a) == name_norm:
                        return fighter_a
                    elif normalize_fighter_name(fighter_b) == name_norm:
                        return fighter_b
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting winner from fight details: {e}")
        return None

def normalize_fighter_name(name: str) -> str:
    """
    Normalize fighter names for matching across different sources
    Handles common variations in fighter name formatting
    """
    # Remove extra whitespace and convert to lowercase
    name = name.strip().lower()
    
    # Remove common suffixes/prefixes
    name = name.replace("jr.", "").replace("sr.", "").replace("iii", "").replace("ii", "")
    
    # Handle common nickname patterns
    if '"' in name:
        # Remove nicknames in quotes: John "The Hammer" Smith -> John Smith
        parts = name.split('"')
        name = (parts[0] + " " + parts[-1]).strip()
    
    # Remove extra spaces
    name = " ".join(name.split())
    
    return name

