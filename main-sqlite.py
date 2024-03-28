import uvicorn
from fastapi import FastAPI, Request, HTTPException, UploadFile, Form, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
import g4f
import sqlite3
import string
import random
import requests
import pkg_resources
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import asyncio

load_dotenv()
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()
db_url = os.environ['DB_URL_SQLITE']
PASSWORD = os.environ.get('PASSWORD')

last_git_chack = datetime.now()-timedelta(days=3)

app.mount("/web", StaticFiles(directory="web"), name="web")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

async def generate_uuid():
    uuid = random.choice(string.ascii_lowercase)
    for _ in range(31):
        uuid += random.choice(string.ascii_lowercase+string.digits)
    return uuid

async def get_git_version():
    global git_version, last_git_chack
    if last_git_chack + timedelta(days=1) < datetime.now():
        try:
            git_version = requests.get('https://pypi.org/pypi/g4f/json').json()["info"]["version"]
        except:
            git_version = requests.get('https://api.github.com/repos/xtekky/gpt4free/releases/latest').json()["tag_name"]
        last_git_chack = datetime.now()

@app.get("/")
async def main():
    return FileResponse("web/index.html")

@app.get("/api/create")
async def create_chat(headers: Request):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    chat_id = await generate_uuid()
    while True:
        cur.execute("SELECT chat_id FROM chat_info")
        for chats_id in cur.fetchall():
            if chats_id[0] == chat_id:
                chat_id = await generate_uuid()
                break
        else:
            break
    cur.execute('INSERT INTO chat_info (chat_id, creation_date) VALUES (?, ?)', (chat_id, datetime.now()))
    conn.commit()
    cur.close()
    conn.close()

    return {'status':'success','chat_id': chat_id}

@app.get("/api/chats")
async def chats_list(headers: Request):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    a = []
    cur.execute("SELECT * FROM chat_info")
    chats_info = [[value1, value2, value3] for (value1, value2, value3) in cur.fetchall()]
    chats_info.sort(key=lambda x: x[-1], reverse=True)
    for item in chats_info:
        a.append({
            'chat_id': item[0],
            'title': item[1]
        })
    cur.close()
    conn.close()
    return a

@app.post("/api/create_title")
async def create_title(headers: Request, chat_id: str = Form(...), generate: bool = Form(...), message: str = Form(...)):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    if generate == True:
        mess = f'''come up with a short title for this text. Send only one sentence with the title of the text. Don't write anything except the name. Do not make any notes or additions. Don't translate anything. Don't write any links or lists. Read everything after the colon and specify the name: "{message[:1000]}"'''
        response = await g4f.ChatCompletion.create_async(
            model='gpt-3.5-turbo',
            provider=g4f.Provider.You,
            messages=[{'role': 'user', 'content': mess}],
            stream=False,
        )
        response = response.replace('**','').replace('\"','').replace('#','')
        cur.execute('UPDATE chat_info SET title_name = ? WHERE chat_id = ?', (response, chat_id,))
        conn.commit()
        cur.close()
        conn.close()
        return response
    else:
        cur.execute('UPDATE chat_info SET title_name = ? WHERE chat_id = ?', (message, chat_id,))
        conn.commit()
        cur.close()
        conn.close()
        return message 

@app.get("/api/delete")
async def delete_chat(headers: Request, chat_id: str):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    cur.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
    cur.execute("DELETE FROM chat_info WHERE chat_id = ?", (chat_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {'status': 'success'}

@app.post("/api/req")
async def req(headers: Request, chat_id: str = Form(...), message: str = Form(...), model: str = Form(...), provider: str = Form(...), web_search: bool = Form(...), image_base64: str = Form(None), image: UploadFile = File(None)):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    if model not in g4f.models._all_models:
        raise HTTPException(status_code=400, detail="model not found")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    kwargs = {}
    image_base64_format = ''
    if image != None:
        if image.filename != '' and g4f.image.is_allowed_extension(image.filename):
            kwargs['image'] = g4f.image.to_image(image.file, image.filename.endswith('.svg'))
        image_base64_format = f"![]({image_base64})\n"
    if web_search == True:
        kwargs['web_search'] = True
    if provider == 'default': provider = None
    messages = []
    cur.execute("SELECT role, message FROM messages WHERE chat_id = ?", (chat_id,))
    for (role, mess) in cur.fetchall():
        if mess.startswith('![](data:image/png;base64,'):
            mess = ')\n'.join(mess.split(')\n')[1:])
        messages.append({
            'role': role,
            'content': mess
        })
    cur.execute('INSERT INTO messages (chat_id, message_id, role, message) VALUES (?,?,?,?)', (chat_id, len(messages)+1, 'user', image_base64_format+message,))
    conn.commit()
    messages.append({"role": "user", "content": message})
    cur.close()
    conn.close()

    async def response_send(messages, model, chat_id, provider, **kwargs):
        text = ''
        try:
            response = g4f.ChatCompletion.create_async(
                model=model,
                provider=provider,
                messages=messages,
                stream=True,
                **kwargs
            )

            async for mess in response:
                if '<!-- generated images start -->' in str(mess):
                    continue
                text += str(mess)
                yield str(mess)
        except Exception as ex:
            text += f'#### Error. Try again later.\n\nModel: `{model}`\nError details:\n```\n{ex}\n```'
            yield text
        finally:
            conn = sqlite3.connect(db_url)
            cur = conn.cursor()
            cur.execute('INSERT INTO messages (chat_id, message_id, role, message) VALUES (?,?,?,?)', (chat_id, len(messages)+1, 'assistant', text,))
            conn.commit()
            cur.close()
            conn.close()    
    
    return StreamingResponse(response_send(messages, model, chat_id, provider=provider, **kwargs), media_type="text/event-stream")

@app.get("/api/history")
async def chats(headers: Request, chat_id: str):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT role, message FROM messages WHERE chat_id = ?", (chat_id,))
    a = []
    for (role, message) in cur.fetchall():
        a.append({
            'role': role,
            'content': message
        })
    cur.close()
    conn.close()
    return a

@app.get("/api/models")
async def models():
    return g4f.models._all_models

@app.get("/api/get_best_providers")
async def get_prov(model: str):
    best_prov = g4f.models.ModelUtils.convert[model].best_provider
    responce = []
    if type(best_prov) == g4f.providers.retry_provider.RetryProvider:
        for prov in best_prov.providers:
            responce.append((prov.__name__, prov.working))
        return responce
    else:
        return [(best_prov.__name__, best_prov.working)]

@app.get("/api/version")
async def versin_g4f():
    await get_git_version()
    cur_version = pkg_resources.get_distribution("g4f").version
    if git_version > cur_version:
        return f'{cur_version} -> {git_version}'
    else:
        return f'{cur_version}'
    
@app.get("/api/check_pass")
async def check_pass(headers: Request):
    return headers.headers.get('password', default='') == PASSWORD or PASSWORD == None

@app.get("/api/save_settings")
async def save_settings(headers: Request, model: str, provider: str, web_search: bool, generated_title: bool):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    cur.execute("UPDATE settings SET value = ? WHERE key = 'model'", (model,))
    cur.execute("UPDATE settings SET value = ? WHERE key = 'provider'", (provider,))
    cur.execute("UPDATE settings SET value = ? WHERE key = 'web_search'", (web_search,))
    cur.execute("UPDATE settings SET value = ? WHERE key = 'generated_title'", (generated_title,))
    conn.commit()
    cur.close()
    conn.close()
    return {'status': 'success'}

@app.get("/api/current_settings")
async def current_settings(headers: Request):
    if headers.headers.get('password', default='') != PASSWORD and PASSWORD != None:
        raise HTTPException(status_code=400, detail="wrong header")
    conn = sqlite3.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT * FROM settings")
    resp = {key: value for (key, value) in cur.fetchall()}
    cur.close()
    conn.close()
    return resp
        

if __name__ == "__main__":
    uvicorn.run(app)