# backend/src/ufc_scheduler.py
"""
UFC Fight Simulator - Azure-Optimized Scheduler
Handles automated data updates for UFC events, fighter profiles, and results.
"""

import logging
import traceback
import time
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED
from src.db import (
    SessionLocal,
    ModelPrediction,
    Fighter,
    SchedulerMetadata,
    upsert_fight_result,
)
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
        self.last_ml_retrain = None
        
        # Load persisted timestamps from database
        self._load_timestamps()
    
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
        """Setup jobs optimized for Azure Free Tier (manual triggers only)"""
        try:
            # NOTE: Azure Free Tier doesn't support Always On, so automatic scheduling is disabled
            # All jobs must be triggered manually via API endpoints or external schedulers
            
            logger.info("AZURE FREE TIER: Automatic scheduling disabled")
            logger.info("Use these manual endpoints instead:")
            logger.info("   POST /check-new-events - Check for new UFC events")
            logger.info("   POST /check-completed-events - Update fight results") 
            logger.info("   POST /retrain-ml-model - Retrain ML model")
            logger.info("   GET /scheduler/status - Check scheduler status")
            logger.info("Consider using GitHub Actions or external CRON for automation")
            
            # Jobs are commented out but kept for reference when upgrading to paid tier
            # Uncomment these when moving to Azure Pro/Standard with Always On enabled
            
            # self.scheduler.add_job(
            #     func=job_check_new_events,
            #     trigger='cron', day_of_week='wed', hour=2, minute=0,
            #     id='check_new_events', name='Check for New UFC Events',
            #     replace_existing=True
            # )
            
            # self.scheduler.add_job(
            #     func=job_check_completed_events,
            #     trigger='cron', day_of_week='sun', hour=6, minute=0,
            #     id='check_completed_events', name='Check Completed Events',
            #     replace_existing=True
            # )
            
            # self.scheduler.add_job(
            #     func=job_retrain_ml_model,
            #     trigger='cron', day_of_week='mon', hour=4, minute=0,
            #     id='retrain_ml_model', name='Retrain ML Model',
            #     replace_existing=True
            # )
            
            logger.info("Manual-only scheduler configured for Azure Free Tier")
            
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
                        url_a = fight.get("url_a")
                        url_b = fight.get("url_b")
                        
                        # Check if predictions already exist
                        db = SessionLocal()
                        existing = db.query(ModelPrediction).filter(
                            ModelPrediction.fighter_a == fighter_a,
                            ModelPrediction.fighter_b == fighter_b
                        ).first()
                        
                        if existing:
                            db.close()
                            continue
                        
                        # Check if fighters exist in database, scrape if missing (like simulate event endpoint)
                        from src.fighter_scraper import scrape_fighter_stats
                        from src.ufc_image_scraper import get_fighter_image_url
                        
                        f1 = db.query(Fighter).filter(Fighter.name == fighter_a).first()
                        if not f1 and url_a:
                            logger.info(f"Fighter {fighter_a} not found in database, scraping data...")
                            try:
                                stats = scrape_fighter_stats(fighter_a, url_a)
                                if stats:
                                    image_url = get_fighter_image_url(fighter_a)
                                    if image_url:
                                        stats["image_url"] = image_url
                                    save_fighter_to_db(stats)
                                    f1 = db.query(Fighter).filter(Fighter.name == fighter_a).first()
                                    logger.info(f"Successfully scraped and saved data for {fighter_a}")
                            except Exception as scrape_error:
                                logger.error(f"Failed to scrape data for {fighter_a}: {scrape_error}")
                        
                        f2 = db.query(Fighter).filter(Fighter.name == fighter_b).first()
                        if not f2 and url_b:
                            logger.info(f"Fighter {fighter_b} not found in database, scraping data...")
                            try:
                                stats = scrape_fighter_stats(fighter_b, url_b)
                                if stats:
                                    image_url = get_fighter_image_url(fighter_b)
                                    if image_url:
                                        stats["image_url"] = image_url
                                    save_fighter_to_db(stats)
                                    f2 = db.query(Fighter).filter(Fighter.name == fighter_b).first()
                                    logger.info(f"Successfully scraped and saved data for {fighter_b}")
                            except Exception as scrape_error:
                                logger.error(f"Failed to scrape data for {fighter_b}: {scrape_error}")
                        
                        db.close()
                        
                        # Only proceed if we have both fighters
                        if not f1 or not f2:
                            logger.warning(f"Skipping prediction for {fighter_a} vs {fighter_b} - missing fighter data (f1: {bool(f1)}, f2: {bool(f2)})")
                            continue
                        
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
        """Update fighter profile data and missing images"""
        try:
            logger.info("Starting fighter profile updates and image checks...")
            self.last_profile_update = datetime.utcnow()
            
            db = SessionLocal()
            fighters = db.query(Fighter).all()
            
            updated_count = 0
            images_updated = 0
            
            for fighter in fighters:
                fighter_updated = False
                
                # Update profile stats if URL exists
                if fighter.profile_url:
                    try:
                        data = scrape_fighter_stats(fighter.name, fighter.profile_url)
                        if data:
                            save_fighter_to_db(data)
                            updated_count += 1
                            fighter_updated = True
                            
                    except Exception as e:
                        logger.error(f"Failed to update profile for {fighter.name}: {e}")
                
                # Check for missing image (if we didn't just update profile stats which might include image)
                if not fighter.image_url:
                    try:
                        from src.ufc_image_scraper import get_fighter_image_url
                        image_url = get_fighter_image_url(fighter.name)
                        if image_url:
                            fighter.image_url = image_url
                            images_updated += 1
                            logger.info(f"Added missing image for {fighter.name}")
                            
                            # Save the image update if we didn't already update this fighter
                            if not fighter_updated:
                                db.add(fighter)
                                
                    except Exception as e:
                        logger.error(f"Failed to get image for {fighter.name}: {e}")
                
                # Small delay to be respectful to the website
                time.sleep(1)
            
            # Commit any image updates
            db.commit()
            db.close()
            
            logger.info(f"Fighter profile update completed. Updated {updated_count} profiles, {images_updated} missing images")
            
        except Exception as e:
            logger.error(f"Error in fighter profile updates: {e}")
            logger.error(traceback.format_exc())
    
    def check_completed_events_manual(self):
        """Manual trigger for checking completed events (called from API)"""
        try:
            logger.info("Manual trigger: Checking completed events...")
            result = job_check_completed_events()  # This now returns a dict with results
            
            if "error" in result:
                return {"error": result["error"]}
            
            updated_count = result.get("updated_predictions", 0)
            
            # Also get pending predictions count
            db = SessionLocal()
            pending_predictions = db.query(ModelPrediction).filter(
                ModelPrediction.actual_winner.is_(None)
            ).count()
            db.close()
            
            return {
                "message": f"Manual result check completed. Updated {updated_count} predictions.",
                "updated_predictions": updated_count,
                "pending_predictions": pending_predictions,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Manual event check failed: {e}")
            return {"error": str(e)}
    
    def check_new_events_manual(self):
        """Manual trigger for checking new events (called from API)"""
        try:
            logger.info("Manual trigger: Checking new events...")
            job_check_new_events()  # Call the module-level function
            return {
                "message": "Manual event check completed",
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
        """Clean up predictions older than 120 days but keep lifetime records"""
        try:
            logger.info("Starting prediction cleanup...")
            self.last_cleanup = datetime.utcnow()
            
            # Calculate cutoff date (120 days ago)
            cutoff_date = datetime.utcnow() - timedelta(days=120)
            
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
    
    def _save_metadata(self, key: str, value: str):
        """Save scheduler metadata to database"""
        try:
            db = SessionLocal()
            try:
                metadata = db.query(SchedulerMetadata).filter(SchedulerMetadata.key == key).first()
                
                if metadata:
                    metadata.value = value
                    metadata.updated_at = datetime.utcnow()
                else:
                    metadata = SchedulerMetadata(key=key, value=value, updated_at=datetime.utcnow())
                    db.add(metadata)
                
                db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to save metadata {key}: {e}")
    
    def _load_metadata(self, key: str) -> str | None:
        """Load scheduler metadata from database"""
        try:
            db = SessionLocal()
            metadata = db.query(SchedulerMetadata).filter(SchedulerMetadata.key == key).first()
            db.close()
            return metadata.value if metadata else None
        except Exception as e:
            logger.error(f"Failed to load metadata {key}: {e}")
            return None
    
    def _load_timestamps(self):
        """Load all timestamp data from database on startup"""
        last_event_check = self._load_metadata('last_event_check')
        if last_event_check:
            try:
                self.last_event_check = datetime.fromisoformat(last_event_check)
            except ValueError:
                self.last_event_check = None
        
        last_profile_update = self._load_metadata('last_profile_update')
        if last_profile_update:
            try:
                self.last_profile_update = datetime.fromisoformat(last_profile_update)
            except ValueError:
                self.last_profile_update = None
                
        last_result_check = self._load_metadata('last_result_check')
        if last_result_check:
            try:
                self.last_result_check = datetime.fromisoformat(last_result_check)
            except ValueError:
                self.last_result_check = None
                
        last_cleanup = self._load_metadata('last_cleanup')
        if last_cleanup:
            try:
                self.last_cleanup = datetime.fromisoformat(last_cleanup)
            except ValueError:
                self.last_cleanup = None
                
        last_ml_retrain = self._load_metadata('last_ml_retrain')
        if last_ml_retrain:
            try:
                self.last_ml_retrain = datetime.fromisoformat(last_ml_retrain)
            except ValueError:
                self.last_ml_retrain = None
    
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
            'last_cleanup': self.last_cleanup.isoformat() if self.last_cleanup else None,
            'last_ml_retrain': self.last_ml_retrain.isoformat() if self.last_ml_retrain else None
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
    
    def _retrain_ml_model(self, min_new_results: int = 10):
        """Retrain the ML model if sufficient new results are available"""
        try:
            logger.info("Checking if ML model retraining is needed...")
            
            db = SessionLocal()
            
            # Check how many new results we have since last retraining
            last_retrain = self._load_metadata('last_ml_retrain')
            if last_retrain:
                last_retrain_date = datetime.fromisoformat(last_retrain)
                new_results_count = db.query(ModelPrediction).filter(
                    ModelPrediction.actual_winner.is_not(None),
                    ModelPrediction.timestamp > last_retrain_date
                ).count()
            else:
                # First time - count all results
                new_results_count = db.query(ModelPrediction).filter(
                    ModelPrediction.actual_winner.is_not(None)
                ).count()
            
            db.close()
            
            logger.info(f"Found {new_results_count} new fight results since last retraining")
            
            if new_results_count < min_new_results:
                logger.info(f"Not enough new results ({new_results_count} < {min_new_results}), skipping retraining")
                return {"message": f"Insufficient new results ({new_results_count} < {min_new_results})", "retrained": False}
            
            # Trigger retraining process
            logger.info(f"Retraining ML model with {new_results_count} new results...")
            
            # Step 1: Rebuild dataset
            from src.ml.prepare_ml_dataset import build_dataset
            build_dataset()
            logger.info("Dataset rebuilt with latest results")
            
            # Step 2: Retrain model
            from src.ml.train_model import retrain_model
            model_metrics = retrain_model()
            logger.info(f"Model retrained successfully: {model_metrics}")
            
            # Step 3: Update timestamp
            timestamp = datetime.utcnow()
            self.last_ml_retrain = timestamp
            self._save_metadata('last_ml_retrain', timestamp.isoformat())
            
            # Step 4: Regenerate pending predictions for future events
            db = SessionLocal()
            try:
                _regenerate_future_predictions(db)
            except Exception as e:
                logger.error(f"Error regenerating future predictions: {e}")
            finally:
                db.close()
            
            return {
                "message": f"ML model retrained with {new_results_count} new results",
                "retrained": True,
                "new_results_count": new_results_count,
                "model_metrics": model_metrics,
                "timestamp": timestamp.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error during ML model retraining: {e}")
            logger.error(traceback.format_exc())
            return {"error": str(e), "retrained": False}

    def retrain_ml_model_manual(self, min_new_results: int = 5):
        """Manual trigger for ML model retraining (called from API)"""
        try:
            logger.info("Manual trigger: ML model retraining...")
            result = self._retrain_ml_model(min_new_results)
            return result
        except Exception as e:
            logger.error(f"Manual ML retraining failed: {e}")
            return {"error": str(e), "retrained": False}

    def cleanup_old_predictions_manual(self):
        """Manual trigger for cleaning up old predictions (called from API)"""
        try:
            logger.info("Manual trigger: Cleaning up old predictions...")
            result = job_cleanup_old_predictions()
            if not result:
                return {"message": "Cleanup completed", "deleted_predictions": 0}
            return result
        except Exception as e:
            logger.error(f"Manual cleanup failed: {e}")
            return {"error": str(e)}

    # ...existing code...
    

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
                    url_a = fight.get("url_a")
                    url_b = fight.get("url_b")
                    
                    # Check if predictions already exist
                    db = SessionLocal()
                    existing = db.query(ModelPrediction).filter(
                        ModelPrediction.fighter_a == fighter_a,
                        ModelPrediction.fighter_b == fighter_b
                    ).first()
                    
                    if existing:
                        db.close()
                        continue
                    
                    # Check if fighters exist in database, scrape if missing (like simulate event endpoint)
                    from src.ufc_image_scraper import get_fighter_image_url
                    
                    f1 = db.query(Fighter).filter(Fighter.name == fighter_a).first()
                    if not f1 and url_a:
                        logger.info(f"Fighter {fighter_a} not found in database, scraping data...")
                        try:
                            stats = scrape_fighter_stats(fighter_a, url_a)
                            if stats:
                                image_url = get_fighter_image_url(fighter_a)
                                if image_url:
                                    stats["image_url"] = image_url
                                save_fighter_to_db(stats)
                                f1 = db.query(Fighter).filter(Fighter.name == fighter_a).first()
                                logger.info(f"Successfully scraped and saved data for {fighter_a}")
                        except Exception as scrape_error:
                            logger.error(f"Failed to scrape data for {fighter_a}: {scrape_error}")
                    
                    f2 = db.query(Fighter).filter(Fighter.name == fighter_b).first()
                    if not f2 and url_b:
                        logger.info(f"Fighter {fighter_b} not found in database, scraping data...")
                        try:
                            stats = scrape_fighter_stats(fighter_b, url_b)
                            if stats:
                                image_url = get_fighter_image_url(fighter_b)
                                if image_url:
                                    stats["image_url"] = image_url
                                save_fighter_to_db(stats)
                                f2 = db.query(Fighter).filter(Fighter.name == fighter_b).first()
                                logger.info(f"Successfully scraped and saved data for {fighter_b}")
                        except Exception as scrape_error:
                            logger.error(f"Failed to scrape data for {fighter_b}: {scrape_error}")
                    
                    db.close()
                    
                    # Only proceed if we have both fighters
                    if not f1 or not f2:
                        logger.warning(f"Skipping prediction for {fighter_a} vs {fighter_b} - missing fighter data (f1: {bool(f1)}, f2: {bool(f2)})")
                        continue
                    
                    # Generate predictions for all three models
                    try:
                        predictions_created = 0
                        
                        # Generate ML prediction
                        ml_result = get_ensemble_prediction(fighter_a, fighter_b, model_type="ml", log_to_db=True)
                        if ml_result and not ml_result.get('error'):
                            predictions_created += 1
                            logger.info(f"Generated ML prediction for {fighter_a} vs {fighter_b}")
                        
                        # Generate Ensemble prediction  
                        ensemble_result = get_ensemble_prediction(fighter_a, fighter_b, model_type="ensemble", log_to_db=True)
                        if ensemble_result and not ensemble_result.get('error'):
                            predictions_created += 1
                            logger.info(f"Generated Ensemble prediction for {fighter_a} vs {fighter_b}")
                        
                        # Generate Simulation prediction
                        sim_result = get_ensemble_prediction(fighter_a, fighter_b, model_type="sim", log_to_db=True)
                        if sim_result and not sim_result.get('error'):
                            predictions_created += 1
                            logger.info(f"Generated Simulation prediction for {fighter_a} vs {fighter_b}")
                        
                        new_predictions += predictions_created
                        
                        if predictions_created == 3:
                            logger.info(f"Successfully generated all 3 predictions for {fighter_a} vs {fighter_b}")
                        else:
                            logger.warning(f"Only generated {predictions_created}/3 predictions for {fighter_a} vs {fighter_b}")
                            
                    except Exception as e:
                        logger.error(f"Failed to generate predictions for {fighter_a} vs {fighter_b}: {e}")
            
            except Exception as e:
                logger.error(f"Error processing event {event.get('title', 'Unknown')}: {e}")
        
        logger.info(f"Event check completed. Generated {new_predictions} new predictions")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        timestamp = datetime.utcnow()
        scheduler.last_event_check = timestamp
        scheduler._save_metadata('last_event_check', timestamp.isoformat())
        
    except Exception as e:
        logger.error(f"Error in new event detection job: {e}")
        logger.error(traceback.format_exc())

def job_update_fighter_profiles():
    """Job function for updating fighter profiles and missing images"""
    try:
        logger.info("Starting fighter profile updates and image checks job...")
        
        db = SessionLocal()
        fighters = db.query(Fighter).all()
        
        updated_count = 0
        images_updated = 0
        
        for fighter in fighters:
            fighter_updated = False
            
            # Update profile stats if URL exists
            if fighter.profile_url:
                try:
                    data = scrape_fighter_stats(fighter.name, fighter.profile_url)
                    if data:
                        save_fighter_to_db(data)
                        updated_count += 1
                        fighter_updated = True
                        
                except Exception as e:
                    logger.error(f"Failed to update profile for {fighter.name}: {e}")
            
            # Check for missing image (if we didn't just update profile stats which might include image)
            if not fighter.image_url:
                try:
                    from src.ufc_image_scraper import get_fighter_image_url
                    image_url = get_fighter_image_url(fighter.name)
                    if image_url:
                        fighter.image_url = image_url
                        images_updated += 1
                        logger.info(f"Added missing image for {fighter.name}")
                        
                        # Save the image update if we didn't already update this fighter
                        if not fighter_updated:
                            db.add(fighter)
                            
                except Exception as e:
                    logger.error(f"Failed to get image for {fighter.name}: {e}")
            
            # Small delay to be respectful to the website
            time.sleep(1)
        
        # Commit any image updates
        db.commit()
        db.close()
        
        logger.info(f"Fighter profile update completed. Updated {updated_count} profiles, {images_updated} missing images")
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        timestamp = datetime.utcnow()
        scheduler.last_profile_update = timestamp
        scheduler._save_metadata('last_profile_update', timestamp.isoformat())
        
    except Exception as e:
        logger.error(f"Error in fighter profile updates job: {e}")
        logger.error(traceback.format_exc())

def job_check_completed_events():
    """Job function for checking completed events and updating results"""
    try:
        logger.info("Checking for completed events and updating results...")
        
        from src.ufc_scraper import get_completed_event_links, get_fight_results, normalize_fighter_name
        
        # Get completed events from the last 7 days
        completed_events = get_completed_event_links(days_back=7)
        logger.info(f"Found {len(completed_events)} completed events in the last 7 days")
        
        if not completed_events:
            logger.info("No completed events found in the specified timeframe")
            # Update timestamp even if no events found
            scheduler = get_scheduler()
            timestamp = datetime.utcnow()
            scheduler.last_result_check = timestamp
            scheduler._save_metadata('last_result_check', timestamp.isoformat())
            return {"updated_predictions": 0}
        
        db = SessionLocal()
        total_updated = 0
        total_fight_results_found = 0
        detailed_results = []
        
        try:
            for event in completed_events:
                logger.info(f"Processing results for: {event['title']}")
                
                try:
                    # Get fight results from this event
                    fight_results = get_fight_results(event['url'])
                    total_fight_results_found += len(fight_results)
                    logger.info(f"Found {len(fight_results)} fight results for {event['title']}")
                    
                    event_matches = 0
                    for result in fight_results:
                        try:
                            fighter_a_norm = normalize_fighter_name(result['fighter_a'])
                            fighter_b_norm = normalize_fighter_name(result['fighter_b'])
                            winner_norm = normalize_fighter_name(result['winner'])
                            fighter_a_raw = result['fighter_a']
                            fighter_b_raw = result['fighter_b']
                            winner_raw = result['winner']
                            
                            # Find matching predictions in database
                            predictions = db.query(ModelPrediction).filter(
                                ModelPrediction.actual_winner.is_(None)
                            ).all()
                            
                            fight_matched = False
                            for prediction in predictions:
                                pred_a_norm = normalize_fighter_name(prediction.fighter_a)
                                pred_b_norm = normalize_fighter_name(prediction.fighter_b)
                                
                                # Check if this prediction matches the fight result
                                if ((pred_a_norm == fighter_a_norm and pred_b_norm == fighter_b_norm) or
                                    (pred_a_norm == fighter_b_norm and pred_b_norm == fighter_a_norm)):
                                    
                                    # Determine the actual winner in terms of our prediction
                                    if winner_norm == pred_a_norm:
                                        actual_winner = prediction.fighter_a
                                    elif winner_norm == pred_b_norm:
                                        actual_winner = prediction.fighter_b
                                    else:
                                        logger.warning(f"Winner {result['winner']} doesn't match either fighter in prediction")
                                        continue
                                    
                                    # Update the prediction with actual result
                                    prediction.actual_winner = actual_winner
                                    prediction.correct = (prediction.predicted_winner == actual_winner)
                                    
                                    logger.info(f"Updated prediction: {prediction.fighter_a} vs {prediction.fighter_b} - Winner: {actual_winner}, Correct: {prediction.correct}")
                                    total_updated += 1
                                    event_matches += 1
                                    fight_matched = True
                            
                            # Persist fight results even if we didn't have a prediction match
                            loser_raw = None
                            if winner_norm == fighter_a_norm:
                                loser_raw = fighter_b_raw
                            elif winner_norm == fighter_b_norm:
                                loser_raw = fighter_a_raw

                            if loser_raw:
                                upsert_fight_result(
                                    db,
                                    fighter_name=winner_raw,
                                    opponent_name=loser_raw,
                                    result="win",
                                    event=event['title'],
                                    event_date=event.get('date') or event.get('date_text'),
                                )
                                upsert_fight_result(
                                    db,
                                    fighter_name=loser_raw,
                                    opponent_name=winner_raw,
                                    result="loss",
                                    event=event['title'],
                                    event_date=event.get('date') or event.get('date_text'),
                                )
                            else:
                                logger.warning(f"Could not determine loser for fight result: {result}")

                            # Track unmatched fights for debugging
                            if not fight_matched:
                                detailed_results.append({
                                    "fight": f"{result['fighter_a']} vs {result['fighter_b']}",
                                    "winner": result['winner'],
                                    "status": "No matching prediction found",
                                    "event": event['title']
                                })
                                logger.warning(f"No matching prediction found for: {result['fighter_a']} vs {result['fighter_b']} (Winner: {result['winner']})")
                                    
                        except Exception as e:
                            logger.error(f"Error processing fight result {result}: {e}")
                            continue
                    
                    logger.info(f"Event {event['title']}: {event_matches} fights matched out of {len(fight_results)} results found")
                            
                except Exception as e:
                    logger.error(f"Error getting results for event {event['title']}: {e}")
                    continue
            
            # Commit all updates
            if total_updated > 0:
                db.commit()
                logger.info(f"Successfully updated {total_updated} predictions with fight results")
                logger.info(f"Total fight results found across all events: {total_fight_results_found}")
                logger.info(f"Unmatched fights: {len(detailed_results)}")
                for unmatched in detailed_results:
                    logger.info(f"  - {unmatched['fight']} (Winner: {unmatched['winner']}) in {unmatched['event']}")
            else:
                logger.info("No predictions were updated - no matching fights found")
                logger.info(f"Total fight results found: {total_fight_results_found}")
                logger.info(f"All {len(detailed_results)} fights were unmatched")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating predictions: {e}")
            raise
        finally:
            db.close()
        
        # Update the global scheduler instance's timestamp
        scheduler = get_scheduler()
        timestamp = datetime.utcnow()
        scheduler.last_result_check = timestamp
        scheduler._save_metadata('last_result_check', timestamp.isoformat())
        
        return {
            "updated_predictions": total_updated,
            "total_fight_results_found": total_fight_results_found,
            "unmatched_fights": len(detailed_results),
            "detailed_unmatched": detailed_results
        }
        
    except Exception as e:
        logger.error(f"Error in job_check_completed_events: {e}")
        logger.error(traceback.format_exc())
        return {"error": str(e)}

def job_cleanup_old_predictions():
    """Job function for cleaning up old predictions"""
    try:
        logger.info("Starting prediction cleanup job...")
        
        # Calculate cutoff date (120 days ago)
        cutoff_date = datetime.utcnow() - timedelta(days=120)
        
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
        timestamp = datetime.utcnow()
        scheduler.last_cleanup = timestamp
        scheduler._save_metadata('last_cleanup', timestamp.isoformat())
        
        return {
            "message": "Cleanup completed",
            "deleted_predictions": count,
            "cutoff_date": cutoff_date.isoformat(),
            "timestamp": timestamp.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error during cleanup job: {e}")
        logger.error(traceback.format_exc())

def _regenerate_future_predictions(db):
    """Regenerate pending predictions for future events after model retraining"""
    try:
        logger.info("Regenerating pending predictions for future events...")
        
        def parse_event_date(value):
            if not value:
                return None
            if isinstance(value, datetime):
                return value.date()
            if isinstance(value, str):
                normalized = value.replace("Sept.", "Sep.").replace("Sept", "Sep")
                for fmt in ("%Y-%m-%d", "%b %d, %Y", "%b. %d, %Y", "%B %d, %Y"):
                    try:
                        return datetime.strptime(normalized, fmt).date()
                    except ValueError:
                        continue
            return None
        
        today = datetime.utcnow().date()
        pending_predictions = db.query(ModelPrediction).filter(
            ModelPrediction.actual_winner.is_(None)
        ).all()
        
        regenerated_count = 0
        skipped_count = 0
        
        for prediction in pending_predictions:
            # Check if this prediction is for a future event
            fight_result = db.query(FightResult).filter(
                or_(
                    and_(
                        FightResult.fighter_name == prediction.fighter_a,
                        FightResult.opponent_name == prediction.fighter_b
                    ),
                    and_(
                        FightResult.fighter_name == prediction.fighter_b,
                        FightResult.opponent_name == prediction.fighter_a
                    )
                )
            ).order_by(FightResult.id.desc()).first()
            
            # If no fight_result, assume it's a future event (no results yet)
            # If fight_result exists, check if event_date is in the future
            is_future_event = True
            if fight_result and fight_result.event_date:
                event_date = parse_event_date(fight_result.event_date)
                if event_date:
                    is_future_event = event_date > today
            
            if not is_future_event:
                skipped_count += 1
                continue
            
            # Regenerate prediction with new model
            try:
                result = get_ensemble_prediction(
                    prediction.fighter_a,
                    prediction.fighter_b,
                    model_type=prediction.model,
                    log_to_db=False  # We'll update manually
                )
                
                # Update existing prediction with new values
                prediction.predicted_winner = prediction.fighter_a if result["fighter_a_win_prob"] > 50 else prediction.fighter_b
                prediction.fighter_a_prob = result["fighter_a_win_prob"]
                prediction.fighter_b_prob = result["fighter_b_win_prob"]
                prediction.draw_prob = 100.0 - result["fighter_a_win_prob"] - result["fighter_b_win_prob"]
                prediction.timestamp = datetime.utcnow()  # Update timestamp to reflect regeneration
                
                # Update penalty score and diffs if available
                if "penalty_score" in result and result["penalty_score"] is not None:
                    prediction.penalty_score = float(result["penalty_score"])
                if "diffs" in result:
                    diffs = result["diffs"]
                    if "weight_diff" in diffs:
                        prediction.weight_diff = int(diffs["weight_diff"]) if diffs["weight_diff"] is not None else None
                    if "height_diff" in diffs:
                        prediction.height_diff = int(diffs["height_diff"]) if diffs["height_diff"] is not None else None
                    if "reach_diff" in diffs:
                        prediction.reach_diff = int(diffs["reach_diff"]) if diffs["reach_diff"] is not None else None
                    if "age_diff" in diffs:
                        prediction.age_diff = int(diffs["age_diff"]) if diffs["age_diff"] is not None else None
                
                regenerated_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to regenerate prediction for {prediction.fighter_a} vs {prediction.fighter_b} ({prediction.model}): {e}")
                continue
        
        db.commit()
        logger.info(f"Regenerated {regenerated_count} pending predictions for future events (skipped {skipped_count} past events)")
        
    except Exception as e:
        logger.error(f"Error regenerating future predictions: {e}")
        logger.error(traceback.format_exc())

def job_retrain_ml_model():
    """Job function for retraining the ML model"""
    try:
        logger.info("Starting ML model retraining job...")
        
        # Check how many new results we have
        db = SessionLocal()
        
        # Get scheduler instance to check last retrain time
        scheduler = get_scheduler()
        last_retrain = scheduler._load_metadata('last_ml_retrain')
        min_new_results = 10  # Require at least 10 new results
        
        if last_retrain:
            last_retrain_date = datetime.fromisoformat(last_retrain)
            new_results_count = db.query(ModelPrediction).filter(
                ModelPrediction.actual_winner.is_not(None),
                ModelPrediction.timestamp > last_retrain_date
            ).count()
        else:
            # First time - count all results
            new_results_count = db.query(ModelPrediction).filter(
                ModelPrediction.actual_winner.is_not(None)
            ).count()
        
        db.close()
        
        logger.info(f"Found {new_results_count} new fight results since last retraining")
        
        if new_results_count < min_new_results:
            logger.info(f"Not enough new results ({new_results_count} < {min_new_results}), skipping retraining")
            return
        
        # Trigger retraining process
        logger.info(f"Retraining ML model with {new_results_count} new results...")
        
        # Step 1: Rebuild dataset
        from src.ml.prepare_ml_dataset import build_dataset
        build_dataset()
        logger.info("Dataset rebuilt with latest results")
        
        # Step 2: Retrain model
        try:
            from src.ml.train_model import retrain_model
            model_metrics = retrain_model()
            logger.info(f"Model retrained successfully: {model_metrics}")
        except ImportError as e:
            logger.error(f"Missing ML dependencies for retraining: {e}")
            logger.error("Please install required packages: pip install scikit-learn pandas joblib")
            return
        except Exception as e:
            logger.error(f"Error during model retraining: {e}")
            return
        
        # Step 3: Update timestamp
        timestamp = datetime.utcnow()
        scheduler.last_ml_retrain = timestamp
        scheduler._save_metadata('last_ml_retrain', timestamp.isoformat())
        
        logger.info(f"ML model retraining completed with {new_results_count} new results")
        
        # Step 4: Regenerate pending predictions for future events
        db = SessionLocal()
        try:
            _regenerate_future_predictions(db)
        except Exception as e:
            logger.error(f"Error regenerating future predictions: {e}")
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"Error in ML model retraining job: {e}")
        logger.error(traceback.format_exc())
    finally:
        if 'db' in locals():
            db.close()


# Global scheduler instance
_scheduler_instance = None

def get_scheduler():
    """Get the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        from src.azure_config import get_database_path
        database_url = os.getenv('DATABASE_URL') or get_database_path()
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
