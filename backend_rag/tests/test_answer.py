from app import answer as ans
from app.schemas import Quote


def _q(text: str, page: int, score: float, qid: str = "q1") -> Quote:
    return Quote(
        id=qid, text=text, docId="d1", docName="Doc", folder="f",
        page=page, contextBefore="", contextAfter="", score=score,
    )


def test_extract_cited_pages_dedupes_and_sorts():
    text = "See [p. 12] and also [p. 4]; reiterating [p. 12]."
    assert ans._extract_cited_pages(text) == [4, 12]


def test_extract_cited_pages_handles_no_citations():
    assert ans._extract_cited_pages("no citations here") == []


def test_build_context_block_includes_page_and_doc():
    block = ans._build_context_block([_q("hello world", page=7, score=0.9)])
    assert "[p. 7]" in block
    assert "Doc" in block
    assert "hello world" in block


def test_synthesize_refuses_when_all_below_floor():
    # Both quotes below default floor (0.30).
    quotes = [
        _q("snippet a", page=1, score=0.10, qid="qa"),
        _q("snippet b", page=2, score=0.20, qid="qb"),
    ]
    result = ans.synthesize_answer("anything", quotes)
    assert result.refused is True
    assert ans.REFUSAL_MARKER in result.text
    # Lists candidate pages we examined.
    assert "1" in result.text and "2" in result.text


def test_synthesize_refuses_when_no_quotes():
    result = ans.synthesize_answer("anything", [])
    assert result.refused is True
    assert "No close matches" in result.text


def test_synthesize_calls_cli_when_quotes_pass_floor(monkeypatch):
    captured = {}

    def fake_call(prompt: str):
        captured["prompt"] = prompt
        return 'Here is the answer. "hello world" [p. 7]'

    monkeypatch.setattr(ans, "_call_claude_cli", fake_call)
    quotes = [_q("hello world", page=7, score=0.9)]
    result = ans.synthesize_answer("what does it say?", quotes)

    assert result.refused is False
    assert result.cited_pages == [7]
    assert result.quotes_used == ["q1"]
    assert "hello world" in captured["prompt"]
    assert "what does it say?" in captured["prompt"]


def test_synthesize_marks_refused_when_model_emits_refusal_marker(monkeypatch):
    monkeypatch.setattr(
        ans, "_call_claude_cli",
        lambda _p: f"{ans.REFUSAL_MARKER}. Closest pages: [3, 5].",
    )
    quotes = [_q("text", page=3, score=0.9)]
    result = ans.synthesize_answer("q", quotes)
    assert result.refused is True


def test_synthesize_handles_cli_unavailable(monkeypatch):
    monkeypatch.setattr(ans, "_call_claude_cli", lambda _p: None)
    quotes = [_q("text", page=3, score=0.9)]
    result = ans.synthesize_answer("q", quotes)
    assert result.refused is True
    assert "LLM unavailable" in result.text
