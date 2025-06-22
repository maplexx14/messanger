# Telegram-like Chat Application

A real-time chat application built with FastAPI, PostgreSQL, and a modern frontend.

## Features

- Real-time messaging
- User authentication
- Private and group chats
- Message history
- Online status
- File sharing
- Modern UI similar to Telegram

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up PostgreSQL database and create a `.env` file with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/chatapp
SECRET_KEY=your-secret-key
```

4. Run the backend:
```bash
uvicorn app.main:app --reload
```

5. Run the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
.
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   └── websockets/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── requirements.txt
└── README.md
``` 