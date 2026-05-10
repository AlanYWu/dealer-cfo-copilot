from app.agent import _parse_json_array


def test_parse_json_array_clean():
    assert _parse_json_array('["A", "B"]') == ["A", "B"]


def test_parse_json_array_with_prose_around():
    out = "Sure, here's the array: [\"A\", \"B\"]\nLet me know if you want more."
    assert _parse_json_array(out) == ["A", "B"]


def test_parse_json_array_invalid_returns_empty():
    assert _parse_json_array("no array here") == []
    assert _parse_json_array("[not json]") == []


def test_parse_json_array_caps_at_three():
    assert _parse_json_array('["a","b","c","d","e"]') == ["a", "b", "c"]
