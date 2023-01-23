FROM python:3.10

ENV CLONE_URL=""

WORKDIR .

RUN if [ -d ".git" ]; then git stash ; git pull ; else git clone "$CLONE_URL" ; fi;

RUN pip install --no-cache-dir --upgrade -r requirements.txt

CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "7769"]