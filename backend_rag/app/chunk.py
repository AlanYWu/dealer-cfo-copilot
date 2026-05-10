"""Page text -> chunks. ~3-sentence windows with 1-sentence overlap."""
import re
from dataclasses import dataclass
from typing import List


_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z])")
CONTEXT_CHARS = 200
# Drop chunks shorter than this many tokens — page numbers, lone headers,
# and other PDF noise embed near generic queries by coincidence and pollute
# vector retrieval. 4 keeps short real sentences ("I love my dog.") and
# filters "1", "Page 7", "Table 3.2", etc.
MIN_CHUNK_WORDS = 4


@dataclass
class Chunk:
    text: str
    page: int
    char_start: int
    char_end: int
    page_text: str

    def context_before(self) -> str:
        return self.page_text[max(0, self.char_start - CONTEXT_CHARS) : self.char_start]

    def context_after(self) -> str:
        return self.page_text[self.char_end : min(len(self.page_text), self.char_end + CONTEXT_CHARS)]


def _split_sentences(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    parts = _SENT_SPLIT.split(text)
    return [p.strip() for p in parts if p.strip()]


def chunk_page(text: str, page: int, window: int = 3, overlap: int = 1) -> List[Chunk]:
    sentences = _split_sentences(text)
    if not sentences:
        return []
    step = max(1, window - overlap)
    out: List[Chunk] = []
    cursor = 0
    for i in range(0, len(sentences), step):
        window_sents = sentences[i : i + window]
        if not window_sents:
            break
        joined = " ".join(window_sents)
        start = text.find(window_sents[0], cursor)
        if start < 0:
            start = cursor
        end = start + len(joined)
        out.append(Chunk(text=joined, page=page, char_start=start, char_end=end, page_text=text))
        cursor = max(cursor, start + len(window_sents[0]))
        if i + window >= len(sentences):
            break
    return [c for c in out if len(c.text.split()) >= MIN_CHUNK_WORDS]
