@echo off

if not exist venv (
	python -m venv venv
	call .\venv\Scripts\activate.bat
	pip install -r requirements.txt
) else (
	call .\venv\Scripts\activate.bat
)

if not exist data.db (
	python create_db.py
)

python main-sqlite.py
pause