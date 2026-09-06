"""Multilingual, user-initiated voice transcription for the journey planner."""

import os


class TranscriptionProviderError(Exception):
    """A recoverable transcription failure that is safe to show to a passenger."""


class OpenAITranscriptionProvider:
    def __init__(self, *, api_key: str, model: str = "gpt-4o-mini-transcribe") -> None:
        self._api_key = api_key
        self._model = model

    def transcribe(self, audio: bytes, content_type: str, language_hint: str = "en") -> str:
        try:
            from openai import OpenAI

            extension = {"audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav"}.get(content_type, "webm")
            language = "mr" if language_hint == "mr" else "en"
            prompt = (
                "मराठीमध्ये महाराष्ट्रातील बस प्रवासाची विनंती. पुणे, मुंबई, नाशिक, सातारा, "
                "महाबळेश्वर, उद्या, सकाळ आणि एसी यांसारखे शब्द अचूक लिहा. वक्ता थोडे इंग्रजी वापरू शकतो."
                if language == "mr"
                else
                "An English bus journey request spoken in India. Write English speech in Latin script, never "
                "as phonetic Devanagari. Accurately preserve Maharashtra place names "
                "such as Pune, Mumbai, Nashik, Satara and Mahabaleshwar, plus dates, times and AC preferences. "
                "The speaker may briefly code-switch into Marathi."
            )
            response = OpenAI(api_key=self._api_key).audio.transcriptions.create(
                model=self._model,
                language=language,
                prompt=prompt,
                file=(f"journey-request.{extension}", audio, content_type),
            )
            transcript = getattr(response, "text", "").strip()
            if not transcript:
                raise TranscriptionProviderError("We could not hear a journey request in that recording.")
            return transcript
        except TranscriptionProviderError:
            raise
        except Exception as error:
            raise TranscriptionProviderError("Voice transcription is temporarily unavailable. You can still type your journey.") from error


def configured_transcription_provider() -> OpenAITranscriptionProvider:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise TranscriptionProviderError("Voice transcription is not configured. You can still type your journey.")
    return OpenAITranscriptionProvider(
        api_key=api_key,
        model=os.getenv("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"),
    )
