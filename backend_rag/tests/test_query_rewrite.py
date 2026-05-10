from app import query_rewrite as qr


def test_heuristic_rewrite_preserves_original():
    out = qr.heuristic_rewrite("How do I reset the airbag light?", vocab=[])
    assert out.startswith("How do I reset the airbag light?")


def test_heuristic_rewrite_blank_query():
    assert qr.heuristic_rewrite("", vocab=["Anything"]) == ""
    assert qr.heuristic_rewrite("   ", vocab=["Anything"]) == ""


def test_heuristic_rewrite_appends_vocab_match():
    out = qr.heuristic_rewrite(
        "what is the airbag procedure?",
        vocab=["GM Airbag Service Manual", "Brake Spec Sheet"],
    )
    assert "airbag" in out.lower()
    # Should have added the matching doc-name token, lowercased.
    assert "gm airbag service manual" in out.lower()
    # Non-matching doc shouldn't get appended.
    assert "brake spec sheet" not in out.lower()


def test_heuristic_rewrite_skips_already_present():
    out = qr.heuristic_rewrite(
        "tell me about airbag deployment",
        vocab=["airbag"],   # exact token already in query
    )
    # No appended copy of "airbag".
    assert out.lower().count("airbag") == 1


def test_heuristic_rewrite_filters_filler_only_query():
    # If the query is *only* filler, don't crash; return original.
    out = qr.heuristic_rewrite("what is the?", vocab=["Service Manual"])
    assert out == "what is the?"


def test_llm_rewrite_returns_none_when_cli_missing(monkeypatch):
    monkeypatch.setattr(qr.shutil, "which", lambda _name: None)
    assert qr.llm_rewrite("anything", vocab=["doc"]) is None


def test_llm_rewrite_returns_none_on_subprocess_failure(monkeypatch):
    monkeypatch.setattr(qr.shutil, "which", lambda _name: "/usr/bin/claude")

    class _Proc:
        returncode = 1
        stdout = ""
        stderr = "boom"

    monkeypatch.setattr(qr.subprocess, "run", lambda *a, **k: _Proc())
    assert qr.llm_rewrite("q", vocab=["d"]) is None


def test_llm_rewrite_takes_first_nonempty_line(monkeypatch):
    monkeypatch.setattr(qr.shutil, "which", lambda _name: "/usr/bin/claude")

    class _Proc:
        returncode = 0
        stdout = '\n  "rewritten airbag service procedure"   \nignored second line\n'
        stderr = ""

    monkeypatch.setattr(qr.subprocess, "run", lambda *a, **k: _Proc())
    assert qr.llm_rewrite("airbag", vocab=["doc"]) == "rewritten airbag service procedure"


def test_llm_rewrite_returns_none_on_timeout(monkeypatch):
    monkeypatch.setattr(qr.shutil, "which", lambda _name: "/usr/bin/claude")

    def _raise(*_a, **_k):
        raise qr.subprocess.TimeoutExpired(cmd="claude", timeout=30)

    monkeypatch.setattr(qr.subprocess, "run", _raise)
    assert qr.llm_rewrite("q", vocab=["d"]) is None
