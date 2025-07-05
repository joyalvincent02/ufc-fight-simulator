#!/usr/bin/env python3
"""
Simple test script for the UFC Scheduler
"""
import sys
sys.path.append('.')

def test_scheduler():
    print("🚀 Testing UFC Scheduler...")
    
    try:
        # Test imports
        print("1. Testing imports...")
        from src.ufc_scheduler import UFCScheduler
        print("   ✅ UFCScheduler imported successfully")
        
        # Test initialization
        print("2. Testing initialization...")
        scheduler = UFCScheduler('sqlite:///data/fighter_stats.db')
        print("   ✅ Scheduler initialized")
        
        # Test start
        print("3. Testing scheduler start...")
        scheduler.start()
        print("   ✅ Scheduler started")
        
        # Test status
        print("4. Testing status...")
        status = scheduler.get_status()
        print(f"   ✅ Scheduler running: {status['running']}")
        print(f"   ✅ Jobs configured: {len(status['jobs'])}")
        
        # Show job details
        print("5. Job details:")
        for job in status['jobs']:
            print(f"   - {job['name']} (ID: {job['id']})")
            print(f"     Next run: {job['next_run']}")
        
        # Test manual trigger
        print("6. Testing manual result check...")
        result = scheduler.check_completed_events_manual()
        print(f"   ✅ Manual check result: {result}")
        
        # Test shutdown
        print("7. Testing shutdown...")
        scheduler.shutdown()
        print("   ✅ Scheduler stopped")
        
        print("\n🎉 All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_scheduler()
    sys.exit(0 if success else 1)
