# helpers.py
def parse_merchant_trans_id(raw: str):
    s = str(raw)
    if ":" in s:
        parts = s.split(":", 2)
        if len(parts) == 3:
            kind, order_id, transaction_id = parts
            return kind, int(order_id), int(transaction_id)
        elif len(parts) == 2:
            kind, order_id = parts
            return kind, int(order_id), None
    return "service", int(s), None
