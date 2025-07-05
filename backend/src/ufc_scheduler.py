# backend/src/ufc_scheduler.py
"""
UFC Fight Simulator - Azure-Optimized Scheduler
Handles automated data updates for UFC events, fighter profiles, and results.
"""

import logging
import traceback
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED
from src.db import SessionLocal, ModelPrediction, Fighter
from src.ufc_scraper import get_upcoming_event_links, get_fight_card
from src.ensemble_predict import get_ensemble_prediction
from src.fighter_scraper import scrape_fighter_stats, save_fighter_to_db
from src.ml.scrape_fighter_outcomes import scrape_all_fighters
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UFCScheduler:
    """Azure-optimized scheduler for UFC data updates"""
    
    def __init__(self, database_url: str):
        # Azure-friendly configuration
        self.database_url = database_url
        
        # Configure job store to use the same database
        jobstores = {
            'default': SQLAlchemyJobStore(url=database_url, tablename='scheduled_jobs')
        }
        
        # Single-threaded executor for Azure App Service
        executors = {
            'default': ThreadPoolExecutor(max_workers=1)
        }
        
        # Azure-optimized job defaults
        job_defaults = {
            'coalesce': True,        # Prevent multiple instances
            'max_instances': 1,      # Only one instance of each job
            'misfire_grace_time': 600  # 10 minutes grace period
        }
        
        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='UTC'  # Always use UTC for consistency
        )
        
        # Add event listeners for monitoring
        self.scheduler.add_listener(self._job_executed, EVENT_JOB_EXECUTED)
        self.scheduler.add_listener(self._job_error, EVENT_JOB_ERROR)
        self.scheduler.add_listener(self._job_missed, EVENT_JOB_MISSED)
        
        # Track last update times
        self.last_event_check = None
        self.last_profile_update = None
        self.last_result_check = None
        self.last_cleanup = None
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            try:
                self.scheduler.start()
                logger.info("UFC Scheduler started successfully")
                self._setup_jobs()
            except Exception as e:
                logger.error(f"Failed to start scheduler: {e}")
                raise
    
    def shutdown(self):
        """Gracefully shutdown the scheduler"""
        if self.scheduler.running:
            try:
                self.scheduler.shutdown(wait=True)
                logger.info("UFC Scheduler stopped")
            except Exception as e:
                logger.error(f"Error during scheduler shutdown: {e}")
    
    def _setup_jobs(self):
        """Setup all scheduled jobs with AEST timezone converted to UTC"""
        try:
            # Wednesday 12PM AEST = Wednesday 2AM UTC
            # New Event Detection
            self.scheduler.add_job(
                func=job_check_new_events,
                trigger='cron',
                day_of_week='wed',
                hour=2,
                minute=0,
                id='check_new_events',
                name='Check for New UFC Events',
                replace_existing=True
            )
            
            # Wednesday 12PM AEST = Wednesday 2AM UTC
            # Fighter Profile Updates
            self.scheduler.add_job(
                func=job_update_fighter_profiles,
                trigger='cron',
                day_of_week='wed',
                hour=2,
                minute=30,  # 30 minutes after event check
                id='update_fighter_profiles',
                name='Update Fighter Profiles',
                replace_existing=True
            )
            
            # Sunday 4PM AEST = Sunday 6AM UTC
            # Result Checking (after weekend events)
            self.scheduler.add_job(
                func=job_check_completed_events,
                trigger='cron',
                day_of_week='sun',
                hour=6,
                minute=0,
                id='check_completed_events',
                name='Check Completed Events',
                replace_existing=True
            )
            
            # Monthly cleanup on first Wednesday of month at 3AM UTC
            self.scheduler.add_job(
                func=job_cleanup_old_predictions,
                trigger='cron',
                day='1-7',
                day_of_week='wed',
                hour=3,
                minute=0,
                id='cleanup_predictions',
                name='Cleanup Old Predictions',
                replace_existing=True
            )
            
            logger.info("All scheduled jobs configured successfully")
            
        except Exception as e:
            logger.error(f"Failed to setup jobs: {e}")
            raise
    
    def _check_new_events(self):
        """Check for new UFC events and generate predictions"""
        try:
            logger.info("Starting new event detection...")
            self.last_event_check = datetime.utcnow()
            
            # Get upcoming events
            events = get_upcoming_event_links()
            logger.info(f"Found {len(events)} upcoming events")
            
            new_predictions = 0
            
            for event in events:
                try:
                    event_url = event["url"]
                    event_title = event["title"]
                    logger.info(f"Processing event: {event_title}")
                    
                    # Get fight card
                    fight_card = get_fight_card(event_url)
                    if not fight_card:
                        logger.warning(f"No fight card found for {event_title}")
                        continue
                    
                    # Generate predictions for each fight
                    for fight in fight_card:
                        fighter_a = fight["fighter_a"]
                        fighter_b = fight["fighter_b"]
                        
                        # Check if predictions already exist
                        db = SessionLocal()
                        existing = db.query(ModelPrediction).filter(
                            ModelPrediction.fighter_a == fighter_a,
                            ModelPrediction.fighter_b == fighter_b
                        ).first()
                        
                        if existing:
                            db.close()
                            continue
                        
                        db.close()
                        
                        # Generate predictions for all three models
                        try:
                            result = get_ensemble_prediction(fighter_a, fighter_b)
                            if result and not result.get('error'):
                                new_predictions += 3  # ML, Ensemble, Sim
                                logger.info(f"Generated predictions for {fighter_a} vs {fighter_b}")
                        except Exception as e:
                            logger.error(f"Failed to generate prediction for {fighter_a} vs {fighter_b}: {e}")
                
                except Exception as e:
                    logger.error(f"Error processing event {event.get('title', 'Unknown')}: {e}")
            
            logger.info(f"Event check completed. Generated {new_predictions} new predictions")
            
        except Exception as e:
            logger.error(f"Error in new event detection: {e}")
            logger.error(traceback.format_exc())
    
    def _update_fighter_profiles(self):
        """Update fighter profile data"""
        try:
            logger.info("Starting fighter profile updates...")
            self.last_profile_update = datetime.utcnow()
            
            db = SessionLocal()
            fighters = db.query(Fighter).all()
            db.close()
            
            updated_count = 0
            
            for fighter in fighters:
                if not fighter.profile_url:
                    continue
                
                try:
                    data = scrape_fighter_stats(fighter.name, fighter.profile_url)
                    if data:
                        save_fighter_to_db(data)
                        updated_count += 1
                        
                        # Small delay to be respectful to the website
                        import time
                        time.sleep(1)
                        
                except Exception as e:
                    logger.error(f"Failed to update {fighter.name}: {e}")
            
            logger.info(f"Fighter profile update completed. Updated {updated_count} fighters")
            
        except Exception as e:
            logger.error(f"Error in fighter profile updates: {e}")
            logger.error(traceback.format_exc())
    
    def check_completed_events_manual(self):
        """Manual trigger for checking completed events (called from API)"""
        try:
            logger.info("Manual trigger: Checking completed events...")
            job_check_completed_events()  # Call the module-level function
            return {
                "message": "Manual result check completed",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Manual event check failed: {e}")
            return {"error": str(e)}
    
    def _check_completed_events(self):
        """Check for completed events and update results"""
        try:
            logger.info("Checking for completed events...")
            self.last_result_check = datetime.utcnow()
            
            # This is a placeholder for result checking logic
            # In a full implementation, you would:
            # 1. Scrape UFC results from completed events
            # 2. Match them with existing predictions
            # 3. Update the actual_winner and correct fields
            
            # For now, we'll just log that the check happened
            db = SessionLocal()
            pending_predictions = db.query(ModelPrediction).filter(
                ModelPrediction.actual_winner.is_(None)
            ).count()
            db.close()
            
            logger.info(f"Found {pending_predictions} predictions awaiting results")
            logger.info("Result checking completed (manual result entry still required)")
            
            return {
                "message": "Result check completed",
                "pending_predictions": pending_predictions,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error checking completed events: {e}")
            logger.error(traceback.format_exc())
            return {"error": str(e)}
    
    def _cleanup_old_predictions(self):
        """Clean up predictions older than 6 months but keep lifetime records"""
        try:
            logger.info("Starting prediction cleanup...")
            self.last_cleanup = datetime.utcnow()
            
            # Calculate cutoff date (6 months ago)
            cutoff_date = datetime.utcnow() - timedelta(days=180)
            
            db = SessionLocal()
            
            # Delete old predictions (keep results for statistics)
            # We might want to archive rather than delete, or only delete pending predictions
            old_pending = db.query(ModelPrediction).filter(
                ModelPrediction.timestamp < cutoff_date,
                ModelPrediction.actual_winner.is_(None)  # Only delete pending predictions
            )
            
            count = old_pending.count()
            old_pending.delete()
            db.commit()
            db.close()
            
            logger.info(f"Cleanup completed. Removed {count} old pending predictions")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            logger.error(traceback.format_exc())
    
    def get_status(self):
        """Get scheduler status and last update times"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                'trigger': str(job.trigger)
            })
        
        return {
            'running': self.scheduler.running,
            'jobs': jobs,
            'last_event_check': self.last_event_check.isoformat() if self.last_event_check else None,
            'last_profile_update': self.last_profile_update.isoformat() if self.last_profile_update else None,
            'last_result_check': self.last_result_check.isoformat() if self.last_result_check else None,
            'last_cleanup': self.last_cleanup.isoformat() if self.last_cleanup else None
        }
    
    def _job_executed(self, event):
        """Handle successful job execution"""
        logger.info(f"Job '{event.job_id}' executed successfully")
    
    def _job_error(self, event):
        """Handle job execution errors"""
        logger.error(f"Job '{event.job_id}' failed: {event.exception}")
        logger.error(f"Traceback: {event.traceback}")
    
    def _job_missed(self, event):
        """Handle missed job executions"""
        logger.warning(f"Job '{event.job_id}' was missed")


# Module-level job functions (can be serialized)
def job_check_new_events():
    """Job function for checking new events"""
    try:
        logger.info("Starting new event detection job...")
        
        # Get upcoming events
        events = get_upcoming_event_links()
        logger.info(f"Found {len(events)} upcoming events")
        
        new_predictions = 0
        
        for event in events:
            try:
                event_url = event["url"]
                event_title = event["title"]
                logger.info(f"Processing event: {event_title}")
                
                # Get fight card
                fight_card = get_fight_card(event_url)
                if not fight_card:
                    logger.warning(f"No fight card found for {event_title}")
                    continue
                
                # Generate predictions for each fight
                for fight in fight_card:
                    fighter_a = fight["fighter_a"]
                    fighter_b = fight["fighter_b"]
                    
                    # Check if predictions already exist
                    db = SessionLocal()
                    existing = db.query(ModelPrediction).filter(
                        ModelPrediction.fighter_a == fighter_a,
                        ModelPrediction.fighter_b == fighter_b
                    ).first()
                    
                    if existing:
                        db.close()
                        continue
                    
                    db.close()
                    
                    # Generate predictions for all three models
                    try:
                        result = get_ensemble_prediction(fighter_a, fighter_b)
                        if result and not result.get('error'):
                            new_predictions += 3  # ML, Ensemble, Sim
                            logger.info(f"Generated predictions for {fighter_a} vs {fighter_b}")
                    except Exception as e:
                        logger.error(f"Failed to generate prediction for {fighter_a} vs {fighter_b}: {e}")
            
            except Exception as e:
                logger.error(f"Error processing event {event.get('title', 'Unknown')}: {e}")
        
        logger.info(f"Event check completed. Generated {new_predictions} new predictions")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        scheduler.last_event_check = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Error in new event detection job: {e}")
        logger.error(traceback.format_exc())

def job_update_fighter_profiles():
    """Job function for updating fighter profiles"""
    try:
        logger.info("Starting fighter profile updates job...")
        
        db = SessionLocal()
        fighters = db.query(Fighter).all()
        db.close()
        
        updated_count = 0
        
        for fighter in fighters:
            if not fighter.profile_url:
                continue
            
            try:
                data = scrape_fighter_stats(fighter.name, fighter.profile_url)
                if data:
                    save_fighter_to_db(data)
                    updated_count += 1
                    
                    # Small delay to be respectful to the website
                    import time
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Failed to update {fighter.name}: {e}")
        
        logger.info(f"Fighter profile update completed. Updated {updated_count} fighters")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        scheduler.last_profile_update = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Error in fighter profile updates job: {e}")
        logger.error(traceback.format_exc())

def job_check_completed_events():
    """Job function for checking completed events"""
    try:
        logger.info("Checking for completed events job...")
        
        # This is a placeholder for result checking logic
        # In a full implementation, you would:
        # 1. Scrape UFC results from completed events
        # 2. Match them with existing predictions
        # 3. Update the actual_winner and correct fields
        
        # For now, we'll just log that the check happened
        db = SessionLocal()
        pending_predictions = db.query(ModelPrediction).filter(
            ModelPrediction.actual_winner.is_(None)
        ).count()
        db.close()
        
        logger.info(f"Found {pending_predictions} predictions awaiting results")
        logger.info("Result checking completed (manual result entry still required)")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        scheduler.last_result_check = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Error checking completed events job: {e}")
        logger.error(traceback.format_exc())

def job_cleanup_old_predictions():
    """Job function for cleaning up old predictions"""
    try:
        logger.info("Starting prediction cleanup job...")
        
        # Calculate cutoff date (6 months ago)
        cutoff_date = datetime.utcnow() - timedelta(days=180)
        
        db = SessionLocal()
        
        # Delete old predictions (keep results for statistics)
        # We might want to archive rather than delete, or only delete pending predictions
        old_pending = db.query(ModelPrediction).filter(
            ModelPrediction.timestamp < cutoff_date,
            ModelPrediction.actual_winner.is_(None)  # Only delete pending predictions
        )
        
        count = old_pending.count()
        old_pending.delete()
        db.commit()
        db.close()
        
        logger.info(f"Cleanup completed. Removed {count} old pending predictions")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        scheduler.last_cleanup = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Error during cleanup job: {e}")
        logger.error(traceback.format_exc())


# Global scheduler instance
_scheduler_instance = None

def get_scheduler():
    """Get the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        database_url = os.getenv('DATABASE_URL', 'sqlite:///data/fighter_stats.db')
        _scheduler_instance = UFCScheduler(database_url)
    return _scheduler_instance

def start_scheduler():
    """Start the global scheduler"""
    scheduler = get_scheduler()
    scheduler.start()
    return scheduler

def stop_scheduler():
    """Stop the global scheduler"""
    global _scheduler_instance
    if _scheduler_instance:
        _scheduler_instance.shutdown()
        _scheduler_instance = None
