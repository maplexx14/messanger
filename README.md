# Telegram-like Chat Application


* [Screenshots](#screens)  
* [Features](#features)  
* [Setup](#setup)  
* [Structure](#struct)  


<a name="screens"><h2>Screenshots</h2></a>
![screen](https://github.com/maplexx14/messanger/raw/main/img/chat_dark.png)
![screen](https://github.com/maplexx14/messanger/raw/main/img/chat_set.png)
![screen](https://github.com/maplexx14/messanger/raw/main/img/reg.png)
![screen](https://github.com/maplexx14/messanger/raw/main/img/chat_white.png)
![screen](https://github.com/maplexx14/messanger/raw/main/img/whiteth.png)
![screen](https://github.com/maplexx14/messanger/raw/main/img/reg.png)


A real-time chat application built with FastAPI, PostgreSQL, and a modern frontend.



<a name="screens"></a>
## Features

- Real-time messaging
- User authentication
- Private and group chats
- Message history
- Online status
- File sharing
- Modern UI similar to Telegram



<a name="setup"></a>
## Setup

### Docker

```bash
docker-compose up
```



<a name="struct"></a>
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
