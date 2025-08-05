# python_backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# FAISS 인덱스 파일들 복사
COPY faiss_index.idx .
COPY faiss_chunks.pkl .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]