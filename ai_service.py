import os
from typing import Any, Dict

import httpx


class AIService:
    def __init__(self) -> None:
        self.api_key = os.getenv("DIGITALOCEAN_INFERENCE_KEY", "")
        self.base_url = os.getenv(
            "DO_INFERENCE_BASE_URL",
            "https://api.digitalocean.com/v2/gen-ai/chat/completions",
        )
        self.model = os.getenv("DO_INFERENCE_MODEL", "openai/gpt-4o-mini")

    async def _chat_completion(self, system_prompt: str, user_payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("DIGITALOCEAN_INFERENCE_KEY is not set")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": str(user_payload)},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(self.base_url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        return httpx.Response(200, content=content).json()

    async def predict_eta(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You are a restaurant queue ETA engine for TablePing. "
            "Return strict JSON with keys: eta_low_min, eta_high_min, confidence. "
            "eta values must be integers in minutes and confidence in [0,1]."
        )
        return await self._chat_completion(system_prompt, payload)

    async def score_no_show_risk(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You are a no-show risk model for TablePing. "
            "Return strict JSON with keys: risk_bucket (LOW|MED|HIGH), risk_score, recommended_action."
        )
        return await self._chat_completion(system_prompt, payload)

    async def compose_sms_eta_update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You generate transactional SMS updates for restaurant waitlists. "
            "Return strict JSON with keys: sms_text, char_count. Keep concise and compliant."
        )
        return await self._chat_completion(system_prompt, payload)
