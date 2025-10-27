## Networking internal API

### Install
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run the API server
```bash
uvicorn api_app:app --reload --host 127.0.0.1 --port 8000
```

### Example calls

Create user:
```bash
curl -X POST http://127.0.0.1:8000/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password_hash":"hash","name":"User"}'
```

Get user by email:
```bash
curl http://127.0.0.1:8000/users/by-email/user@example.com
```

Create contact:
```bash
curl -X POST http://127.0.0.1:8000/contacts \
  -H 'Content-Type: application/json' \
  -d '{"user_id":1,"name":"Alice","email":"alice@co.com"}'
```

List contacts for user:
```bash
curl http://127.0.0.1:8000/users/1/contacts
```

Create meeting:
```bash
curl -X POST http://127.0.0.1:8000/meetings \
  -H 'Content-Type: application/json' \
  -d '{"user_id":1,"contact_id":1,"meeting_type":"Coffee"}'
```

List meetings for contact:
```bash
curl http://127.0.0.1:8000/contacts/1/meetings
```


