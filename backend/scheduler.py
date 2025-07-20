# scheduler.py

import asyncio
from datetime import datetime
from services.crawler_service import CrawlerService
from services.console_service import ConsoleService

class DomainScheduler:
    def __init__(self, db, interval_minutes: int = 1440):  # default: once every 24 hours
        self.db = db
        self.interval_minutes = interval_minutes
        self.crawler_service = CrawlerService(db)
        self.console_service = ConsoleService(db)

    async def run(self):
        while True:
            print(f"[{datetime.utcnow().isoformat()}] Scheduler cycle started.")
            try:
                await self._crawl_all_domains()
            except Exception as e:
                print(f"Scheduler error: {str(e)}")
            print(f"[{datetime.utcnow().isoformat()}] Scheduler cycle completed.")
            await asyncio.sleep(self.interval_minutes * 60)

    async def _crawl_all_domains(self):
        domains = await self.db["domains"].find().to_list(length=1000)
        for domain in domains:
            url = domain.get("url")
            domain_id = str(domain.get("_id"))

            if url:
                print(f"Re-crawling domain: {url}")
                seo_data = await self.crawler_service.scrape_seo_metadata(url)
                await self.console_service.save_scrape_result(domain_id, seo_data)
