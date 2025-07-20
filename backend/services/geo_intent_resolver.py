# services/geo_intent_resolver.py

import requests
from typing import Optional, Dict

class GeoIntentResolver:
    def __init__(self):
        self.geo_api_url = "https://ipapi.co/{ip}/json/"

    def resolve_location_from_ip(self, ip_address: str) -> Optional[Dict[str, str]]:
        """Uses IP to extract geolocation info (city, region, country)"""
        try:
            response = requests.get(self.geo_api_url.format(ip=ip_address))
            if response.status_code == 200:
                data = response.json()
                return {
                    "ip": ip_address,
                    "city": data.get("city"),
                    "region": data.get("region"),
                    "country": data.get("country_name"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude")
                }
        except Exception as e:
            print(f"Geo resolve error: {e}")
        return None

    def resolve_geo_context(self, request_headers: Dict[str, str]) -> Optional[Dict[str, str]]:
        """Extract IP from request headers and get location context"""
        ip = request_headers.get("X-Forwarded-For") or request_headers.get("REMOTE_ADDR")
        if ip:
            return self.resolve_location_from_ip(ip.strip())
        return None
