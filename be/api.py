import faiss
import pickle
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from db import supabase

load_dotenv()
client = OpenAI()

# === FAISS & chunks 불러오기 ===
index = faiss.read_index("faiss_index.idx")

with open("faiss_chunks.pkl", "rb") as f:
    chunks = pickle.load(f)


# === 임베딩 함수 ===
def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(input=[text], model="text-embedding-3-small")
    return response.data[0].embedding


# === 검색 함수 ===
def retrieve_relevant_chunks(query: str, top_k: int = 5) -> list[str]:
    query_vector = np.array(get_embedding(query)).astype("float32").reshape(1, -1)
    D, I = index.search(query_vector, top_k)
    return [chunks[i] for i in I[0]]


# === 프롬프트 가져오기 ===
def load_prompt(prompt_name: str) -> str:
    try:
        result = (
            supabase.table("prompts")
            .select("content")
            .eq("prompt_nm", prompt_name)
            .execute()
        )
        if not result.data:
            raise ValueError(
                f"'{prompt_name}'에 해당하는 프롬프트가 존재하지 않습니다."
            )

        prompt = result.data[0]["content"]
        print(f"✅ 프롬프트 '{prompt_name}' 로드 완료")
        return prompt

    except Exception as e:
        print(f"❌ 프롬프트 '{prompt_name}' 로드 중 오류 발생: {e}")
        raise


def insert_prompt(prompt_name: str, prompt_text: str) -> None:
    """프롬프트를 데이터베이스에 삽입합니다."""
    supabase.table("khealth_prompt").update({"prompt": prompt_text}).eq(
        "prompt_nm", prompt_name
    ).execute()


def chat(message, chat_history):
    pass


def analyze(chat_history):
    pass
