#!/usr/bin/env python3
"""
Test script for the UFC Scheduler
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.ufc_scheduler import UFCScheduler
import time

def test_scheduler():
    """Test basic scheduler functionality"""
    print("🚀 Testing UFC Scheduler...")
    
    # Create scheduler instance
    database_url = 'sqlite:///data/fighter_stats.db'
    scheduler = UFCScheduler(database_url)
    
    try:
        # Start scheduler
        print("Starting scheduler...")
        scheduler.start()
        
        # Get status
        print("Getting status...")
        status = scheduler.get_status()
        
        print(f"✅ Scheduler running: {status['running']}")
        print(f"✅ Jobs configured: {len(status['jobs'])}")
        
        for job in status['jobs']:
            print(f"   - {job['name']}: {job['next_run']}")
        
        # Test manual functions
        print("\n🧪 Testing manual functions...")
        
        # Manual result check
        print("Testing manual result check...")
        result = scheduler.check_completed_events_manual()
        print(f"✅ Result check: {result}")
        
        # Wait a moment
        time.sleep(2)
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean shutdown
        print("Shutting down scheduler...")
        scheduler.shutdown()
        print("✅ Test completed")

if __name__ == "__main__":
    test_scheduler()
